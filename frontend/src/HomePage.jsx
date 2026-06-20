import { useEffect, useState } from 'react';

export default function HomePage({ openSubscribe }) {
const [showPopup, setShowPopup] = useState(false);

useEffect(() => {
const timer = setTimeout(() => setShowPopup(true), 2000);
return () => clearTimeout(timer);
}, []);

return (
<>
<div
className="card"
style={{
background:
'linear-gradient(135deg,#3a4a58 0%,#24313d 50%,#1d2940 100%)',
}}
>
<span
style={{
padding: '6px 12px',
borderRadius: 20,
background: 'rgba(255,255,255,.1)',
fontSize: 12,
}}
>
ACCOUNT SUMMARY </span>

```
    <h1 style={{ marginTop: 20 }}>
      Hello, Klenny 👋
    </h1>

    <p>
      Selamat datang di PushNotif Dashboard.
      Kelola subscriber, kirim notifikasi, dan pantau statistik
      dalam satu tempat.
    </p>

    <div
      style={{
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
        marginTop: 20,
      }}
    >
      <button onClick={() => setShowPopup(true)}>
        Aktifkan Notifikasi
      </button>

      <button>
        Kelola Subscriber
      </button>

      <button>
        Dashboard Admin
      </button>
    </div>
  </div>

  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
      gap: 20,
      marginTop: 20,
    }}
  >
    <div className="card">
      <h3>Subscribers</h3>
      <h1>3</h1>
      <p>Total subscriber aktif</p>
    </div>

    <div className="card">
      <h3>Notifications</h3>
      <h1>4</h1>
      <p>Total notifikasi terkirim</p>
    </div>

    <div className="card">
      <h3>Status</h3>
      <h1>VIP</h1>
      <p>Push notification aktif</p>
    </div>
  </div>

  {showPopup && (
    <div className="vip-overlay">
      <div
        style={{
          width: 420,
          maxWidth: '100%',
          background: '#111',
          color: '#fff',
          borderRadius: 24,
          padding: 35,
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <button
          onClick={() => setShowPopup(false)}
          style={{
            position: 'absolute',
            right: 15,
            top: 10,
            background: 'transparent',
            border: 'none',
            color: '#999',
            fontSize: 28,
          }}
        >
          ×
        </button>

        <div style={{ fontSize: 60 }}>🔔</div>

        <h2>AKSES VIP</h2>

        <p>
          Klik tombol di bawah untuk mengaktifkan
          notifikasi browser.
        </p>

        <button
          onClick={() => {
            setShowPopup(false);
            openSubscribe();
          }}
          style={{
            width: '100%',
            marginTop: 20,
            padding: 16,
            background: '#ff9800',
            color: '#111',
            borderRadius: 14,
            border: 'none',
            fontWeight: 'bold',
          }}
        >
          AKTIFKAN SEKARANG
        </button>
      </div>
    </div>
  )}
</>
```

);
}
