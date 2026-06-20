import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

const defaultSettings = {
  siteName: 'PushNotif Admin',
  widgetTitle: 'Langganan Notifikasi',
  widgetButton: 'Berlangganan',
  widgetColor: '#4f94ff',
  widgetTextColor: '#ffffff',
  popupMode: 'popup',
  popupTemplate: 'center-top',
  popupHeading: 'Aktifkan Notifikasi',
  popupText: 'Aktifkan notifikasi agar tidak ketinggalan update terbaru.',
  popupActionText: 'Aktifkan',
  popupCancelText: 'Tutup',
  promptStrategy: 'soft',
  promptDelay: 1200,
  defaultUrl: 'http://localhost:5173',
  enableWidget: true,
  allowedOrigins: '*',
  widgetPosition: 'bottom-right',
  subscribeTheme: 'default-dark',
  customSubscribeCss: '',
  customSubscribeHtml: ''
};

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
  const [settings, setSettings] = useState(defaultSettings);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setIsSupported(false);
      setStatus('Browser Anda tidak mendukung Web Push Notification.');
      return;
    }

    const load = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        const settingsResponse = await axios.get(`${API_BASE}/settings`);
        const loaded = { ...defaultSettings, ...settingsResponse.data };
        setSettings(loaded);

        const delay = loaded.promptDelay ?? 1200;
        if (loaded.promptStrategy === 'soft') {
          setTimeout(() => setShowPrompt(true), delay);
        } else if (loaded.promptStrategy === 'delayed') {
          setTimeout(() => setShowPrompt(true), delay + 1500);
        }

        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          setSubscribed(true);
          setStatus('Anda sudah terdaftar untuk notifikasi.');
        }
      } catch (error) {
        console.error(error);
        setStatus('Tidak dapat memeriksa status subscribe.');
      }
    };

    load();
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

  const popupClass = `subscribe-popup ${settings.popupMode} ${settings.popupTemplate}`;
  const pageTheme = settings.subscribeTheme === 'default-light' ? 'subscribe-light' : 'subscribe-dark';

  const widgetStyle = {
    background: settings.widgetColor,
    color: settings.widgetTextColor
  };

  const popupButtonStyle = {
    background: settings.widgetColor,
    color: settings.widgetTextColor
  };

  return (
    <div className={`app ${pageTheme}`}>
      {settings.enableWidget && (
        <div className={`widget-button ${settings.widgetPosition}`}>
          <button type="button" className="btn-primary" style={widgetStyle} onClick={() => setShowPrompt(true)}>{settings.widgetButton}</button>
        </div>
      )}

      <div className="card subscribe-card">
        <h2>{settings.siteName}</h2>
        <p>{settings.popupText}</p>
        <button type="button" className="btn-primary" onClick={() => setShowPrompt(true)} disabled={!isSupported || subscribed}>
          {subscribed ? 'Sudah Terdaftar' : settings.widgetButton}
        </button>
        <p className="status">{status}</p>
      </div>

      {showPrompt && (
        <div className={popupClass} onClick={() => setShowPrompt(false)}>
          <div className="popup-card" onClick={(e) => e.stopPropagation()}>
            <h3>{settings.popupHeading}</h3>
            <p>{settings.popupText}</p>
            <div className="popup-actions">
              <button type="button" className="btn-primary" style={popupButtonStyle} onClick={() => { setShowPrompt(false); handleSubscribe(); }}>{settings.popupActionText}</button>
              <button type="button" className="btn-ghost" onClick={() => setShowPrompt(false)}>{settings.popupCancelText}</button>
            </div>
          </div>
        </div>
      )}

      {settings.customSubscribeCss && <style>{settings.customSubscribeCss}</style>}
      {settings.customSubscribeHtml && (
        <div className="custom-subscribe-html" dangerouslySetInnerHTML={{ __html: settings.customSubscribeHtml }} />
      )}
    </div>
  );
}
