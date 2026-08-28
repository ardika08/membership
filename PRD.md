# 📄 Product Requirements Document (PRD) – Membership Area Dashboard

**Versi:** 1.0  
**Tanggal:** 2026-08-25  
**Status:** Draft untuk Frontend Implementation  

---

## 1. 🎯 Tujuan Produk

Membangun **Member Area Dashboard** yang clean, modern, dan premium untuk platform jualan produk digital. Pengguna dapat:
- Mendaftar (dengan nama, nomor WA, email) → langsung aktif
- Melihat & membeli produk digital (Template Canva, Template Elementor, Ebook, Prompt AI, Source Code)
- Integrasi payment gateway Mayar API via invoice
- Langsung akses & download produk setelah pembayaran terkonfirmasi
- Mengelola profil sendiri
- Mode light/dark penuh
- UI responsif, keyboard-friendly, animasi halus

> ✨ **Tidak perlu landing page dalam scope ini.** Fokus: **dashboard member area & halaman utama yang relevan**.

---

## 2. 🧱 Tech Stack

### Frontend
| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| React | 19 | Core framework |
| Vite | 8 | Build tool + dev server |
| React Router | 7 | Client-side routing |
| Tailwind CSS | 4 | Utility-first styling |
| shadcn/ui | - | Component library inspiratif |
| Framer Motion | 13 | Smooth animations & transitions |
| TanStack Query | 5 | Data fetching, caching, background sync |
| React Hook Form | 7 | Form handling |
| Zod | 4 | Schema validation |
| Lucide React | 13+ | Icon set konsisten |
| Sonner | 2 | Toast notifications |
| Zustand | 5 | State management (global) |

### Backend
| Teknologi | Peran |
|-----------|-------|
| Laravel 12 | API backend (RESTful) |
| Sanctum | Authentication & token management |
| MySQL | Database storage |

### Deployment
- **Awal:** Shared Hosting (Apache/Nginx)
- **Future:** VPS (self-managed Laravel queue/webserver)

---

## 3. 🎨 Design Principles & Visual Style

| Prinsip | Implementasi |
|---------|--------------|
| **Clean & Minimal** | White space luas, tidak ada dekorasi berlebihan |
| **Rounded** | Konsisten `rounded-xl` dan `rounded-2xl` pada cards, buttons, inputs |
| **Glass Effect** | Subtle backdrop-blur pada navbar, modal, dropdown |
| **Shadow** | Soft shadow saat hover (elevation lembut) |
| **Typography** | Large headings, clear hierarchy, font Inter/System sans |
| **Icon System** | Lucide React, stroke width konsisten |
| **Dark Mode** | Penuh dukungan, system preference detection |
| **Loading States** | Skeleton loaders di semua area data loading |
| **Empty States** | Ilustrasi ramah + CTA jelas |
| **Animations** | 150–300ms smooth transitions, micro-interactions |
| **Keyboard Friendly** | Tab navigation, visible focus states, shortcuts (opsional) |
| **Responsive** | Mobile-first, adaptive grid & layout |

> Inspirasi visual: **Linear, Vercel, Stripe Dashboard, Raycast, Supabase, Framer, shadcn/ui**.

---

## 4. 👥 User Roles

| Role | Deskripsi |
|------|-----------|
| **Guest** | Belum login → bisa lihat produk publik, register, login |
| **Member** | Terdaftar & login → akses dashboard, beli produk, download |
| **Admin** | Pengelola produk & transaksi → access admin panel khusus |

---

## 5. ️ User Flow

### 5.1 Registrasi Langsung Aktif
```
[Halaman Register] 
→ Isi: Nama, No WA, Email, Password
→ Validasi form (Zod + React Hook Form)
→ Submit → API POST /api/register
→ Sukses → Auto-login → Redirect ke Dashboard
→ Toast sukses muncul
```

### 5.2 Login
```
[Halaman Login]
→ Input: Email, Password
→ Validasi → API POST /api/login
→ Sukses → Store token di state (Zustand) + localStorage (secure)
→ Redirect ke Dashboard
```

### 5.3 Beli Produk (Invoice Flow)
```
[Dashboard / Product Detail]
→ Klik "Beli Sekarang"
→ Jika belum login → Redirect ke Login/Register
→ Jika sudah login → Modal Invoice Mayar terbuka
→ Tampilkan total harga + info produk
→ Konfirmasi Bayar → API POST /api/create-invoice
→ Redirection ke halaman Invoice Mayar
→ Setelah bayar → Webhook Mayar → Backend update status → Frontend polling/check
→ Akses produk muncul di "My Products" → Tombol Download aktif
```

### 5.4 Akses & Download Produk
```
[Dashboard → My Products]
→ Grid kartu produk (minimalist Apple-style untuk admin)
→ Jika status = "active" → tombol "Download" aktif
→ Klik Download → File mulai unduh atau redirect ke secure file path
```

### 5.5 Profil & Pengaturan
```
[Profile Page]
→ Edit informasi pribadi (nama, WA, email)
→ Ubah password
→ Toggle dark/light mode
→ Logout
```

---

## 6. ️ Halaman yang Dibuat (Frontend Scope)

| Route | Role | Deskripsi |
|-------|------|-----------|
| `/register` | Guest | Form registrasi (nama, no wa, email, password) |
| `/login` | Guest | Form login (email, password) |
| `/` | Guest/Member | Product Catalog (grid products) — *bukan landing hero* |
| `/products/:id` | Guest/Member | Product detail + tombol "Beli Sekarang" |
| `/dashboard` | Member | Dashboard welcome: **"Halo, [Nama] 👋"** |
| `/dashboard/products` | Member | "My Products" — daftar produk yang dimiliki |
| `/dashboard/downloads` | Member | History download (opsional) |
| `/transactions` | Member | Riwayat transaksi + status invoice |
| `/profile` | Member | Edit profile, ganti password, theme toggle |
| `/admin/dashboard` | Admin | Dashboard admin analytics (grafik, statistik) |
| `/admin/products` | Admin | CRUD products (Apple-style minimal cards) |
| `/admin/transactions` | Admin | Monitoring transaksi user |
| `/admin/users` | Admin | Manajemen user (opsional future) |

---

## 7. 🔑 Core Features

### 7.1 Authentication
- ✅ Direct registration tanpa verifikasi email (akun langsung active)
- ✅ Token-based auth (Laravel Sanctum)
- ✅ Protected routes (redirect jika belum login)
- ✅ Auto-refresh token logic
- ✅ Logout function (clear token)

### 7.2 Product Display
- ✅ Card layout minimalis dengan shadow halus
- ✅ Hover effect subtle + lift animation
- ✅ Category filter (Canva, Elementor, Ebook, dll)
- ✅ Search bar (client-side filtering)
- ✅ Skeleton loader saat loading

### 7.3 Payment Integration (Mayar API)
- ✅ Create invoice via API (`POST /api/create-invoice`)
- ✅ Display invoice URL (redirection atau modal iframe)
- ✅ Polling status payment setiap 5 detik
- ✅ Toast notifikasi jika sukses/gagal
- ✅ Akses produk otomatis aktif setelah bayar

### 7.4 Member Dashboard
- ✅ Greeting: `"Halo, [Nama] 👋"`
- ✅ Summary stats (jumlah produk, transaksi terakhir)
- ✅ Quick access ke "My Products", "Transactions", "Profile"
- ✅ Empty state ilustrasi jika belum ada produk

### 7.5 Theme System
- ✅ Light/Dark mode toggle
- ✅ System preference detection (`prefers-color-scheme`)
- ✅ Persist choice di localStorage
- ✅ Smooth transition antara tema

### 7.6 Responsive & Accessibility
- ✅ Mobile-first responsive design
- ✅ Keyboard navigation support (tab index, focus rings)
- ✅ Screen reader friendly (semantic HTML, ARIA labels)

---

## 8. 🧩 Komponen UI Utama

### 8.1 Layout Components
| Nama | Deskripsi |
|------|-----------|
| `<Navbar />` | Logo, search, avatar dropdown, theme toggle, glass effect |
| `<Sidebar />` | Navigation for dashboard/admin (collapsible mobile) |
| `<MainContent />` | Wrapper konten utama dengan padding konsisten |
| `<Footer />` | Copyright simple, links (future) |

### 8.2 Form Components
| Nama | Deskripsi |
|------|-----------|
| `<AuthForm />` | Reusable login/register form wrapper |
| `<TextInput />` | Rounded input with label, error state |
| `<Button />` | Primary, secondary, ghost variants; disabled/loading state |
| `<Modal />` | Overlay, close on escape, backdrop blur |

### 8.3 Product & List Components
| Nama | Deskripsi |
|------|-----------|
| `<ProductCard />` | Image, title, price, badge category, hover effect |
| `<ProductDetail />` | Full product info, description, buy button |
| `<MyProductsList />` | Grid/list owned products, download button |
| `<TransactionList />` | Table/list of transactions with status badges |

### 8.4 Dashboard Components
| Nama | Deskripsi |
|------|-----------|
| `<GreetingBanner />` | "Halo, [Nama] 👋" + welcome message |
| `<StatsCards />` | Row of stat cards (produk, orders, downloads) |
| `<QuickActions />` | Buttons untuk akses cepat |
| `<RecentActivity />` | Last few transactions or downloads |

### 8.5 Admin Components
| Nama | Deskripsi |
|------|-----------|
| `<AdminStats />` | Revenue chart, user growth, popular products |
| `<ProductTable />` | CRUD table with edit/delete actions |
| `<TransactionView />` | Filterable list of all user transactions |

---

## 9. 🌐 API Endpoints yang Dikonsumsi (Frontend Contract)

| Method | Endpoint | Role | Keterangan |
|--------|----------|------|------------|
| POST | `/api/register` | Public | Registrasi user baru |
| POST | `/api/login` | Public | Login → return token |
| GET | `/api/products` | Public | List produk |
| GET | `/api/products/:id` | Public | Detail produk |
| GET | `/api/my-products` | Member | Produk milik user |
| POST | `/api/create-invoice` | Member | Buat invoice Mayar |
| GET | `/api/transactions` | Member | History transaksi user |
| PUT | `/api/profile` | Member | Update profil |
| PUT | `/api/change-password` | Member | Ubah password |
| GET | `/api/admin/stats` | Admin | Statistik dashboard |
| CRUD | `/api/admin/products` | Admin | CRUD products |
| GET | `/api/admin/transactions` | Admin | All transactions |

---

## 10. 🧭 State Management Strategy

| State | Tool | Lokasi |
|-------|------|--------|
| Auth | Zustand | `store/authStore.ts` |
| Theme | Zustand + localStorage | `store/themeStore.ts` |
| API Cache | TanStack Query | Global queryClient |
| Forms | React Hook Form | Di setiap komponen form |
| Local UI State | React useState | Kompor lokal (misal: sidebar open/close) |

---

## 11. 🛡️ Keamanan Frontend

| Aspek | Implementasi |
|-------|--------------|
| Token Storage | Secure HTTP-only cookie (disarankan) atau localStorage dengan XSS precautions |
| Route Protection | `ProtectedRoute` wrapper component untuk authenticated pages |
| Role Guard | `RoleGuard` wrapper untuk admin-only pages |
| Input Validation | Zod schema + client-side sanitization |
| Error Handling | Centralized error interceptor (Axios) + toast feedback |

---

## 12. 📱 Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, bottom nav (optional), full-width cards |
| Tablet | 640–1024px | 2-column grid, sidebar collapsible |
| Desktop | > 1024px | Fixed sidebar, 3–4 column grid, multi-panel layouts |

---

## 13. 🎬 Animations & Micro-interactions

| Area | Animasi |
|------|---------|
| Button hover | Scale up 1.02s, soft shadow expand |
| Page load | Fade in + slide up (300ms) |
| Modal open | Backdrop blur + scale from center (200ms) |
| Card hover | Lift + glow effect |
| Theme toggle | Smooth gradient/color transition |
| Loading skeleton | Pulse animation (shimmer) |

---

## 14. ✅ Checklist Implementasi

### Phase 1: Foundation
- [ ] Setup React 19 + Vite project
- [ ] Install dependencies (Tailwind, React Router, TanStack Query, dll)
- [ ] Configure Tailwind v4 + custom theme (colors, spacing, radius)
- [ ] Setup Zustand stores (auth, theme)
- [ ] Setup Axios instance + interceptors
- [ ] Create reusable components (Button, Input, Modal, etc.)

### Phase 2: Authentication
- [ ] Login page (`/login`)
- [ ] Register page (`/register`)
- [ ] Protected route wrapper
- [ ] Logout functionality

### Phase 3: Product Showcase
- [ ] Product catalog page (`/`)
- [ ] Product detail page (`/products/:id`)
- [ ] Product card component
- [ ] Search & filter

### Phase 4: Payment & Access
- [ ] Invoice creation flow
- [ ] Mayar redirection/polling
- [ ] Access grant logic
- [ ] "My Products" page

### Phase 5: Member Area
- [ ] Dashboard main page (`/dashboard`)
- [ ] Profile page (`/profile`)
- [ ] Transactions page (`/transactions`)
- [ ] Dark/Light theme toggle

### Phase 6: Admin Panel (Optional Future)
- [ ] Admin dashboard analytics
- [ ] Product CRUD
- [ ] Transaction monitoring
- [ ] User management

---

## 15. 📁 Struktur Folder (Saran)

```
src/
├── api/                 # API client (Axios instances, endpoints)
├── components/          # Reusable UI components
│   ├── ui/              # Base components (Button, Input, Modal, dll)
│   ├── layout/          # Navbar, Sidebar, MainContent
│   └── features/        # Feature-specific (ProductCard, InvoiceModal, dll)
├── config/              # Constants (API URLs, theme presets)
├── hooks/               # Custom React hooks
├── lib/                 # Utilities (formatters, validators)
├── pages/               # Page components (mapped to routes)
│   ├── auth/            # Login, Register
│   ├── public/          # Product catalog, detail
│   ├── dashboard/       # Member area pages
│   └── admin/           # Admin pages
├── store/               # Zustand stores (auth, theme, products)
├── types/               # TypeScript type definitions
├── utils/               # Helper functions
├── App.tsx              # Main app component + router
├── main.tsx             # Entry point
└── index.css            # Tailwind directives + global styles
```

---

## 16. 🧪 Validation & Testing

- ✅ Unit tests untuk validasi form (Zod schemas)
- ✅ E2E smoke test untuk flow register → login → buy → download
- ✅ Manual testing untuk responsive & keyboard navigation
- ✅ Cross-browser testing (Chrome, Firefox, Safari, Edge)

---

## 17. 📢 Catatan Tambahan

- ❗ **Tidak ada quick checkout** — user harus konfirmasi invoice terlebih dahulu.
- ✅ **Gratis?** → "Akses produk akan muncul jika user telah membeli". Maksudnya: produk bisa dilihat tapi download hanya setelah bayar.
- 🎁 **Premium feel** — prioritas: white space, rounded corners, smooth animations, icon consistency.
- 🔐 **Backend wajib** memastikan semua akses kontrol (authorization) dilakukan di server-side, bukan hanya frontend.

---

**Selesai!** 🎉  
PRD ini siap digunakan sebagai panduan implementasi frontend untuk Member Area dashboard.
