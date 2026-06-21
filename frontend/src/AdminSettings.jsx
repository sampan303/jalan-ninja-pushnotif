import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

const defaultSettings = {
  siteName: 'PushNotif Admin',
  widgetTitle: 'Langganan Notifikasi',
  widgetButton: 'Berlangganan',
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
  defaultUrl: 'http://localhost:5173',
  enableWidget: true,
  allowedOrigins: '*',
  widgetPosition: 'bottom-right',
  popupPosition: 'bottom-right',
  popupLogoUrl: '',
  popupImageUrl: '',
  popupIconUrl: '',
  popupWidth: '360px',
  popupHeight: 'auto',
  popupBorderRadius: '20px',
  popupBackgroundColor: '#0f172a',
  popupTextColor: '#eef2ff',
  subscribeTheme: 'default-dark',
  customSubscribeCss: '',
  customSubscribeHtml: ''
};

export default function AdminSettings({ token, setStatus }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [presets, setPresets] = useState([]);
  const [newPresetName, setNewPresetName] = useState('');

  const sampleHtml = `<div class="promo-card">\n  <h3>Upgrade akun kamu jadi VIP</h3>\n  <p>Aktifkan notifikasi dan dapatkan info gacor lebih cepat.</p>\n  <button class="btn-primary">Aktifkan Sekarang</button>\n</div>`;
  const sampleCss = `.promo-card {\n  background: linear-gradient(135deg, #1f1f3d, #1c225a);\n  border-radius: 24px;\n  padding: 22px;\n  color: #fff;\n  text-align: center;\n}\n.promo-card h3 { margin-bottom: 12px; }\n.promo-card p { opacity: 0.8; margin-bottom: 16px; }`;

  const exportTheme = () => {
    const payload = JSON.stringify(settings, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pushnotif-theme.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importTheme = () => {
    try {
      const parsed = JSON.parse(importJson);
      setSettings((current) => ({ ...current, ...parsed }));
      setStatus('Tema berhasil diimpor. Klik simpan untuk menyimpan pengaturan.');
    } catch (err) {
      setStatus('JSON tidak valid. Periksa kembali formatnya.');
    }
  };

  const themePresets = {
    defaultBlue: {
      widgetColor: '#4f94ff',
      widgetTextColor: '#ffffff',
      popupMode: 'popup',
      popupTemplate: 'center-top',
      popupHeading: 'Aktifkan Notifikasi',
      popupText: 'Dapatkan update penting jika aktifkan notifikasi sekarang.',
      popupActionText: 'Aktifkan',
      popupCancelText: 'Nanti saja',
      promptStrategy: 'soft',
      promptDelay: 1200,
      subscribeTheme: 'default-dark'
    },
    promoGold: {
      widgetColor: '#f5b300',
      widgetTextColor: '#111111',
      popupMode: 'banner',
      popupTemplate: 'top-right',
      popupHeading: 'Penawaran VIP',
      popupText: 'Klik Aktifkan untuk dapatkan notifikasi eksklusif dan promo gacor.',
      popupActionText: 'Gabung VIP',
      popupCancelText: 'Tutup',
      promptStrategy: 'delayed',
      promptDelay: 1800,
      subscribeTheme: 'default-light'
    },
    minimal: {
      widgetColor: '#252d3a',
      widgetTextColor: '#ffffff',
      popupMode: 'slide',
      popupTemplate: 'bottom-left',
      popupHeading: 'Aktifkan Pemberitahuan',
      popupText: 'Kami akan kirim update penting langsung ke browser Anda.',
      popupActionText: 'Ya, Aktifkan',
      popupCancelText: 'Tidak Terima',
      promptStrategy: 'soft',
      promptDelay: 1000,
      subscribeTheme: 'default-dark'
    }
  };

  const applyPreset = (preset) => {
    setSettings((current) => ({ ...current, ...themePresets[preset] }));
  };

  const fetchPresets = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/settings/presets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPresets(response.data.presets || []);
    } catch (err) {
      console.warn('Gagal memuat preset:', err.message);
    }
  };

  const fetchSettings = async () => {
    try {
      const [settingsResponse] = await Promise.all([
        axios.get(`${API_BASE}/admin/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetchPresets()
      ]);

      setSettings({ ...defaultSettings, ...settingsResponse.data });
      setLoading(false);
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Terjadi kesalahan saat memuat pengaturan.';
      setErrorMessage(message);
      setStatus('Gagal memuat pengaturan: ' + message);
      setLoading(false);
    }
  };

  const savePreset = async () => {
    if (!newPresetName.trim()) {
      setStatus('Nama preset diperlukan untuk menyimpan.');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/admin/settings/presets`, {
        name: newPresetName.trim(),
        preset: settings
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPresets((current) => [...current, response.data.preset]);
      setNewPresetName('');
      setStatus('Preset tema berhasil disimpan.');
    } catch (err) {
      setStatus('Gagal menyimpan preset: ' + (err.response?.data?.error || err.message));
    }
  };

  const deletePreset = async (id) => {
    try {
      await axios.delete(`${API_BASE}/admin/settings/presets/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPresets((current) => current.filter((preset) => preset.id !== id));
      setStatus('Preset berhasil dihapus.');
    } catch (err) {
      setStatus('Gagal menghapus preset: ' + (err.response?.data?.error || err.message));
    }
  };

  const applySavedPreset = (preset) => {
    setSettings((current) => ({ ...current, ...preset }));
  };

  const resetToDefault = () => {
    setSettings(defaultSettings);
    setStatus('Pengaturan direset ke default. Klik simpan untuk menerapkan.');
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    fetchSettings();
  }, [token]);

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
      {errorMessage && (
        <div className="error-banner">
          <p>{errorMessage}</p>
        </div>
      )}
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

        <div className="settings-grid">
          <div className="settings-item">
            <label>Teks Tombol Widget</label>
            <input
              value={settings.widgetButton}
              onChange={(e) => updateField('widgetButton', e.target.value)}
            />
          </div>
          <div className="settings-item">
            <label>Warna Widget</label>
            <input
              type="color"
              value={settings.widgetColor}
              onChange={(e) => updateField('widgetColor', e.target.value)}
            />
          </div>
          <div className="settings-item">
            <label>Warna Teks Widget</label>
            <input
              type="color"
              value={settings.widgetTextColor}
              onChange={(e) => updateField('widgetTextColor', e.target.value)}
            />
          </div>
        </div>

        <label>Posisi Widget</label>
        <select
          value={settings.widgetPosition}
          onChange={(e) => updateField('widgetPosition', e.target.value)}
        >
          <option value="bottom-right">Bawah Kanan</option>
          <option value="bottom-left">Bawah Kiri</option>
          <option value="top-center">Atas Tengah</option>
          <option value="top-right">Atas Kanan</option>
          <option value="top-left">Atas Kiri</option>
        </select>

        <label>Teks Popup Halaman Beranda</label>
        <textarea
          rows="3"
          value={settings.popupText}
          onChange={(e) => updateField('popupText', e.target.value)}
        />

        <div className="settings-grid">
          <div className="settings-item">
            <label>Mode Popup</label>
            <select value={settings.popupMode} onChange={(e) => updateField('popupMode', e.target.value)}>
              <option value="popup">Popup</option>
              <option value="banner">Banner</option>
              <option value="slide">Slide</option>
            </select>
          </div>
          <div className="settings-item">
            <label>Template Popup</label>
            <select value={settings.popupTemplate} onChange={(e) => updateField('popupTemplate', e.target.value)}>
              <option value="center-top">Center Top</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-right">Bottom Right</option>
              <option value="top-right">Top Right</option>
            </select>
          </div>
          <div className="settings-item">
            <label>Posisi Popup</label>
            <select value={settings.popupPosition} onChange={(e) => updateField('popupPosition', e.target.value)}>
              <option value="top-center">Top Center</option>
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </div>
          <div className="settings-item">
            <label>Popup Logo URL</label>
            <input
              value={settings.popupLogoUrl}
              onChange={(e) => updateField('popupLogoUrl', e.target.value)}
            />
          </div>
          <div className="settings-item">
            <label>Banner/Image URL</label>
            <input
              value={settings.popupImageUrl}
              onChange={(e) => updateField('popupImageUrl', e.target.value)}
            />
          </div>
          <div className="settings-item">
            <label>Popup Icon URL</label>
            <input
              value={settings.popupIconUrl}
              onChange={(e) => updateField('popupIconUrl', e.target.value)}
            />
          </div>
          <div className="settings-item">
            <label>Popup Width</label>
            <input
              value={settings.popupWidth}
              onChange={(e) => updateField('popupWidth', e.target.value)}
            />
          </div>
          <div className="settings-item">
            <label>Popup Height</label>
            <input
              value={settings.popupHeight}
              onChange={(e) => updateField('popupHeight', e.target.value)}
            />
          </div>
          <div className="settings-item">
            <label>Border Radius</label>
            <input
              value={settings.popupBorderRadius}
              onChange={(e) => updateField('popupBorderRadius', e.target.value)}
            />
          </div>
          <div className="settings-item">
            <label>Background Color</label>
            <input
              type="color"
              value={settings.popupBackgroundColor}
              onChange={(e) => updateField('popupBackgroundColor', e.target.value)}
            />
          </div>
          <div className="settings-item">
            <label>Text Color</label>
            <input
              type="color"
              value={settings.popupTextColor}
              onChange={(e) => updateField('popupTextColor', e.target.value)}
            />
          </div>
          <div className="settings-item">
            <label>Strategi Prompt</label>
            <select value={settings.promptStrategy} onChange={(e) => updateField('promptStrategy', e.target.value)}>
              <option value="soft">Soft ask immediately</option>
              <option value="hard">Show on click only</option>
              <option value="delayed">Delay after 3s</option>
            </select>
          </div>
          <div className="settings-item">
            <label>Delay Prompt (ms)</label>
            <input
              type="number"
              min="0"
              value={settings.promptDelay}
              onChange={(e) => updateField('promptDelay', Number(e.target.value))}
            />
          </div>
          <div className="settings-item">
            <label>Tema Subscribe</label>
            <select value={settings.subscribeTheme} onChange={(e) => updateField('subscribeTheme', e.target.value)}>
              <option value="default-dark">Default Dark</option>
              <option value="default-light">Default Light</option>
              <option value="custom">Custom CSS</option>
            </select>
          </div>
        </div>

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

        <div className="settings-section">
          <h3>Editor Tema Subscribe Page</h3>
          <p className="small-text">Tambahkan HTML atau CSS khusus yang akan dipakai pada halaman langganan.</p>

          <label>Popup Judul</label>
          <input
            value={settings.popupHeading}
            onChange={(e) => updateField('popupHeading', e.target.value)}
          />

          <label>Popup Tombol Aktifkan</label>
          <input
            value={settings.popupActionText}
            onChange={(e) => updateField('popupActionText', e.target.value)}
          />

          <label>Popup Tombol Tutup</label>
          <input
            value={settings.popupCancelText}
            onChange={(e) => updateField('popupCancelText', e.target.value)}
          />

          <label>Custom Subscribe HTML</label>
          <textarea
            rows="4"
            value={settings.customSubscribeHtml}
            onChange={(e) => updateField('customSubscribeHtml', e.target.value)}
          />

          <label>Custom Subscribe CSS</label>
          <textarea
            rows="4"
            value={settings.customSubscribeCss}
            onChange={(e) => updateField('customSubscribeCss', e.target.value)}
          />

          <div className="sample-actions">
            <button type="button" className="btn-ghost" onClick={() => updateField('customSubscribeHtml', sampleHtml)}>
              Muat sample HTML
            </button>
            <button type="button" className="btn-ghost" onClick={() => updateField('customSubscribeCss', sampleCss)}>
              Muat sample CSS
            </button>
          </div>
        </div>
      </form>

      <div className="preset-buttons">
        <button type="button" className="btn-ghost" onClick={() => applyPreset('defaultBlue')}>Preset Default</button>
        <button type="button" className="btn-ghost" onClick={() => applyPreset('promoGold')}>Preset Promo</button>
        <button type="button" className="btn-ghost" onClick={() => applyPreset('minimal')}>Preset Minimal</button>
        <button type="button" className="btn-ghost" onClick={exportTheme}>Export Theme</button>
        <button type="button" className="btn-ghost" onClick={resetToDefault}>Reset Default</button>
      </div>

      <div className="preset-save-section">
        <label>Nama Preset Tema</label>
        <div className="preset-save-row">
          <input
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="Contoh: Promo Pagi"
          />
          <button type="button" className="btn-primary" onClick={savePreset}>Simpan Preset</button>
        </div>
      </div>

      {presets.length > 0 && (
        <div className="preset-list">
          <h3>Saved Theme Presets</h3>
          {presets.map((preset) => (
            <div key={preset.id} className="preset-item">
              <span>{preset.name}</span>
              <div className="preset-actions">
                <button type="button" className="btn-ghost" onClick={() => applySavedPreset(preset.preset)}>Apply</button>
                <button type="button" className="btn-danger" onClick={() => deletePreset(preset.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="import-section">
        <label>Import Theme JSON</label>
        <textarea
          rows="4"
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
          placeholder='Paste theme JSON di sini untuk impor'
        />
        <button type="button" className="btn-ghost" onClick={importTheme}>Import Theme</button>
      </div>

      <div className="settings-preview">
        <div className="preview-card">
          <h3>Preview Widget</h3>
          <div className={`preview-widget ${settings.widgetPosition}`}>
            <button type="button" className="btn-primary" style={{ background: settings.widgetColor, color: settings.widgetTextColor }}>{settings.widgetButton}</button>
          </div>
          <p className="small-text">Posisi: {settings.widgetPosition}</p>
          <p className="small-text">Mode: {settings.popupMode}, Template: {settings.popupTemplate}, Strategy: {settings.promptStrategy}</p>
          <p className="small-text">Delay: {settings.promptDelay}ms</p>
          <button type="button" className="btn-ghost" onClick={() => setShowPreviewPopup(true)}>Tampilkan Preview Popup</button>
        </div>

        <div className="preview-card">
          <h3>Preview Subscribe Page</h3>
          <div className={`preview-page ${settings.subscribeTheme === 'default-light' ? 'preview-light' : 'preview-dark'}`}>
            <h4>{settings.widgetTitle}</h4>
            <p>{settings.popupText}</p>
            <button type="button" className="btn-primary" style={{ background: settings.widgetColor, color: settings.widgetTextColor }}>{settings.widgetButton}</button>
          </div>
          {settings.customSubscribeCss && <style>{settings.customSubscribeCss}</style>}
          {settings.customSubscribeHtml && (
            <div className="preview-html-snippet live-html-preview" dangerouslySetInnerHTML={{ __html: settings.customSubscribeHtml }} />
          )}
        </div>
      </div>

      {showPreviewPopup && (
        <div className={`preview-popup-overlay ${settings.popupTemplate}`} onClick={() => setShowPreviewPopup(false)}>
          <div className="preview-popup-card" onClick={(e) => e.stopPropagation()}>
            <h4>{settings.popupHeading}</h4>
            <p>{settings.popupText}</p>
            <div className="popup-actions">
              <button type="button" className="btn-primary" style={{ background: settings.widgetColor, color: settings.widgetTextColor }} onClick={() => setShowPreviewPopup(false)}>{settings.popupActionText}</button>
              <button type="button" className="btn-ghost" onClick={() => setShowPreviewPopup(false)}>{settings.popupCancelText}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
