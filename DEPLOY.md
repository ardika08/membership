# 🚀 Panduan Deploy — Grafista Digital

Panduan deploy ke **shared hosting (cPanel)** dengan frontend React + backend Laravel 12.

> **Struktur yang direkomendasikan:**
>
> | Bagian | Lokasi di hosting | Diakses via |
> |--------|-------------------|-------------|
> | Frontend (`dist/`) | `public_html/` | `https://domainkamu.com` |
> | Backend (`backend/`) | `laravel/` (di luar `public_html`) | `https://api.domainkamu.com` (subdomain) |
>
> Alternatif satu domain (tanpa subdomain) ada di bagian **Opsi B** di bawah.

---

## 📋 Checklist Sebelum Deploy

- [x] Frontend build sukses tanpa error (`npm run build`)
- [x] Backend smoke test 12/12 PASS (`php backend/deploy-smoke.php`)
- [x] Pembayaran Mayar produksi sudah terverifikasi end-to-end
- [x] Upload file produk ke R2 Cloudflare sudah terverifikasi
- [ ] Domain sudah disiapkan dan mengarah ke hosting
- [ ] SSL (HTTPS) aktif untuk domain dan subdomain API

---

## 🔧 Opsi A — Subdomain API (Direkomendasikan)

### Langkah 1: Siapkan subdomain untuk API

1. Login ke **cPanel** hosting kamu.
2. Buka menu **Subdomains**.
3. Buat subdomain: `api` → document root: `/laravel/public`
   (misalnya `api.domainkamu.com` menunjuk ke folder `laravel/public`).

### Langkah 2: Upload backend Laravel

1. Buka menu **File Manager** di cPanel.
2. Buat folder `laravel` di **root home** (bukan di dalam `public_html`).
3. Upload semua isi folder `backend/` lokal kamu **kecuali**:
   - `backend/vendor/` (akan di-install ulang via SSH/composer)
   - `backend/node_modules/` (tidak dipakai)
   - `backend/.env` (akan dibuat baru di server)
4. Atau lewat SSH (jika hosting mendukung):
   ```bash
   # dari root home
   git clone https://github.com/ardika08/membership.git temp-clone
   cp -r temp-clone/backend laravel
   cd laravel && composer install --no-dev --optimize-autoloader
   ```

### Langkah 3: Konfigurasi backend di server

1. Salin `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
2. Edit `.env` di server, isi bagian penting:

   ```ini
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://api.domainkamu.com

   FRONTEND_URL=https://domainkamu.com

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

   > ⚠️ **Penting:** ganti `CACHE_STORE`, `QUEUE_CONNECTION`, `SESSION_DRIVER` dari
   > `database` ke `file`/`sync` agar tidak butuh tabel tambahan dan lebih sederhana
   > di shared hosting.

3. Jalankan migrasi + seed:
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

### Langkah 4: Build & upload frontend

1. Di komputer lokal, edit file **`.env.production`** (di root proyek):
   ```ini
   VITE_API_BASE_URL=https://api.domainkamu.com/api
   ```
2. Build:
   ```bash
   npm run build
   ```
3. Upload semua isi folder `dist/` ke `public_html/` di hosting.

### Langkah 5: Verifikasi

1. Buka `https://domainkamu.com` → katalog produk muncul.
2. Buka `https://api.domainkamu.com/api/products` → JSON produk.
3. Login member → cek dashboard, transaksi, download produk.
4. Tes satu pembayaran kecil untuk memastikan Mayar production bekerja.

---

## 🔧 Opsi B — Satu Domain (API di path `/api`)

Gunakan jika tidak ingin membuat subdomain. Backend tetap di folder `laravel/`
(di luar public_html), lalu tambahkan `.htaccess` di `public_html`:

```apache
# public_html/.htaccess
RewriteEngine On

# Redirect semua /api/* ke Laravel backend
RewriteRule ^api(/.*)?$ laravel/public/index.php [L]
```

Dan edit `.env.production` frontend:
```ini
VITE_API_BASE_URL=https://domainkamu.com/api
```

> ⚠️ Dengan opsi ini, pastikan `FRONTEND_URL` di backend `.env` tetap
> `https://domainkamu.com` (untuk CORS).

---

## 🔐 Keamanan Setelah Deploy

| Item | Aksi |
|------|------|
| Password admin | Ganti password `admin@example.com` sebelum go-live |
| Akun demo member | Hapus akun `rizky@example.com` (via admin panel Users) |
| APP_DEBUG | Pastikan `false` (jangan sampai error detail tampil ke publik) |
| API Token R2 | Buat token baru dengan scope hanya **Object Read & Write** untuk bucket produk |
| HTTPS | Aktifkan SSL (Let's Encrypt gratis di cPanel) untuk domain + subdomain |

---

## 🧪 Verifikasi Pasca-Deploy

Jalankan smoke test dari komputer lokal (backend harus bisa diakses):

```bash
cd backend
php deploy-smoke.php   # ganti $baseUrl di file ini dengan URL API produksi
```

Atau cek manual via browser:
- `https://api.domainkamu.com/api/products` → JSON daftar produk
- Login + register via frontend berfungsi
- Upload file produk (admin) → file muncul di R2
- Pembayaran → status transaksi berubah jadi paid
- Download produk setelah paid

---

## ❓ Troubleshooting

| Gejala | Kemungkinan Penyebab | Solusi |
|--------|----------------------|--------|
| Halaman putih/blank | Base URL API salah | Cek `.env.production` & rebuild |
| Error CORS di console | `FRONTEND_URL` backend beda | Samakan dengan domain frontend |
| 500 di API | `APP_DEBUG=false` menyembunyikan error | Cek `storage/logs/laravel.log` |
| Login gagal | Token Sanctum kadaluarsa/beda domain | Pastikan HTTPS aktif di kedua domain |
| Upload gagal | Kredensial R2 salah | Cek `R2_*` di `.env` server |
| Gagal migrate | User DB kurang privilege | Beri ALL privilege di cPanel MySQL |
