# Grafista Digital — Backend API

Backend Laravel 12 (RESTful API) untuk Member Area Dashboard **Grafista Digital**. Kontrak API mengikuti PRD §9 + fitur tambahan (kupon, poin, upload file produk, kategori).

| Teknologi | Peran |
| --------- | ----- |
| Laravel 12 | API backend |
| Sanctum | Token authentication (Bearer) |
| MySQL / SQLite | Database |
| Cloudflare R2 (opsional) | Storage file produk via presigned URL |
| Mayar API | Payment gateway invoice |

---

## Setup

```bash
cd backend
composer install
cp .env.example .env        # Windows: copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve           # http://localhost:8000
```

> Mode default `.env.example` = **MySQL XAMPP**. Tanpa MySQL? Ganti `DB_CONNECTION=sqlite` (lihat komentar di `.env.example`) — tidak perlu install apa pun.

Akun demo hasil seed:

| Peran  | Email               | Kata sandi    |
| ------ | ------------------- | ------------- |
| Admin  | `admin@example.com` | `password123` |
| Member | `rizky@example.com` | `password123` |

Member demo punya saldo **1.357 poin** dan riwayat transaksi. Produk uji: *POS Kasir Pro* Rp399.000.

---

## Menjalankan full-stack
### Cara menjalankan full-stack

1. **Backend** — jalankan di terminal tersendiri dan **biarkan tetap berjalan**:
   - `cd backend && php artisan serve` → `http://localhost:8000`
   - atau dobel-klik `start-backend.bat` di root proyek
   - ⚠️ Jika backend mati, login/frontend akan gagal dengan error "Network Error"
2. **Frontend** — `npm run dev` di root proyek (atau `start-frontend.bat`) → `http://localhost:5173`
   - Pastikan `.env.local` berisi `VITE_USE_MOCK_API=false`
   - URL API bisa diatur via `VITE_API_BASE_URL` (default `http://localhost:8000/api`)

Alur pembayaran **sandbox** (tanpa Mayar): klik *Beli Sekarang* → *Buat Invoice* → tombol *Bayar di Mayar* membuka halaman simulasi `/pay-sandbox/{invoice}` → invoice otomatis **paid setelah 15 detik** → produk aktif + poin masuk.

---

## Konfigurasi

### Database — MySQL (XAMPP)

```
1. Start MySQL di XAMPP Control Panel
2. CREATE DATABASE membership;
3. .env: DB_CONNECTION=mysql (default .env.example sudah MySQL)
4. php artisan migrate --seed
```

### Payment — Mayar

| Variabel | Keterangan |
| -------- | ---------- |
| `MAYAR_DRIVER` | `sandbox` (simulasi) atau `mayar` (produksi) |
| `MAYAR_API_KEY` | Secret API key dari dashboard Mayar (Pengaturan → API) |
| `MAYAR_WEBHOOK_SECRET` | Opsional — hanya bila slot webhook akun diarahkan ke backend ini |

Saat produksi:

1. Set `MAYAR_DRIVER=mayar` + isi `MAYAR_API_KEY`
2. Validasi koneksi: `php artisan mayar:check` (cek API key via endpoint balance, read-only)

**Konfirmasi pembayaran via polling API (utama).** Mayar hanya mengizinkan **satu URL webhook per akun** — bila slot webhook sudah dipakai website lain (mis. share satu akun Mayar untuk beberapa website), backend tidak butuh webhook sama sekali: status transaksi di-sync langsung ke `GET /hl/v1/invoice/{id}` setiap kali member membuka halaman transaksi atau saat modal invoice mem-polling (di-throttle 15 detik/transaksi; rate limit Mayar 50 req/menit per API key).

**Webhook (opsional).** Bila slot webhook akun bebas dan ingin notifikasi real-time: di dashboard Mayar (Integration → Webhook) arahkan URL ke `https://domain-anda.com/api/webhooks/mayar`. Endpoint ini diverifikasi token — kirimkan nilai `MAYAR_WEBHOOK_SECRET`; tanpa secret, webhook hanya lolos di environment local. Payload asli Mayar (`event` + `data.status` boolean + `data.extraData`) sudah didukung.

### Storage — Cloudflare R2 (upload file produk)

**Langkah 1 — Aktifkan R2** (sekali saja): login [dash.cloudflare.com](https://dash.cloudflare.com) → menu **R2** → ikuti instruksi aktivasi (perlu kartu kredit/PayPal; ada free tier 10 GB + egress gratis).

**Langkah 2 — Ambil Account ID**: di halaman overview R2, lihat kolom kanan → **Account ID** → salin.

**Langkah 3 — Buat bucket**: R2 → **Create bucket** → nama `grafista-products` (boleh bebas, samakan dengan `R2_BUCKET`) → Location: Automatic → **jangan** aktifkan public access / r2.dev (bucket harus private).

**Langkah 4 — Buat API token**: R2 → **Manage R2 API Tokens** → Create API Token:

- Permission: **Object Read & Write**
- Specify bucket(s): pilih bucket di atas (lebih aman daripada all buckets)
- Setelah dibuat, salin **Access Key ID** & **Secret Access Key** (hanya ditampilkan sekali!)

**Langkah 5 — Isi `backend/.env`**:

```
R2_ACCOUNT_ID=...      # dari langkah 2
R2_ACCESS_KEY=...      # dari langkah 4
R2_SECRET_KEY=...      # dari langkah 4
R2_BUCKET=grafista-products
```

**Langkah 6 — Verifikasi koneksi**:

```bash
php artisan r2:check
```

Command ini mengetes akses bucket + roundtrip upload/download presigned persis seperti alur aplikasi, lalu membersihkan file test.

**Langkah 7 — Set CORS bucket (WAJIB)**: upload dari *browser* butuh izin CORS. Ada 2 cara:

- **Otomatis** (butuh token *Admin Read & Write*): `php artisan r2:cors` — backend yang menerapkan policy-nya.
- **Manual**: R2 → bucket → **Settings → CORS policy** → tempel JSON berikut (sesuaikan origin saat produksi):

```json
[
  {
    "AllowedOrigins": ["http://localhost:5173"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["content-type"],
    "MaxAgeSeconds": 3600
  }
]
```

Alur upload memakai presigned URL — kredensial tidak pernah sampai ke frontend:

1. Admin pilih file → frontend `POST /api/admin/uploads/presigned`
2. Backend mengembalikan presigned `PUT` URL + object key (`products/{slug}-{random}.{ext}`)
3. Frontend meng-`PUT` file langsung ke R2
4. Saat member menekan *Download*, backend mengeluarkan presigned `GET` berumur pendek (5 menit) dengan header `Content-Disposition: attachment` sehingga file langsung terunduh dengan nama benar

Tanpa R2, admin tetap bisa memakai **Link Eksternal** (Google Drive dkk.) yang tersimpan sebagai `download_url` produk.

### Program poin

Konfigurasi di `config/points.php` **wajib identik** dengan `src/config/index.ts` di frontend:

| Variabel | Nilai | Arti |
| -------- | ----- | ---- |
| `POINTS_EARN_RATE` | 1000 | Rp1.000 belanja = 1 poin |
| `POINTS_REDEEM_VALUE` | 10 | 1 poin = Rp10 diskon |
| `POINTS_MIN_REDEEM` | 100 | Minimal 100 poin untuk redeem |
| `POINTS_MAX_REDEEM_PERCENT` | 50 | Maks 50% harga boleh ditutup poin |

Contoh: belanja Rp399.000 → 399 poin → redeem = Rp3.990.

### CORS

Origin frontend diatur lewat `FRONTEND_URL` (default `http://localhost:5173`) — dipakai `config/cors.php`. Saat deploy, sesuaikan dengan domain frontend.

---

## Struktur

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/        # Stats, Product, Category, Coupon, User, Point, Upload, Transaction
│   │   │   ├── Webhook/      # MayarController (verifikasi token)
│   │   │   └── ...           # Auth, Product, Invoice, MyProduct, Transaction, Point, dll.
│   │   ├── Resources/        # Response JSON camelCase
│   │   └── Middleware/       # EnsureUserIsAdmin
│   └── Services/
│       ├── PaymentService    # markPaid/markExpired/settlePending + grant akses + kredit poin
│       ├── PointService      # hitung & mutasi poin (idempotent, refund)
│       ├── MayarService      # create invoice + verifikasi webhook
│       └── R2Service         # presigned PUT/GET Cloudflare R2
├── config/
│   ├── mayar.php             # driver sandbox|mayar
│   ├── points.php            # aturan poin (identik frontend)
│   └── r2.php
├── database/seeders/         # akun demo + kategori + produk + kupon
├── resources/views/
│   └── sandbox-pay.blade.php # halaman simulasi pembayaran (driver sandbox)
└── scripts/
    ├── smoke.php             # smoke test alur checkout end-to-end
    ├── smoke-sandbox.php     # smoke test halaman sandbox + CORS
    ├── test-mayar-webhook.php  # webhook format asli Mayar (event + data.status + extraData)
    └── test-free-checkout.php # checkout total Rp 0 → langsung paid tanpa invoice
```

---

## Smoke test

```bash
cd backend
php artisan migrate:fresh --seed --force
php artisan serve --host=127.0.0.1 --port=8000 &
php scripts/smoke.php            # alur: login → kupon → poin → invoice → paid → akses
php scripts/smoke-sandbox.php    # halaman simulasi pembayaran + CORS preflight
php scripts/test-mayar-webhook.php  # webhook payload asli Mayar (APP_ENV=local)
php scripts/test-free-checkout.php # checkout gratis via kupon 100%
php scripts/test-mayar-live.php    # LIVE ke Mayar (butuh MAYAR_DRIVER=mayar + API key)

`smoke.php`/`smoke-sandbox.php`/`test-free-checkout.php` mengasumsikan driver **sandbox**.
`test-mayar-live.php` membuat invoice NYATA di akun Mayar lalu menutupnya otomatis
(bersih-bersih) — aman dijalankan berulang; member test didaftarkan unik per run
agar lolos deteksi invoice duplikat Mayar (data sama dalam 1 menit ditolak 429).
```

Semua check harus `PASS`. Jalankan `migrate:fresh --seed` sebelum setiap run — poin demo terdebit membuat run kedua gagal.

---

## Keamanan

- Semua route admin dilindungi `auth:sanctum` + middleware `admin` (role check server-side)
- `downloadUrl` produk hanya dikirim ke admin; member mendapat presigned URL berumur pendek
- Poin: redeem didebit saat invoice dibuat, dikembalikan otomatis jika invoice expired
- Poin earned idempotent — kredit hanya sekali per transaksi (`points_credited`)
- Webhook Mayar diverifikasi via secret token; tanpa secret hanya lolos di environment local
- Kupon divalidasi server-side saat create-invoice (type, min belanja, batas pemakaian, masa aktif)

## Upload file produk — file tersimpan di mana?

| Sumber | Lokasi |
| ------ | ------ |
| Upload File (R2) | Bucket Cloudflare R2 — **bukan** server, **bukan** database. DB hanya menyimpan object key |
| Link Eksternal | URL apa pun (Google Drive, dll.) disimpan sebagai `download_url` di tabel `products` |

File tidak pernah lewat server Laravel (presigned direct upload), sehingga bandwidth server tetap ringan.
