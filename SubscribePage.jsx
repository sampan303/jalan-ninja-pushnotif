import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64String);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export default function SubscribePage() {
  const [status, setStatus] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setIsSupported(false);
      setStatus('Browser Anda tidak mendukung Web Push Notification.');
      return;
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        if (subscription) {
          setSubscribed(true);
          setStatus('Anda sudah terdaftar untuk notifikasi.');
        }
      })
      .catch((error) => {
        console.error(error);
        setStatus('Tidak dapat memeriksa status subscribe.');
      });
  }, []);

  const handleSubscribe = async () => {
    setStatus('Memproses...');

    try {
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        setStatus('Izin notifikasi ditolak.');
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      const vapidResponse = await axios.get(`${API_BASE}/vapid-public`);
      const publicKey = vapidResponse.data.publicKey;
      const existingSubscription = await registration.pushManager.getSubscription();

      const subscription =
        existingSubscription ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      await axios.post(`${API_BASE}/subscribe`, subscription);
      setSubscribed(true);
      setStatus('Berhasil mendaftar notifikasi!');
    } catch (error) {
      console.error(error);
      setStatus('Gagal mendaftar: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="app">
      <div className="card subscribe-card">
        <h2>Langganan Notifikasi</h2>
        <p>Klik tombol di bawah untuk mendaftar notifikasi browser. Setelah mendaftar, Anda akan menerima notifikasi dari admin.</p>
        <button type="button" className="btn-primary" onClick={handleSubscribe} disabled={!isSupported || subscribed}>
          {subscribed ? 'Sudah Terdaftar' : 'Daftar Notifikasi'}
        </button>
        <p className="status">{status}</p>
      </div>
    </div>
  );
}
