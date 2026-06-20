self.addEventListener('push', function (event) {
  let data = {
    title: 'Notifikasi',
    body: 'Ada pemberitahuan baru.',
    url: self.location.origin,
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (err) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notifikasi', {
      body: data.body || '',
      icon: '/icon.png',
      badge: '/badge.png',
      data: {
        url: data.url || self.location.origin,
      },
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const url = event.notification.data?.url || self.location.origin;

  event.waitUntil(clients.openWindow(url));
});