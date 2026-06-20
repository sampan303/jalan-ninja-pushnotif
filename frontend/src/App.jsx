function App() {
  const [showPopup, setShowPopup] = useState(true);

  return (
    <>
      {showPopup && (
        <div className="top-banner">
          {/* isi popup */}
          <button onClick={() => setShowPopup(false)}>Nanti</button>
          <button>Aktifkan</button>
        </div>
      )}

      {/* KODE ADMIN/DASHBOARD LAMA TARUH DI SINI */}
      <Dashboard />
    </>
  );
}