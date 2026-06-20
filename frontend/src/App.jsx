import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import HomePage from './HomePage';
import SubscribePage from './SubscribePage';
import AdminUsers from './AdminUsers';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

function App() {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('pushnotif_access_token') || '');
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('pushnotif_refresh_token') || '');
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [title, setTitle] = useState('Halo pengguna!');
  const [message, setMessage] = useState('Ini adalah notifikasi dari admin.');
  const [url, setUrl] = useState(window.location.origin);
  const [status, setStatus] = useState('');
  const [summary, setSummary] = useState({ subscribers: 0, notifications: 0 });
  const [notifications, setNotifications] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [view, setView] = useState('home');

  const isLoggedIn = !!accessToken;

  const setAuthTokens = useCallback((access, refresh) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    localStorage.setItem('pushnotif_access_token', access);
    localStorage.setItem('pushnotif_refresh_token', refresh);
  }, []);

  const clearAuthTokens = useCallback(() => {
    setAccessToken('');
    setRefreshToken('');
    localStorage.removeItem('pushnotif_access_token');
    localStorage.removeItem('pushnotif_refresh_token');
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) {
      clearAuthTokens();
      return false;
    }

    try {
      const response = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
      setAuthTokens(response.data.accessToken, response.data.refreshToken);
      return true;
    } catch (err) {
      clearAuthTokens();
      return false;
    }
  }, [refreshToken, clearAuthTokens, setAuthTokens]);

  const api = useMemo(() => {
    const instance = axios.create({ baseURL: API_BASE });

    instance.interceptors.request.use((config) => {
      const token = localStorage.getItem('pushnotif_access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const refreshed = await refreshAccessToken();

          if (refreshed) {
            originalRequest.headers.Authorization = `Bearer ${localStorage.getItem('pushnotif_access_token')}`;
            return instance(originalRequest);
          }
        }

        return Promise.reject(error);
      }
    );

    return instance;
  }, [refreshAccessToken]);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await api.get('/admin/summary');
      setSummary(response.data);
    } catch (err) {
      setStatus('Fetch summary gagal');
    }
  }, [api]);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get('/admin/notifications');
      setNotifications(response.data);
    } catch (err) {
      setStatus('Fetch notifications gagal');
    }
  }, [api]);

  const fetchSubscribers = useCallback(async () => {
    try {
      const response = await api.get('/admin/subscribers');
      setSubscribers(response.data.subscribers);
    } catch (err) {
      setStatus('Fetch subscribers gagal');
    }
  }, [api]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscribe') === '1') {
  setView('subscribe');
}
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchSummary();
      fetchNotifications();
      fetchSubscribers();
    }
  }, [isLoggedIn, fetchSummary, fetchNotifications, fetchSubscribers]);

  const login = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
      setAuthTokens(response.data.accessToken, response.data.refreshToken);
      setStatus('Login berhasil');
      setView('admin');
    } catch (err) {
      setStatus('Login gagal: ' + (err.response?.data?.error || err.message));
    }
  };

  const sendNotification = async (e) => {
    e.preventDefault();

    try {
      await api.post('/admin/notifications', { title, message, url });
      setStatus('Notifikasi terkirim');
      fetchSummary();
      fetchNotifications();
    } catch (err) {
      setStatus('Kirim notifikasi gagal: ' + (err.response?.data?.error || err.message));
    }
  };

  const logout = async () => {
    if (refreshToken) {
      try {
        await axios.post(`${API_BASE}/auth/logout`, { refreshToken });
      } catch (err) {
        // ignore logout errors
      }
    }

    clearAuthTokens();
    setView('home');
  };

  return (
    <div className="app">
      <header>
        <div>
          <h1>PushNotif</h1>
          <p className="subheader">Admin dashboard, widget embed, dan halaman subscribe</p>
        </div>

        <div className="nav-buttons">
          <button onClick={() => setView('home')}>Info Widget</button>
          <button onClick={() => setView('subscribe')}>Subscribe Page</button>
          <button onClick={() => setView('admin')}>Admin</button>
          <button onClick={() => setView('users')}>Kelola Admin</button>
          {accessToken && <button onClick={logout}>Logout</button>}
        </div>
      </header>

{view === 'home' ? (
  <HomePage openSubscribe={() => setView('subscribe')} />
) : view === 'subscribe' ? (
  <SubscribePage />
) : view === 'users' ? (
  isLoggedIn ? <AdminUsers token={accessToken} setStatus={setStatus} /> : <p>Login required</p>
) : !isLoggedIn ? (
        <form onSubmit={login} className="card">
          <h2>Admin Login</h2>

          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />

          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          <button type="submit">Login</button>
          <p className="status">{status}</p>
        </form>
      ) : (
        <div className="card">
          <h2>Dashboard Admin</h2>

          <div className="summary">
            <div className="tile">
              <span>Subscribers</span>
              <strong>{summary.subscribers}</strong>
            </div>

            <div className="tile">
              <span>Notifications sent</span>
              <strong>{summary.notifications}</strong>
            </div>
          </div>

          <div className="subscribers-list">
            <h3>Daftar Subscribers</h3>
            {subscribers.length === 0 ? (
              <p>Tidak ada subscribers terdaftar.</p>
            ) : (
              <ul>
                {subscribers.map((item) => (
                  <li key={item.id}>{item.endpoint}</li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={sendNotification} className="send-form">
            <label>Judul</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />

            <label>Pesan</label>
            <textarea rows="3" value={message} onChange={(e) => setMessage(e.target.value)} />

            <label>URL</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} />

            <button type="submit">Kirim Notifikasi</button>
          </form>

          <p className="status">{status}</p>

          <div className="history">
            <h3>Riwayat Notifikasi</h3>
            {notifications.length === 0 ? (
              <p>Belum ada notifikasi terkirim.</p>
            ) : (
              <ul>
                {notifications.map((item) => (
                  <li key={item.id}>
                    <strong>{item.title}</strong>
                    <p>{item.message}</p>
                    <small>{new Date(item.sentAt).toLocaleString()}</small>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;