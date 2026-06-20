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
  campaigns: [],
  themePresets: [],
  refreshTokens: [],
  settings: {
    siteName: 'PushNotif Admin',
    widgetTitle: 'Langganan Notifikasi',
    widgetButton: 'Berlangganan',
    popupText: 'Aktifkan notifikasi agar tidak ketinggalan update terbaru.',
    defaultUrl: WIDGET_TARGET,
    enableWidget: true,
    allowedOrigins: '*',
    widgetPosition: 'bottom-right',
    widgetColor: '#4f94ff',
    widgetTextColor: '#ffffff',
    popupMode: 'popup',
    popupTemplate: 'center-top',
    popupHeading: 'Aktifkan Notifikasi',
    popupText: 'Aktifkan notifikasi agar tidak ketinggalan update terbaru.',
    popupActionText: 'Aktifkan',
    popupCancelText: 'Tutup',
    promptStrategy: 'soft',
    promptDelay: 1200,
    subscribeTheme: 'default-dark',
    customSubscribeCss: '',
    customSubscribeHtml: ''
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
  db.data.campaigns ||= [];
  db.data.themePresets ||= [];
  db.data.refreshTokens ||= [];
  db.data.settings ||= defaultData.settings;
  db.data.settings = { ...defaultData.settings, ...db.data.settings };

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

app.get('/api/settings', async (req, res) => {
  await db.read();
  res.json(db.data.settings || {});
});

app.get('/api/admin/settings', requireAuth, async (req, res) => {
  await db.read();
  res.json(db.data.settings || {});
});

app.get('/api/admin/settings/presets', requireAuth, async (req, res) => {
  await db.read();
  res.json({ presets: db.data.themePresets || [] });
});

app.post('/api/admin/settings/presets', requireAuth, async (req, res) => {
  const { name, preset } = req.body;

  if (!name || !preset) {
    return res.status(400).json({ error: 'Nama dan preset diperlukan' });
  }

  await db.read();

  const savedPreset = {
    id: nanoid(),
    name,
    preset,
    createdAt: new Date().toISOString()
  };

  db.data.themePresets.push(savedPreset);
  await db.write();

  res.json({ success: true, preset: savedPreset });
});

app.delete('/api/admin/settings/presets/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  await db.read();

  const beforeCount = db.data.themePresets.length;
  db.data.themePresets = db.data.themePresets.filter((item) => item.id !== id);

  if (db.data.themePresets.length === beforeCount) {
    return res.status(404).json({ error: 'Preset tidak ditemukan' });
  }

  await db.write();
  res.json({ success: true });
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

// Campaigns CRUD
app.get('/api/admin/campaigns', requireAuth, async (req, res) => {
  await db.read();

  res.json({ campaigns: db.data.campaigns.slice().reverse() });
});

app.post('/api/admin/campaigns', requireAuth, async (req, res) => {
  const { title, message, sendNow } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message required' });
  }

  const campaign = {
    id: nanoid(),
    title,
    message,
    sendNow: !!sendNow,
    status: sendNow ? 'sent' : 'draft',
    sent: sendNow ? db.data.subscribers.length : 0,
    createdAt: new Date().toISOString()
  };

  await db.read();
  db.data.campaigns.push(campaign);

  if (sendNow) {
    // send push immediately
    await sendPush({ title: campaign.title, body: campaign.message, url: db.data.settings?.defaultUrl || WIDGET_TARGET });
  }

  await db.write();

  res.json({ success: true, campaign });
});

app.put('/api/admin/campaigns/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};

  await db.read();

  const idx = db.data.campaigns.findIndex((c) => c.id === id);

  if (idx === -1) return res.status(404).json({ error: 'Campaign not found' });

  const existing = db.data.campaigns[idx];

  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };

  db.data.campaigns[idx] = updated;

  // If updating to sendNow and it was not sent before, trigger send
  if (updates.sendNow && !existing.sendNow) {
    await sendPush({ title: updated.title, body: updated.message, url: db.data.settings?.defaultUrl || WIDGET_TARGET });
    updated.status = 'sent';
    updated.sent = db.data.subscribers.length;
  }

  await db.write();

  res.json({ success: true, campaign: updated });
});

app.delete('/api/admin/campaigns/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  await db.read();

  const initial = db.data.campaigns.length;
  db.data.campaigns = db.data.campaigns.filter((c) => c.id !== id);

  const removed = initial !== db.data.campaigns.length;

  await db.write();

  if (!removed) return res.status(404).json({ error: 'Campaign not found' });

  res.json({ success: true });
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

  const appId = (req.query.appId || 'default').replace(/[^a-zA-Z0-9-_]/g, '');
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Push Widget</title>
  <style>
    body { margin: 0; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .widget-shell { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: transparent; }
    .widget-card { width: 100%; max-width: 340px; padding: 20px; border-radius: 20px; background: #0f172a; color: #eef2ff; box-sizing: border-box; box-shadow: 0 24px 80px rgba(0,0,0,0.24); border: 1px solid rgba(255,255,255,0.08); }
    .widget-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .widget-badge { width: 44px; height: 44px; border-radius: 14px; background: linear-gradient(135deg, #4f94ff, #2f80ed); display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .widget-title { margin: 0; font-size: 1rem; line-height: 1.3; }
    .widget-text { margin: 12px 0 18px; color: #cbd5e1; font-size: 0.95rem; line-height: 1.5; }
    .widget-buttons { display: grid; gap: 10px; }
    .widget-button { width: 100%; border: 0; border-radius: 14px; padding: 14px 16px; cursor: pointer; font-weight: 700; font-size: 0.98rem; }
    .widget-button.primary { background: #4f94ff; color: #fff; }
    .widget-button.secondary { background: rgba(255,255,255,0.08); color: #f8fafc; }
    .widget-status { margin-top: 14px; font-size: 0.9rem; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="widget-shell">
    <div class="widget-card" role="dialog" aria-label="Aktifkan notifikasi">
      <div class="widget-header">
        <div class="widget-badge">🔔</div>
        <div>
          <h1 class="widget-title">Aktifkan Notifikasi</h1>
          <p class="widget-text">Dapatkan update terbaru langsung di browser Anda jika mengizinkan notifikasi.</p>
        </div>
      </div>
      <div class="widget-buttons">
        <button id="enableButton" class="widget-button primary">Aktifkan Notifikasi</button>
        <button id="laterButton" class="widget-button secondary">Nanti</button>
      </div>
      <div id="statusMessage" class="widget-status" aria-live="polite"></div>
    </div>
  </div>
  <script>
    (function() {
      var appId = '${appId}';
      var storageKey = 'push-widget-status-' + appId;
      var statusMessage = document.getElementById('statusMessage');
      var enableButton = document.getElementById('enableButton');
      var laterButton = document.getElementById('laterButton');
      var apiOrigin = location.origin;
      var setStatus = function(value, message) {
        try { window.localStorage.setItem(storageKey, value); } catch (err) {}
        if (message) { statusMessage.textContent = message; }
        try {
          window.parent.postMessage({ type: 'push-widget-status', status: value, message: message }, apiOrigin);
        } catch (err) {}
      };

      function showMessage(text) {
        statusMessage.textContent = text;
      }

      function arrayBufferToBase64(base64String) {
        var padding = '='.repeat((4 - base64String.length % 4) % 4);
        var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        var rawData = window.atob(base64);
        var outputArray = new Uint8Array(rawData.length);
        for (var i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      }

      function getSavedStatus() {
        try { return window.localStorage.getItem(storageKey); } catch (err) { return null; }
      }

      function disableWidget(reason) {
        setStatus('disabled', reason || 'Fitur notifikasi tidak tersedia.');
        enableButton.disabled = true;
        laterButton.disabled = false;
      }

      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window) || !('fetch' in window)) {
        disableWidget('Browser tidak mendukung notifikasi push.');
        return;
      }

      var saved = getSavedStatus();
      if (saved === 'subscribed' || saved === 'denied' || saved === 'disabled') {
        disableWidget('Notifikasi sudah diatur.');
        return;
      }

      laterButton.addEventListener('click', function() {
        setStatus('dismissed', 'Ditunda untuk nanti.');
        showMessage('Kamu bisa mengaktifkan notifikasi kapan saja.');
      });

      enableButton.addEventListener('click', async function() {
        enableButton.disabled = true;
        showMessage('Memproses izin notifikasi...');

        try {
          var permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            setStatus('denied', 'Notifikasi tidak diaktifkan.');
            return;
          }
        } catch (err) {
          disableWidget('Permintaan izin dibatalkan.');
          return;
        }

        try {
          var registration = await navigator.serviceWorker.register('/sw.js');
        } catch (err) {
          disableWidget('Gagal mendaftarkan service worker.');
          return;
        }

        try {
          var vapidResp = await fetch('/api/vapid-public');
          var vapidData = await vapidResp.json();
          var applicationServerKey = arrayBufferToBase64(vapidData.publicKey);
          var subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
          });

          await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
          });

          setStatus('subscribed', 'Notifikasi berhasil diaktifkan.');
          enableButton.textContent = 'Berhasil!';
          enableButton.style.background = '#22c55e';
          laterButton.disabled = true;
        } catch (err) {
          console.error(err);
          disableWidget('Gagal mengaktifkan notifikasi.');
        }
      });
    })();
  </script>
</body>
</html>`;
  res.set('Content-Type', 'text/html');
  res.send(html);
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