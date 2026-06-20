export default function HomePage() {
  return (
    <div className="app">
      <header>
        <h1>Selamat datang di PushNotif</h1>
      </header>
      <div className="card">
        <p>Gunakan widget untuk menampilkan tombol langganan di website Anda.</p>
        <p>Tambahkan:</p>
        <pre>{`<script src="http://localhost:4000/widget.js" data-widget-title="Langganan Notifikasi"></script>`}</pre>
        <p>Lalu buka halaman ini dan klik tombol untuk mendaftar notifikasi.</p>
      </div>
    </div>
  );
}
