import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

const defaultSettings = {
  siteName: 'PushNotif Admin',
  widgetTitle: 'Langganan Notifikasi',
  widgetButton: 'Berlangganan',
  popupText: 'Aktifkan notifikasi agar tidak ketinggalan update terbaru.',
  defaultUrl: 'http://localhost:5173',
  enableWidget: true,
  widgetPosition: 'bottom-right',
  allowedOrigins: '*',
};

export default function AdminSettings({ token, setStatus }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      return;
    }

    fetchSettings();
  }, [token]);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSettings({ ...defaultSettings, ...response.data });
      setLoading(false);
    } catch (err) {
      setStatus('Gagal memuat pengaturan: ' + (err.response?.data?.error || err.message));
      setLoading(false);
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${API_BASE}/admin/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSettings(response.data.settings);
      setStatus('Pengaturan berhasil disimpan');
    } catch (err) {
      setStatus('Gagal menyimpan pengaturan: ' + (err.response?.data?.error || err.message));
    }
  };

  const updateField = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  if (loading) {
    return <div className="card admin-settings"><p>Memuat pengaturan...</p></div>;
  }

  return (
    <div className="card admin-settings">
      <div className="section-header">
        <div>
          <h2>Pengaturan Panel</h2>
          <p>Edit konten widget, teks popup, dan URL default langsung dari admin.</p>
        </div>
        <button className="btn-primary" onClick={saveSettings}>Simpan Pengaturan</button>
      </div>

      <form onSubmit={saveSettings} className="settings-form">
        <label>Nama Aplikasi</label>
        <input
          value={settings.siteName}
          onChange={(e) => updateField('siteName', e.target.value)}
        />

        <label>Judul Widget</label>
        <input
          value={settings.widgetTitle}
          onChange={(e) => updateField('widgetTitle', e.target.value)}
        />

        <label>Teks Tombol Widget</label>
        <input
          value={settings.widgetButton}
          onChange={(e) => updateField('widgetButton', e.target.value)}
        />

        <label>Posisi Widget</label>
        <select
          value={settings.widgetPosition}
          onChange={(e) => updateField('widgetPosition', e.target.value)}
        >
          <option value="bottom-right">Bawah Kanan</option>
          <option value="bottom-left">Bawah Kiri</option>
          <option value="top-right">Atas Kanan</option>
          <option value="top-left">Atas Kiri</option>
        </select>

        <label>Teks Popup Halaman Beranda</label>
        <textarea
          rows="3"
          value={settings.popupText}
          onChange={(e) => updateField('popupText', e.target.value)}
        />

        <label>URL Default Notifikasi</label>
        <input
          value={settings.defaultUrl}
          onChange={(e) => updateField('defaultUrl', e.target.value)}
        />

        <label>Allowed Origins</label>
        <input
          value={settings.allowedOrigins}
          onChange={(e) => updateField('allowedOrigins', e.target.value)}
        />

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.enableWidget}
            onChange={(e) => updateField('enableWidget', e.target.checked)}
          />
          Aktifkan widget langganan di frontend
        </label>
      </form>
    </div>
  );
}
