import { useState } from 'react';
import MetricCard from './components/MetricCard';
import SidebarTab from './components/SidebarTab';
import AdminUsers from './AdminUsers';
import AdminSettings from './AdminSettings';

export default function AdminPanel({ token, setStatus, summary, notifications, subscribers, sendNotification, title, setTitle, message, setMessage, url, setUrl }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="admin-panel">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">Admin Panel</div>
        <SidebarTab label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
        <SidebarTab label="Notifications" active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
        <SidebarTab label="Subscribers" active={activeTab === 'subscribers'} onClick={() => setActiveTab('subscribers')} />
        <SidebarTab label="Users" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
        <SidebarTab label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </aside>

      <main className="admin-content">
        <div className="admin-hero">
          <div>
            <h2>PushNotif Admin</h2>
            <p>Kelola pengaturan, notifikasi, subscriber, dan user langsung dari panel.</p>
          </div>
          <div className="hero-actions">
            <button type="button" className="btn-primary" onClick={() => setActiveTab('notifications')}>Kirim Notifikasi</button>
            <button type="button" className="btn-ghost" onClick={() => setActiveTab('settings')}>Edit Pengaturan</button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            <div className="metrics-grid">
              <MetricCard label="Total Subscribers" value={summary.subscribers || 0} />
              <MetricCard label="Notifications Sent" value={summary.notifications || 0} />
              <MetricCard label="Active Users" value={summary.subscribers ? Math.max(0, summary.subscribers - Math.round(summary.subscribers * 0.12)) : 0} />
              <MetricCard label="Invalid Tokens" value={summary.subscribers ? Math.round(summary.subscribers * 0.12) : 0} />
            </div>

            <div className="card dark-card overview-panel">
              <h3>Ringkasan Menu</h3>
              <div className="overview-grid">
                <div className="overview-item">
                  <h4>Kirim Notifikasi</h4>
                  <p>Tambahkan notifikasi push otomatis atau manual ke semua subscriber.</p>
                </div>
                <div className="overview-item">
                  <h4>Kelola Subscriber</h4>
                  <p>Lihat daftarnya, bersihkan endpoint lama, dan pantau adopsi.</p>
                </div>
                <div className="overview-item">
                  <h4>Pengaturan Widget</h4>
                  <p>Ubah teks widget, posisi popup, dan URL default dari panel ini.</p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'notifications' && (
          <div className="admin-grid">
            <div className="card dark-card send-panel">
              <h3>Kirim Notifikasi</h3>
              <form onSubmit={sendNotification} className="settings-form">
                <label>Judul</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
                <label>Pesan</label>
                <textarea rows="4" value={message} onChange={(e) => setMessage(e.target.value)} />
                <label>URL</label>
                <input value={url} onChange={(e) => setUrl(e.target.value)} />
                <button type="submit" className="btn-primary">Kirim Sekarang</button>
              </form>
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
        )}

        {activeTab === 'subscribers' && (
          <div className="card dark-card subscribers-panel">
            <h3>Daftar Subscribers</h3>
            <p className="small-text">Menampilkan hingga 100 subscriber terbaru. Gunakan backend untuk pembersihan lanjutan.</p>
            {subscribers.length === 0 ? (
              <p>Tidak ada subscribers terdaftar.</p>
            ) : (
              <ul>
                {subscribers.slice(0, 100).map((s) => (
                  <li key={s.id}>{s.endpoint}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'users' && <AdminUsers token={token} setStatus={setStatus} />}
        {activeTab === 'settings' && <AdminSettings token={token} setStatus={setStatus} />}
      </main>
    </div>
  );
}
