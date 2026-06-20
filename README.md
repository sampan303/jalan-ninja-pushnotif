# Push Notification Project

Proyek ini adalah starter kit push notification web dengan admin dashboard, subscriber page, dan widget embed.

## Fitur

- Admin login dan panel pengiriman notifikasi
- Kelola akun admin: lihat daftar, tambah admin, ubah password
- Halaman subscribe publik untuk mendaftar Web Push
- Embeddable widget script untuk situs lain
- Backend Express + LowDB file store
- Frontend React + Vite

## Cara pakai

1. Buka terminal di folder proyek:
   ```bash
   cd c:\Users\User\Downloads\project-mafia
   npm install-all
   ```

2. Jalankan backend dan frontend secara terpisah:
   ```bash
   npm run start:backend
   npm run start:frontend
   ```

3. Buka admin frontend di: `http://localhost:5173`

4. Login admin default:
   - Email: `admin@example.com`
   - Password: `admin123`

## Embed widget

Tambahkan ke halaman HTML lain:

```html
<script src="http://localhost:4000/widget.js" data-widget-title="Langganan Notifikasi"></script>
```

## Catatan

- VAPID key akan dibuat otomatis saat backend dijalankan.
- Gunakan `ADMIN_EMAIL` dan `ADMIN_PASSWORD` sebagai environment variable jika ingin mengubah kredensial.
