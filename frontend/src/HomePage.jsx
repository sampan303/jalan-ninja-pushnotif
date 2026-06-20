import { useEffect, useState } from 'react';

export default function HomePage({ openSubscribe }) {
const [showPopup, setShowPopup] = useState(false);

useEffect(() => {
const timer = setTimeout(() => {
setShowPopup(true);
}, 1500);

```
return () => clearTimeout(timer);
```

}, []);

return (
<> <div className="app"> <header> <h1>PushNotif</h1> <p>Aktifkan notifikasi untuk mendapatkan update terbaru.</p> </header>

```
    <div className="card">
      <h2>Selamat Datang</h2>

      <p>
        Dapatkan update realtime langsung ke browser Anda.
      </p>

      <button onClick={() => setShowPopup(true)}>
        Aktifkan Notifikasi
      </button>
    </div>
  </div>

  {showPopup && (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '420px',
          maxWidth: '100%',
          background: '#111',
          color: '#fff',
          borderRadius: '24px',
          padding: '35px',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <button
          onClick={() => setShowPopup(false)}
          style={{
            position: 'absolute',
            right: '15px',
            top: '10px',
            border: 'none',
            background: 'transparent',
            color: '#999',
            fontSize: '28px',
            cursor: 'pointer',
          }}
        >
          ×
        </button>

        <div style={{ fontSize: '60px' }}>🔔</div>

        <h2
          style={{
            marginTop: '10px',
            fontSize: '36px',
          }}
        >
          AKSES VIP
        </h2>

        <p
          style={{
            color: '#ccc',
            lineHeight: 1.7,
          }}
        >
          Klik tombol di bawah untuk mengaktifkan notifikasi browser.
        </p>

        <button
          onClick={() => {
            setShowPopup(false);

            if (openSubscribe) {
              openSubscribe();
            }
          }}
          style={{
            width: '100%',
            marginTop: '20px',
            padding: '16px',
            border: 'none',
            borderRadius: '14px',
            background: '#ff9800',
            color: '#111',
            fontWeight: 'bold',
            fontSize: '18px',
            cursor: 'pointer',
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
