# Membership Area Dashboard — Frontend

Implementasi frontend untuk **Member Area Dashboard** produk digital, sesuai [`PRD.md`](./PRD.md).

Dibangun dengan **React 19 · Vite 8 · Tailwind CSS 4 · shadcn/ui** untuk brand **Grafista Digital**.

---

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build produksi ke dist/
npm run preview  # preview hasil build
```

Di Windows, bisa juga dobel-klik `start-frontend.bat` dan `start-backend.bat` (menjalankan frontend & backend masing-masing — **biarkan jendela tetap terbuka** selama development; menutup jendela = server mati).

Salin `.env.example` menjadi `.env` bila perlu menyesuaikan URL API.

### Mode demo (default)

Aplikasi berjalan dengan **mock API** sehingga seluruh alur bisa dicoba tanpa backend.

Di halaman `/login` tersedia tombol untuk mengisi kredensial contoh:

| Peran  | Email               | Kata sandi    |
| ------ | ------------------- | ------------- |
| Member | `rizky@example.com` | `password123` |
| Admin  | `admin@example.com` | `password123` |

> Aturan mock: email yang diawali `admin` masuk sebagai admin, kata sandi apa pun ≥ 8 karakter diterima.

**Alur pembayaran demo:** buka detail produk → *Beli Sekarang* → *Buat Invoice*. Modal akan melakukan polling setiap 5 detik dan status berubah menjadi `paid` setelah ±12 detik, lalu produk muncul di *Produk Saya*.

**Program poin demo:** setiap Rp1.000 belanja = 1 poin, diberikan otomatis saat transaksi berstatus `paid`. Poin bisa ditukar saat checkout (1 poin = Rp10, minimal 100 poin, maks 50% harga produk). Saldo demo member: 1.357 poin.

**Kupon demo di checkout:** `GRAFIS20` (20%, maks Rp50.000), `HEMAT50` (Rp50.000, min belanja Rp200.000), `WELCOME10` (10% tanpa minimum). Kode `PROMOLAMA` sengaja kedaluwarsa untuk mencoba pesan error.

---

## Integrasi backend Laravel

Backend Laravel 12 API sudah tersedia di folder [`backend/`](./backend/README.md) — panduan setup lengkap ada di `backend/README.md`.

Status integrasi: **terhubung**. File `.env.local` sudah berisi `VITE_USE_MOCK_API=false`, jadi frontend memanggil API asli di `http://localhost:8000/api`.

Cara menjalankan full-stack:

```bash
# Terminal 1 — backend
cd backend && php artisan serve

# Terminal 2 — frontend
npm run dev
```

Cara cek mode sudah terhubung: buka checkout produk — hint "Kode demo: GRAFIS20, ..." hanya muncul di mode mock. Jika tidak muncul, frontend sedang memakai API asli.

Seluruh pemanggilan API mengikuti kontrak PRD §9 di `src/api/services.ts`:

| Method | Endpoint                             |
| ------ | ------------------------------------ |
| POST   | `/api/register`, `/api/login`        |
| GET    | `/api/products`, `/api/products/:id` |
| GET    | `/api/my-products`                   |
| POST   | `/api/create-invoice`                |
| GET    | `/api/transactions`                  |
| GET    | `/api/points`                        |
| GET    | `/api/coupons/validate?code=&subtotal=` |
| PUT    | `/api/profile`, `/api/change-password` |
| GET    | `/api/admin/stats`                   |
| CRUD   | `/api/admin/products`                |
| GET    | `/api/admin/transactions`, `/api/admin/users`, `/api/admin/points` |
| PUT    | `/api/admin/users/:id`               |
| DELETE | `/api/admin/users/:id`               |
| POST   | `/api/admin/users/:id/points`        |

Endpoint tambahan di luar PRD yang dipakai UI:

- `GET /api/transactions/:id/status` — polling status invoice
- `POST /api/my-products/:id/download` — meminta URL unduhan aman
- `GET /api/downloads` — riwayat unduhan
- `POST /api/admin/uploads/presigned` — minta presigned URL upload file produk

### Upload file produk & Cloudflare R2

Admin bisa mengatur sumber file produk lewat **Link Eksternal** (Google Drive dkk.) atau **Upload File**. Mode upload dirancang untuk Cloudflare R2 (S3-compatible, gratis egress) memakai alur presigned URL agar kredensial tidak pernah ada di frontend:

1. Frontend `POST /api/admin/uploads/presigned` dengan `{ fileName, contentType }`
2. Laravel membuat kunci objek (`products/{uuid}-{nama}`) dan presigned `PUT` URL via S3 SDK (`endpoint: https://<account>.r2.cloudflarestorage.com`)
3. Frontend `PUT` file langsung ke R2 (`fetch`, di `uploadProductFile` — `src/api/services.ts`)
4. Object key disimpan ke kolom `download_url` produk; bucket tetap **private**
5. Saat member menekan Download, backend mengembalikan presigned `GET` URL berumur pendek — tidak pernah link permanen

Alternatif tanpa presigned upload: `POST /api/admin/uploads` multipart biasa ke Laravel, lalu Laravel yang meneruskan ke R2 (lebih sederhana, tapi bandwidth lewat server). Untuk file besar, presigned direct-upload lebih hemat.

Token Sanctum dilampirkan otomatis sebagai `Authorization: Bearer <token>` lewat interceptor di `src/api/client.ts`. Respons `401` memicu logout + redirect ke `/login`.

> Response list diasumsikan dibungkus `{ data: [...] }` (default Laravel API Resource). Sesuaikan di `services.ts` bila format backend berbeda.

---

## Rute

| Route                   | Akses  |
| ----------------------- | ------ |
| `/`                     | Publik |
| `/products/:id`         | Publik |
| `/login`, `/register`   | Guest  |
| `/dashboard`            | Member |
| `/dashboard/products`   | Member |
| `/dashboard/downloads`  | Member |
| `/transactions`         | Member |
| `/profile`              | Member |
| `/admin/dashboard`      | Admin  |
| `/admin/products`       | Admin  |
| `/admin/transactions`   | Admin  |
| `/admin/users`          | Admin  |

Proteksi rute memakai `ProtectedRoute`, `RoleGuard`, dan `GuestRoute` di `src/components/layout/guards.tsx`.

---

## Struktur

```
src/
├── api/          # Axios client, interceptor, service layer + mock adapter
├── components/
│   ├── ui/       # Base components (shadcn/ui): button, card, dialog, table, …
│   ├── layout/   # Navbar, Sidebar, layouts, guards, theme toggle
│   └── features/ # ProductCard, InvoiceModal, StatusBadge, AuthShell
├── config/       # Konstanta aplikasi & kategori produk
├── hooks/        # TanStack Query hooks per domain
├── lib/          # utils (formatter) & validations (Zod schema)
├── pages/        # auth · public · dashboard · admin
├── store/        # Zustand: auth, theme, ui
└── types/        # Definisi tipe domain
```

---

## Catatan implementasi

- **Tema** — light/dark/system dengan deteksi `prefers-color-scheme`, dipersist di `localStorage`. Script inline di `index.html` mencegah *flash of wrong theme*.
- **Design token** — didefinisikan sebagai CSS variable OKLCH di `src/index.css` dan diekspos ke Tailwind via `@theme inline`. Gunakan token semantik (`bg-card`, `text-muted-foreground`) alih-alih warna literal agar dark mode konsisten.
- **Code splitting** — setiap halaman di-`lazy()` sehingga bundle awal tetap ringan.
- **Aksesibilitas** — navigasi keyboard penuh, `focus-visible` ring, label ARIA, dan `prefers-reduced-motion` dihormati.
- **Keamanan** — otorisasi tetap wajib divalidasi di server. Guard di frontend hanya untuk pengalaman pengguna.
