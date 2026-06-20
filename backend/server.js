const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const webPush = require('web-push');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const { nanoid } = require('nanoid');

const DB_PATH = path.join(__dirname, 'db.json');
const VAPID_PATH = path.join(__dirname, 'vapid.json');
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'pushnotif-secret';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'klenny793@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'd4v1d174';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
const WIDGET_TARGET = process.env.WIDGET_TARGET || 'http://localhost:5173';
const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || '1h';
const REFRESH_TOKEN_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

const app = express();

app.use(cors({ origin: true }));
app.use(bodyParser.json());
app.use('/sw.js', express.static(path.join(__dirname, 'public', 'sw.js')));
app.use('/public', express.static(path.join(__dirname, 'public')));

const defaultData = {
  users: [],
  subscribers: [],
  notifications: [],
  refreshTokens: [],
  settings: {
    siteName: 'PushNotif Admin',
    widgetTitle: 'Langganan Notifikasi',
    widgetButton: 'Berlangganan',
    popupText: 'Aktifkan notifikasi agar tidak ketinggalan update terbaru.',
    defaultUrl: WIDGET_TARGET,
    enableWidget: true,
    allowedOrigins: '*',
    widgetPosition: 'bottom-right'
  }
};

const adapter = new JSONFile(DB_PATH);
const db = new Low(adapter, defaultData);

async function ensureDatabase() {
  await db.read();

  db.data ||= defaultData;
  db.data.users ||= [];
  db.data.subscribers ||= [];
  db.data.notifications ||= [];
  db.data.refreshTokens ||= [];

  const existingAdmin = db.data.users.find((user) => user.email === ADMIN_EMAIL);

  if (!existingAdmin) {
    const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);

    db.data.users.push({
      id: 'admin',
      name: 'Administrator',
      email: ADMIN_EMAIL,
      passwordHash,
      role: 'superadmin'
    });

    await db.write();
  }
}

function cleanupRefreshTokens() {
  db.data.refreshTokens = db.data.refreshTokens.filter((token) => token.expiresAt > Date.now());
}

function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'admin'
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );
}

function generateRefreshToken(userId) {
  const token = nanoid(48);
  const expiresAt = Date.now() + REFRESH_TOKEN_DURATION_MS;

  db.data.refreshTokens.push({
    id: nanoid(),
    userId,
    token,
    expiresAt
  });

  return token;
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireSuperAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  });
}

function ensureVapidKeys() {
  if (!fs.existsSync(VAPID_PATH)) {
    const keys = webPush.generateVAPIDKeys();
    fs.writeFileSync(VAPID_PATH, JSON.stringify(keys, null, 2));
  }

  const vapidKeys = JSON.parse(fs.readFileSync(VAPID_PATH, 'utf-8'));

  webPush.setVapidDetails(
    VAPID_SUBJECT,
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );

  return vapidKeys;
}

async function sendPush(notification) {
  const payload = JSON.stringify(notification);
  const subscribers = [...db.data.subscribers];

  for (const subscriber of subscribers) {
    try {
      await webPush.sendNotification(subscriber.subscription, payload);
    } catch (error) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        db.data.subscribers = db.data.subscribers.filter((item) => item.id !== subscriber.id);
      }
    }
  }

  await db.write();
}

app.get('/api/vapid-public', async (req, res) => {
  const vapidKeys = ensureVapidKeys();

  res.json({
    publicKey: vapidKeys.publicKey,
    target: WIDGET_TARGET
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  await db.read();

  const user = db.data.users.find((item) => item.email === email);

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Email or password salah' });
  }

  cleanupRefreshTokens();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user.id);

  await db.write();

  res.json({
    accessToken,
    refreshToken,
    name: user.name,
    email: user.email,
    role: user.role
  });
});

app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  await db.read();
  cleanupRefreshTokens();

  const stored = db.data.refreshTokens.find((item) => item.token === refreshToken);

  if (!stored) {
    await db.write();
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  const user = db.data.users.find((item) => item.id === stored.userId);

  if (!user) {
    db.data.refreshTokens = db.data.refreshTokens.filter((item) => item.token !== refreshToken);
    await db.write();
    return res.status(401).json({ error: 'Invalid refresh token user' });
  }

  db.data.refreshTokens = db.data.refreshTokens.filter((item) => item.token !== refreshToken);

  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user.id);

  await db.write();

  res.json({
    accessToken,
    refreshToken: newRefreshToken
  });
});

app.post('/api/auth/logout', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  await db.read();

  db.data.refreshTokens = db.data.refreshTokens.filter((item) => item.token !== refreshToken);

  await db.write();

  res.json({ success: true });
});

app.post('/api/subscribe', async (req, res) => {
  const subscription = req.body;

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Subscription object invalid' });
  }

  await db.read();

  const existing = db.data.subscribers.find((item) => item.endpoint === subscription.endpoint);

  if (existing) {
    existing.subscription = subscription;
  } else {
    db.data.subscribers.push({
      id: nanoid(),
      endpoint: subscription.endpoint,
      subscription
    });
  }

  await db.write();

  res.json({
    success: true,
    subscribers: db.data.subscribers.length
  });
});

app.get('/api/admin/summary', requireAuth, async (req, res) => {
  await db.read();

  res.json({
    subscribers: db.data.subscribers.length,
    notifications: db.data.notifications.length
  });
});

app.get('/api/admin/users', requireAuth, async (req, res) => {
  await db.read();

  const users = db.data.users.map(({ id, name, email, role }) => ({
    id,
    name,
    email,
    role: role || 'admin'
  }));

  res.json({ users });
});

app.post('/api/admin/users', requireAuth, async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  await db.read();

  if (db.data.users.some((user) => user.email === email)) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  const user = {
    id: nanoid(),
    name,
    email,
    passwordHash,
    role: 'admin'
  };

  db.data.users.push(user);

  await db.write();

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

app.post('/api/admin/users/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  await db.read();

  const user = db.data.users.find((item) => item.id === req.user.id);

  if (!user || !bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  user.passwordHash = bcrypt.hashSync(newPassword, 10);

  await db.write();

  res.json({ success: true });
});

app.get('/api/admin/settings', requireAuth, async (req, res) => {
  await db.read();
  res.json(db.data.settings || {});
});

app.post('/api/admin/settings', requireAuth, async (req, res) => {
  const updates = req.body;
  await db.read();

  db.data.settings = {
    ...db.data.settings,
    ...updates
  };

  await db.write();

  res.json({ success: true, settings: db.data.settings });
});

app.get('/api/admin/notifications', requireAuth, async (req, res) => {
  await db.read();

  res.json(db.data.notifications.slice().reverse());
});

app.get('/api/admin/subscribers', requireAuth, async (req, res) => {
  await db.read();

  res.json({ subscribers: db.data.subscribers });
});

app.post('/api/admin/notifications', requireAuth, async (req, res) => {
  const { title, message, url } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }

  const notification = {
    id: nanoid(),
    title,
    message,
    url: url || WIDGET_TARGET,
    sentAt: new Date().toISOString()
  };

  await db.read();

  db.data.notifications.push(notification);

  await sendPush({
    title: notification.title,
    body: notification.message,
    url: notification.url
  });

  res.json({
    success: true,
    notification
  });
});

app.get('/widget.js', (req, res) => {
  const script = `
(function() {
  function createWidget() {
    const button = document.createElement('button');
    button.textContent = document.currentScript?.dataset.widgetTitle || 'Langganan Notifikasi';
    button.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:12px 18px;background:#2f80ed;color:#fff;border:none;border-radius:24px;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,0.12);z-index:999999;';
    button.onclick = function() {
      window.open('${WIDGET_TARGET}/?utm_source=widget', '_blank');
    };
    document.body.appendChild(button);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
`;

  res.set('Content-Type', 'application/javascript');
  res.send(script);
});

app.get('/api/widget-info', (req, res) => {
  res.json({
    scriptUrl: `${req.protocol}://${req.get('host')}/widget.js`
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Resource not found' });
});

async function start() {
  await ensureDatabase();
  ensureVapidKeys();

  app.listen(PORT, () => {
    console.log(`Push notification backend running on http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});