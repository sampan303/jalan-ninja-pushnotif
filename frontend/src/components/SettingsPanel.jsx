import React from 'react';

export default function SettingsPanel({ settings }) {
  return (
    <div className="card dark-card settings-panel">
      <h3>Shortcut Pengaturan</h3>
      <div className="settings-grid">
        <div className="settings-item">
          <span>Widget Aktif</span>
          <strong>{settings.enableWidget ? 'Ya' : 'Tidak'}</strong>
        </div>
        <div className="settings-item">
          <span>Posisi Widget</span>
          <strong>{settings.widgetPosition.replace('-', ' ')}</strong>
        </div>
        <div className="settings-item">
          <span>URL Default</span>
          <strong>{settings.defaultUrl}</strong>
        </div>
      </div>
    </div>
  );
}
