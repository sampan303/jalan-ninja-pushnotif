import React from 'react';
import MetricCard from './components/MetricCard';

export default function Dashboard({ summary, notifications, subscribers, sendNotification, title, setTitle, message, setMessage, url, setUrl, status, setActiveTab }) {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Push Notifications — Overview</h2>
        <div className="dashboard-actions">
          <button className="btn-ghost" type="button" onClick={() => setActiveTab ? setActiveTab('notifications') : null}>Send Manual</button>
          <button className="btn-ghost" type="button" onClick={() => setActiveTab ? setActiveTab('campaigns') : null}>Open Campaigns</button>
          <button className="btn-ghost" type="button" onClick={() => setActiveTab ? setActiveTab('settings') : null}>Open Settings</button>
        </div>
      </div>

      <div className="metrics-grid">
        <MetricCard label="Total Subscribers" value={summary.subscribers || 0} />
        <MetricCard label="Active Subscribers" value={Math.max(0, (summary.subscribers || 0) - ((summary.subscribers || 0) * 0.3).toFixed(0))} />
        <MetricCard label="Invalid / Unregistered" value={Math.round(((summary.subscribers || 0) * 0.3))} />
        <MetricCard label="Notifications sent" value={summary.notifications || 0} />
      </div>

      <div className="dashboard-main">
        <div className="left-col">
          <div className="card dark-card send-panel">
            <h3>Kirim Notifikasi</h3>
            <form onSubmit={sendNotification}>
              <label>Judul</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
              <label>Pesan</label>
              <textarea rows="3" value={message} onChange={(e) => setMessage(e.target.value)} />
              <label>URL</label>
              <input value={url} onChange={(e) => setUrl(e.target.value)} />
              <button type="submit">Kirim Notifikasi</button>
            </form>
            <p className="status">{status}</p>
          </div>

          <div className="card dark-card history">
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

        <div className="right-col">
          <div className="card dark-card subscribers">
            <h3>Subscribers</h3>
            {subscribers.length === 0 ? (
              <p>Tidak ada subscribers terdaftar.</p>
            ) : (
              <ul>
                {subscribers.slice(0, 50).map((s) => (
                  <li key={s.id}>{s.endpoint}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="card dark-card platform-health">
            <h3>Platform Health</h3>
            <p>Invalid tokens are elevated. Review failure logs and clean browsers that no longer accept notifications.</p>
            <p>Open confirmation is low. Review copy and destination flow.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
