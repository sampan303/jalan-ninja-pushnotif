import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import HomePage from './HomePage';
import SubscribePage from './SubscribePage';
import AdminPanel from './AdminPanel';

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

  const api = useMemo(() => {
    const instance = axios.create({ baseURL: API_BASE });

    instance.interceptors.request.use((config) => {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });

    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && refreshToken) {
          try {
            const response = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
            setAuthTokens(response.data.accessToken, response.data.refreshToken);
            error.config.headers.Authorization = `Bearer ${response.data.accessToken}`;
            return instance.request(error.config);
          } catch (refreshError) {
            clearAuthTokens();
            setStatus('Sesi login habis. Silakan login kembali.');
          }
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [accessToken, refreshToken, setAuthTokens, clearAuthTokens]);

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
    if (params.get('utm_source') === 'widget' || params.get('subscribe') === '1') {
      setView('subscribe');
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchSummary();
      fetchNotifications();
      fetchSubscribers();
    }
  }, [isLoggedIn, fetchSummary, fetchNotifications, fetchSubscribers]);

  const login = async (event) => {
    event.preventDefault();

    try {
      const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
      setAuthTokens(response.data.accessToken, response.data.refreshToken);
      setStatus('Login berhasil');
      setView('admin');
    } catch (err) {
      setStatus('Login gagal: ' + (err.response?.data?.error || err.message));
    }
  };

  const sendNotification = async (event) => {
    event.preventDefault();

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
      } catch {
        // ignore
      }
    }
    clearAuthTokens();
    setView('home');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>PushNotif Admin</h1>
          <p className="subheader">Kelola notifikasi, subscriber, dan pengaturan langsung dari panel.</p>
        </div>
        <div className="nav-buttons">
          <button type="button" onClick={() => setView('home')}>Home</button>
          <button type="button" onClick={() => setView('subscribe')}>Subscribe</button>
          <button type="button" onClick={() => setView('admin')}>Admin</button>
          {accessToken && <button type="button" className="btn-primary" onClick={logout}>Logout</button>}
        </div>
      </header>

      {view === 'home' ? (
        <HomePage openSubscribe={() => setView('subscribe')} />
      ) : view === 'subscribe' ? (
        <SubscribePage />
      ) : !isLoggedIn ? (
        <main className="login-view">
          <div className="card login-card">
            <h2>Masuk Admin</h2>
            <form onSubmit={login} className="settings-form">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="submit" className="btn-primary">Login</button>
            </form>
            <p className="status">{status}</p>
          </div>
        </main>
      ) : (
        <AdminPanel
          token={accessToken}
          setStatus={setStatus}
          summary={summary}
          notifications={notifications}
          subscribers={subscribers}
          sendNotification={sendNotification}
          title={title}
          setTitle={setTitle}
          message={message}
          setMessage={setMessage}
          url={url}
          setUrl={setUrl}
        />
      )}
    </div>
  );
}

export default App;
