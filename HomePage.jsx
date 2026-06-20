import { useEffect, useState } from 'react';

export default function HomePage({ openSubscribe }) {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowPopup(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="homepage">
      <div className="card hero-card">
        <h2>Selamat Datang</h2>
        <p>Aktifkan notifikasi agar tidak ketinggalan update terbaru.</p>
        <button type="button" className="btn-primary" onClick={() => setShowPopup(true)}>
          Aktifkan Notifikasi
        </button>
      </div>

      {showPopup && (
        <div className="modal-overlay">
          <div className="modal-card">
            <button type="button" className="modal-close" onClick={() => setShowPopup(false)}>
              ×
            </button>
            <div className="modal-icon">🔔</div>
            <h2>AKSES VIP</h2>
            <p>Klik tombol di bawah untuk mengaktifkan notifikasi browser.</p>
            <button type="button" className="btn-primary" onClick={() => {
              setShowPopup(false);
              openSubscribe();
            }}>
              AKTIFKAN SEKARANG
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
