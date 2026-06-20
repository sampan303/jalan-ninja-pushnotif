import { useEffect, useState } from 'react';

export default function HomePage({ openSubscribe }) {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowPopup(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div className="card">
        <h2>Selamat Datang</h2>
        <p>Aktifkan notifikasi agar tidak ketinggalan update terbaru.</p>
        <button onClick={() => setShowPopup(true)}>Aktifkan Notifikasi</button>
      </div>

      {showPopup && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: 20
        }}>
          <div style={{
            width: 420,
            maxWidth: '100%',
            background: '#111',
            color: '#fff',
            borderRadius: 24,
            padding: 35,
            textAlign: 'center',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowPopup(false)}
              style={{
                position: 'absolute',
                right: 15,
                top: 10,
                border: 'none',
                background: 'transparent',
                color: '#999',
                fontSize: 28,
                cursor: 'pointer'
              }}
            >
              ×
            </button>

            <div style={{ fontSize: 60 }}>🔔</div>
            <h2>AKSES VIP</h2>
            <p>Klik tombol di bawah untuk mengaktifkan notifikasi browser.</p>

            <button
              onClick={() => {
                setShowPopup(false);
                openSubscribe();
              }}
              style={{
                width: '100%',
                marginTop: 20,
                padding: 16,
                border: 'none',
                borderRadius: 14,
                background: '#ff9800',
                color: '#111',
                fontWeight: 'bold',
                fontSize: 18,
                cursor: 'pointer'
              }}
            >
              AKTIFKAN SEKARANG
            </button>
          </div>
        </div>
      )}
    </>
  );
}