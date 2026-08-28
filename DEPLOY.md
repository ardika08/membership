# 🚀 Panduan Deploy — Grafista Digital

Panduan deploy ke **shared hosting (cPanel)** dengan frontend React + backend Laravel 12,
setup **multi-domain**: katalog dan member area di domain berbeda.

## 🌐 Struktur Domain

| Domain | Isi | Lokasi di hosting |
|--------|-----|-------------------|
| `grafistadigital.com` | Katalog publik + detail produk | `public_html/` (isi `dist/`) |
| `member.grafistadigital.com` | Dashboard member, login, admin | docroot subdomain `member` (isi `dist/` yang sama) |
| `api.grafistadigital.com` | Backend Laravel API | docroot `laravel/public` |

> **Konsep kunci:** frontend adalah SATU aplikasi React. Build sekali (`npm run build`),
> upload `dist/` yang sama ke dua domain. Aplikasi otomatis tahu posisinya lewat
> `window.location.origin` dan mengarahkan link dengan benar:
> - Di domain katalog → tombol Masuk/Daftar/Dashboard/Beli menuju `member.*`
> - Di domain member → link Katalog menuju `grafistadigital.com`
> - Halaman member yang dibuka di domain katalog otomatis dialihkan ke `member.*`

---

## 📋 Checklist Sebelum Deploy

- [x] Frontend build sukses tanpa error (`npm run build`)
- [x] Backend smoke test 12/12 PASS (`php backend/deploy-smoke.php`)
- [x] Pembayaran Mayar produksi sudah terverifikasi end-to-end
- [x] Upload file produk ke R2 Cloudflare sudah terverifikasi
- [ ] Domain utama + 2 subdomain (`member`, `api`) sudah dibuat di cPanel
- [ ] SSL (HTTPS) aktif untuk ketiga domain

---

## 🔧 Langkah 1 — Siapkan Subdomain di cPanel

1. Login **cPanel** → menu **Subdomains**.
2. Buat `member.grafistadigital.com` → document root: `member`
3. Buat `api.grafistadigital.com` → document root: `laravel/public`
   (kalau tidak bisa pilih path itu, buat root-nya `api` dulu, nanti disesuaikan).
4. Aktifkan SSL: menu **SSL/TLS Status** → **Run AutoSSL** untuk ketiga domain.

---

## 🔧 Langkah 2 — Upload Backend Laravel

1. Buka **File Manager** → buat folder `laravel` di root home (setara dengan `public_html`, BUKAN di dalamnya).
2. Upload semua isi folder `backend/` lokal ke `laravel/` **kecuali**:
   - `backend/vendor/` — install ulang via SSH: `composer install --no-dev --optimize-autoloader`
   - `backend/node_modules/`, `backend/.env`
3. Pastikan `api.grafistadigital.com` menunjuk ke `laravel/public`
   (cek di cPanel → Subdomains → Edit Document Root).

> Kalau hosting tidak mendukung SSH/composer, upload folder `vendor/` lokal
> ke server juga (lebih lambat tapi berfungsi).

---

## 🔧 Langkah 3 — Konfigurasi Backend di Server

1. Salin `.env.example` → `.env`, lalu generate key:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
2. Edit `.env`:
   ```ini
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://api.grafistadigital.com

   # Multi-domain: entri PERTAMA = domain member (redirect Mayar & R2 CORS)
   FRONTEND_URL=https://member.grafistadigital.com,https://grafistadigital.com

   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=nama_database
   DB_USERNAME=nama_user
   DB_PASSWORD=password_db

   MAYAR_DRIVER=mayar
   MAYAR_API_KEY=isi_api_key_mayar
   MAYAR_WEBHOOK_SECRET=isi_secret_webhook

   R2_ACCOUNT_ID=isi_account_id
   R2_ACCESS_KEY=isi_access_key
   R2_SECRET_KEY=isi_secret_key
   R2_BUCKET=grafista-products

   CACHE_STORE=file
   QUEUE_CONNECTION=sync
   SESSION_DRIVER=file
   ```
3. Migrasi + seed:
   ```bash
   php artisan migrate --seed
   ```
4. Optimasi & permission:
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   chmod -R 775 storage bootstrap/cache
   ```

> ⚠️ Ganti `CACHE_STORE`/`SESSION_DRIVER` dari `database` ke `file` agar sederhana
> di shared hosting (tidak butuh tabel tambahan).

---

## 🔧 Langkah 4 — Build & Upload Frontend

1. File `.env.production` sudah berisi:
   ```ini
   VITE_API_BASE_URL=https://api.grafistadigital.com/api
   VITE_PUBLIC_URL=https://grafistadigital.com
   VITE_MEMBER_URL=https://member.grafistadigital.com
   ```
2. Build:
   ```bash
   npm run build
   ```
3. Upload **isi folder `dist/`** ke:
   - `public_html/` (domain katalog)
   - folder docroot subdomain `member` (mis. `member/`)
   
   Keduanya berisi file yang sama persis. File `.htaccess` untuk SPA routing
   sudah otomatis ikut di dalam `dist/`.

---

## 🔧 Langkah 5 — Update CORS R2 (PENTING untuk upload admin)

Karena admin sekarang di `member.grafistadigital.com`, bucket R2 harus mengizinkan
origin itu. Jalankan dari folder `laravel/` di server (atau lokal dengan .env produksi):

```bash
php artisan r2:cors
```

Perintah ini otomatis membaca semua domain dari `FRONTEND_URL` dan menerapkan
CORS policy ke bucket R2. (Butuh token R2 dengan permission **Admin Read & Write**;
kalau token kamu Object-only, tempel JSON policy manual — perintah ini akan
menampilkan JSON-nya.)

---

## 🔐 Keamanan Setelah Deploy

| Item | Aksi |
|------|------|
| Password admin | Ganti password `admin@example.com` sebelum go-live |
| Akun demo member | Hapus akun `rizky@example.com` (via admin panel Users) |
| APP_DEBUG | Pastikan `false` |
| API Token R2 | Buat token baru scope hanya **Object Read & Write** untuk produksi |
| HTTPS | AutoSSL aktif untuk 3 domain |

---

## 🧪 Verifikasi Pasca-Deploy

1. `https://grafistadigital.com` → katalog produk tampil.
2. Klik **Masuk** → otomatis pindah ke `https://member.grafistadigital.com/login`.
3. Login/register di domain member → dashboard muncul.
4. Di dashboard, klik **Katalog Produk** → kembali ke `grafistadigital.com`.
5. Dari katalog, buka produk → klik **Beli Sekarang** → diarahkan ke halaman produk
   di domain member → login → **otomatis kembali ke halaman produk itu** → checkout.
6. `https://api.grafistadigital.com/api/products` → JSON produk.
7. Tes satu pembayaran kecil + upload file produk (admin) + download produk (member).

---

## ❓ Troubleshooting

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| Halaman putih | `VITE_API_BASE_URL` salah | Periksa `.env.production`, rebuild |
| Error CORS di console | Origin belum terdaftar | Tambahkan di `FRONTEND_URL` (comma-separated) |
| Deep-link 404 (mis. `/login`) | `.htaccess` tidak ikut ter-upload | Upload manual `dist/.htaccess` |
| 500 di API | Error tersembunyi (APP_DEBUG=false) | Cek `storage/logs/laravel.log` |
| Upload admin gagal | R2 CORS belum ter-update | Jalankan `php artisan r2:cors` |
| Redirect Mayar salah domain | Entri pertama FRONTEND_URL bukan domain member | Urutkan: domain member dulu |
