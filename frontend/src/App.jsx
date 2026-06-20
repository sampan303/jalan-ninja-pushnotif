import { useState } from "react";
import "./styles.css";

function App() {
  const [showPopup, setShowPopup] = useState(true);

  return (
    <>
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <div className="popup-icon">⚡</div>

            <div className="popup-content">
              <h3>UPGRADE AKUN KAMU MENJADI VVIP AGAR AKUN JADI GACOR</h3>
              <p>
                Aktifkan Akun VVIP dengan cara tekan UPGRADE AKUN VVIP di bawah ini !!
              </p>
            </div>

            <button className="popup-btn secondary" onClick={() => setShowPopup(false)}>
              Nanti
            </button>

            <button className="popup-btn primary" onClick={() => {
              setShowPopup(false);
              window.location.href = "/upgrade";
            }}>
              Aktifkan
            </button>
          </div>
        </div>
      )}

      {/* isi website kamu */}
    </>
  );
}

export default App;