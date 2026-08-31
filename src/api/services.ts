import {
  POINTS_MIN_REDEEM,
  POINTS_REDEEM_VALUE,
} from '@/config'
import { amountToPoints, computeMaxRedeemablePoints } from '@/lib/points'
import { formatCurrency, sleep } from '@/lib/utils'
import type {
  AdminPointEntry,
  AdminPointsData,
  AdminStats,
  AdminUser,
  Category,
  CategoryInput,
  Coupon,
  CouponInput,
  CouponValidation,
  DownloadHistory,
  DownloadType,
  OwnedProduct,
  PointEntry,
  PointsSummary,
  Product,
  Transaction,
  TransactionStatus,
  User,
} from '@/types'

import { apiClient } from './client'
import {
  mockAdmin,
  mockAdminPointEntries,
  mockAdminStats,
  mockAdminUsers,
  mockCoupons,
  mockDownloads,
  mockOwnedProducts,
  mockPointEntries,
  mockProducts,
  mockTransactions,
  mockUser,
} from './mock-data'

/**
 * Set VITE_USE_MOCK_API=false setelah backend Laravel siap.
 * Semua fungsi di bawah sudah memanggil endpoint sesuai kontrak PRD §9.
 */
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false'

/** Diekspor agar UI bisa menampilkan hint khusus mode demo. */
export const IS_MOCK_API = USE_MOCK

const LATENCY = 550

/* ------------------------------- runtime store ------------------------------ */
/* Menyimpan mutasi mock selama sesi berjalan agar demo terasa hidup. */

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_default_01', name: 'Template Canva', slug: 'canva', description: 'Desain siap edit untuk sosial media & bisnis', color: '#8b5cf6', sortOrder: 1, isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat_default_02', name: 'Template Elementor', slug: 'elementor', description: 'Landing page & website WordPress premium', color: '#3b82f6', sortOrder: 2, isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat_default_03', name: 'Ebook', slug: 'ebook', description: 'Panduan praktis dan playbook digital', color: '#f59e0b', sortOrder: 3, isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat_default_04', name: 'Prompt AI', slug: 'prompt-ai', description: 'Koleksi prompt siap pakai untuk berbagai model AI', color: '#10b981', sortOrder: 4, isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat_default_05', name: 'Source Code', slug: 'source-code', description: 'Starter kit & boilerplate production-ready', color: '#ef4444', sortOrder: 5, isActive: true, createdAt: new Date().toISOString() },
]

const state = {
  owned: [...mockOwnedProducts],
  transactions: [...mockTransactions],
  downloads: [...mockDownloads],
  products: [...mockProducts],
  users: [...mockAdminUsers],
  profile: { ...mockUser },
  pointEntries: [...mockPointEntries],
  adminPointEntries: [...mockAdminPointEntries],
  coupons: [...mockCoupons],
  categories: [...DEFAULT_CATEGORIES],
}

function nextInvoiceNumber() {
  const n = 242 + state.transactions.length
  return `INV-2026-${String(n).padStart(6, '0')}`
}

/* --------------------------------- Auth ---------------------------------- */

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  whatsapp: string
  email: string
  password: string
  passwordConfirmation: string
}

export interface AuthResponse {
  user: User
  token: string
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  if (!USE_MOCK) {
    const { data } = await apiClient.post<AuthResponse>('/login', payload)
    return data
  }

  await sleep(LATENCY)
  if (payload.password.length < 8) {
    throw new Error('Email atau kata sandi tidak sesuai.')
  }

  const isAdmin = payload.email.toLowerCase().startsWith('admin')
  let user: User
  if (isAdmin) {
    user = mockAdmin
  } else if (
    state.profile.email.toLowerCase() === payload.email.toLowerCase()
  ) {
    // Login ulang oleh user yang sama (termasuk akun hasil register).
    user = state.profile
  } else {
    // Login member demo — jangan pakai state.profile karena bisa berisi
    // profil admin dari sesi sebelumnya (state tidak di-reset saat logout).
    user = { ...mockUser, email: payload.email }
  }
  state.profile = user

  return { user, token: `mock-token-${user.id}` }
}

export async function register(
  payload: RegisterPayload,
): Promise<AuthResponse> {
  if (!USE_MOCK) {
    const { data } = await apiClient.post<AuthResponse>('/register', {
      name: payload.name,
      whatsapp: payload.whatsapp,
      email: payload.email,
      password: payload.password,
      password_confirmation: payload.passwordConfirmation,
    })
    return data
  }

  await sleep(LATENCY)
  const user: User = {
    id: `usr_${Date.now()}`,
    name: payload.name,
    email: payload.email,
    whatsapp: payload.whatsapp,
    role: 'member',
    points: 0,
    avatar: null,
    createdAt: new Date().toISOString(),
  }
  state.profile = user
  state.owned = []
  state.transactions = []
  state.downloads = []
  state.pointEntries = []

  return { user, token: `mock-token-${user.id}` }
}

export async function logoutRequest(): Promise<void> {
  if (!USE_MOCK) {
    await apiClient.post('/logout')
    return
  }
  await sleep(200)
}

/* -------------------------------- Products -------------------------------- */

export async function fetchProducts(): Promise<Product[]> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<{ data: Product[] }>('/products')
    return data.data
  }
  await sleep(LATENCY)
  return state.products.filter((p) => p.isActive !== false)
}

export async function fetchProduct(id: string): Promise<Product> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<{ data: Product }>(`/products/${id}`)
    return data.data
  }
  await sleep(LATENCY)
  const product = state.products.find((p) => p.id === id || p.slug === id)
  if (!product || product.isActive === false)
    throw new Error('Produk tidak ditemukan.')
  return product
}

export async function fetchMyProducts(): Promise<OwnedProduct[]> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<{ data: OwnedProduct[] }>(
      '/my-products',
    )
    return data.data
  }
  await sleep(LATENCY)
  return state.owned
}

/* ------------------------------ Transactions ------------------------------ */

export async function fetchTransactions(): Promise<Transaction[]> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<{ data: Transaction[] }>(
      '/transactions',
    )
    return data.data
  }
  await sleep(LATENCY)
  return state.transactions
}

export interface InvoiceOptions {
  couponCode?: string
  pointsToRedeem?: number
}

export interface CreateInvoiceResponse {
  transactionId: string
  invoiceNumber: string
  invoiceUrl: string
  amount: number
  baseAmount: number
  couponDiscount: number
  pointsDiscount: number
  pointsRedeemed: number
  pointsEarned: number
  expiresAt: string
}

export async function createInvoice(
  productId: string,
  options?: InvoiceOptions,
): Promise<CreateInvoiceResponse> {
  if (!USE_MOCK) {
    const { data } = await apiClient.post<CreateInvoiceResponse>(
      '/create-invoice',
      {
        product_id: productId,
        coupon_code: options?.couponCode,
        points_to_redeem: options?.pointsToRedeem,
      },
    )
    return data
  }

  await sleep(900)
  const product = state.products.find((p) => p.id === productId)
  if (!product) throw new Error('Produk tidak ditemukan.')

  const baseAmount = product.price

  // Validasi kapon (kupon) ulang di sisi "server" mock.
  let couponDiscount = 0
  let appliedCode: string | null = null
  if (options?.couponCode) {
    const validation = await validateCoupon(options.couponCode, baseAmount)
    couponDiscount = validation.discount
    appliedCode = validation.code
  }

  // Penukaran poin (deduksi langsung; dikembalikan jika invoice kedaluwarsa).
  let pointsRedeemed = 0
  if (options?.pointsToRedeem && options.pointsToRedeem > 0) {
    const max = computeMaxRedeemablePoints(
      baseAmount,
      state.profile.points ?? 0,
    )
    pointsRedeemed = Math.max(0, Math.min(options.pointsToRedeem, max))
    if (pointsRedeemed < POINTS_MIN_REDEEM) pointsRedeemed = 0
  }

  if (pointsRedeemed > 0) {
    state.profile.points = (state.profile.points ?? 0) - pointsRedeemed
    const entry: PointEntry = {
      id: `pe_${Date.now()}`,
      type: 'redeemed',
      amount: pointsRedeemed,
      description: `Penukaran poin — ${product.title}`,
      createdAt: new Date().toISOString(),
    }
    state.pointEntries = [entry, ...state.pointEntries]
  }

  const pointsDiscount = pointsRedeemed * POINTS_REDEEM_VALUE
  const amount = Math.max(0, baseAmount - couponDiscount - pointsDiscount)
  const pointsEarned = amountToPoints(amount)

  const transaction: Transaction = {
    id: `trx_${Date.now()}`,
    invoiceNumber: nextInvoiceNumber(),
    product,
    amount,
    status: 'pending',
    paymentMethod: null,
    invoiceUrl: `https://mayar.link/invoice/demo-${Date.now()}`,
    createdAt: new Date().toISOString(),
    paidAt: null,
    baseAmount,
    couponCode: appliedCode,
    pointsRedeemed,
  }
  state.transactions = [transaction, ...state.transactions]

  return {
    transactionId: transaction.id,
    invoiceNumber: transaction.invoiceNumber,
    invoiceUrl: transaction.invoiceUrl,
    amount,
    baseAmount,
    couponDiscount,
    pointsDiscount,
    pointsRedeemed,
    pointsEarned,
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  }
}

/** Polling status invoice (PRD §7.3 — interval 5 detik). */
export async function checkInvoiceStatus(
  transactionId: string,
): Promise<{ status: TransactionStatus }> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<{ status: TransactionStatus }>(
      `/transactions/${transactionId}/status`,
    )
    return data
  }

  await sleep(400)
  const transaction = state.transactions.find((t) => t.id === transactionId)
  if (!transaction) throw new Error('Transaksi tidak ditemukan.')

  const elapsed = Date.now() - new Date(transaction.createdAt).getTime()

  // Simulasi webhook Mayar: terbayar setelah ~12 detik.
  if (transaction.status === 'pending' && elapsed > 12_000) {
    transaction.status = 'paid'
    transaction.paidAt = new Date().toISOString()
    transaction.paymentMethod = 'QRIS'

    // Poin diberikan saat pembayaran terkonfirmasi, bukan saat checkout.
    const earned = amountToPoints(transaction.amount)
    if (earned > 0) {
      state.profile.points = (state.profile.points ?? 0) + earned
      const now = transaction.paidAt
      state.pointEntries = [
        {
          id: `pe_${Date.now()}`,
          type: 'earned',
          amount: earned,
          transactionId: transaction.id,
          description: `Pembelian ${transaction.product.title}`,
          createdAt: now,
        },
        ...state.pointEntries,
      ]
      state.adminPointEntries = [
        {
          id: `ape_${Date.now()}`,
          user: {
            id: state.profile.id,
            name: state.profile.name,
            email: state.profile.email,
          },
          type: 'earned',
          amount: earned,
          description: `Pembelian ${transaction.product.title}`,
          createdAt: now,
        },
        ...state.adminPointEntries,
      ]
    }

    const alreadyOwned = state.owned.some(
      (o) => o.product.id === transaction.product.id,
    )
    if (!alreadyOwned) {
      state.owned = [
        {
          id: `own_${Date.now()}`,
          product: transaction.product as Product,
          status: 'active',
          purchasedAt: transaction.paidAt,
          downloadCount: 0,
          lastDownloadedAt: null,
        },
        ...state.owned,
      ]
    }
  }

  // Simulasi invoice kedaluwarsa setelah 24 jam — poin dikembalikan.
  if (transaction.status === 'pending' && elapsed > 86_400_000) {
    transaction.status = 'expired'
    if (transaction.pointsRedeemed && transaction.pointsRedeemed > 0) {
      state.profile.points =
        (state.profile.points ?? 0) + transaction.pointsRedeemed
      state.pointEntries = [
        {
          id: `pe_${Date.now()}`,
          type: 'adjusted',
          amount: transaction.pointsRedeemed,
          description: 'Pengembalian poin — invoice kedaluwarsa',
          createdAt: new Date().toISOString(),
        },
        ...state.pointEntries,
      ]
    }
  }

  return { status: transaction.status }
}

/* -------------------------------- Downloads ------------------------------- */

export async function fetchDownloads(): Promise<DownloadHistory[]> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<{ data: DownloadHistory[] }>(
      '/downloads',
    )
    return data.data
  }
  await sleep(LATENCY)
  return state.downloads
}

export async function requestDownload(
  ownedId: string,
): Promise<{ url: string; fileName: string; downloadType?: DownloadType }> {
  if (!USE_MOCK) {
    const { data } = await apiClient.post<{
      url: string
      fileName: string
      downloadType?: DownloadType
    }>(`/my-products/${ownedId}/download`)
    return data
  }

  await sleep(700)
  const owned = state.owned.find((o) => o.id === ownedId)
  if (!owned) throw new Error('Produk tidak ditemukan.')
  if (owned.status !== 'active') {
    throw new Error('Pembayaran belum terkonfirmasi.')
  }

  owned.downloadCount += 1
  owned.lastDownloadedAt = new Date().toISOString()

  const product = owned.product
  const downloadType = product.downloadType ?? 'upload'
  let url: string
  let fileName: string

  if (downloadType === 'external' && product.downloadUrl) {
    // Link eksternal (Google Drive dkk.) — dibuka di tab baru oleh UI.
    url = product.downloadUrl
    fileName = product.fileName ?? product.title
  } else {
    const stored = product.fileName
      ? uploadedFileUrls.get(product.fileName)
      : undefined
    if (stored) {
      // File hasil upload di sesi ini — unduhan sungguhan dari objectURL.
      url = stored
      fileName = product.fileName as string
    } else {
      // Belum ada file (mode demo) — buat placeholder agar alur tetap terasa.
      fileName = `${product.slug}-demo.txt`
      const blob = new Blob(
        [
          `[Mode demo] File placeholder untuk "${product.title}" v${product.version}.\n`,
          `Di produksi, file ini diambil dari Cloudflare R2 / link eksternal yang dikonfigurasi admin.`,
        ],
        { type: 'text/plain' },
      )
      url = URL.createObjectURL(blob)
    }
  }

  state.downloads = [
    {
      id: `dl_${Date.now()}`,
      product,
      fileName,
      fileSize: product.fileSize,
      downloadedAt: owned.lastDownloadedAt,
      ip: '182.253.11.42',
    },
    ...state.downloads,
  ]

  return { url, fileName, downloadType }
}

/* --------------------------------- Profile -------------------------------- */

export interface UpdateProfilePayload {
  name: string
  email: string
  whatsapp: string
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<User> {
  if (!USE_MOCK) {
    const { data } = await apiClient.put<{ data: User }>('/profile', payload)
    return data.data
  }
  await sleep(LATENCY)
  state.profile = { ...state.profile, ...payload }
  return state.profile
}

export interface ChangePasswordPayload {
  currentPassword: string
  password: string
  passwordConfirmation: string
}

export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<void> {
  if (!USE_MOCK) {
    await apiClient.put('/change-password', {
      current_password: payload.currentPassword,
      password: payload.password,
      password_confirmation: payload.passwordConfirmation,
    })
    return
  }
  await sleep(LATENCY)
  if (payload.currentPassword.length < 8) {
    throw new Error('Kata sandi saat ini tidak sesuai.')
  }
}

/* ---------------------------------- Poin ----------------------------------- */

export async function fetchPoints(): Promise<PointsSummary> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<{ data: PointsSummary }>('/points')
    return data.data
  }

  await sleep(LATENCY)
  const entries = state.pointEntries
  const totalEarned = entries
    .filter((e) => e.type === 'earned')
    .reduce((sum, e) => sum + e.amount, 0)
  const totalRedeemed = entries
    .filter((e) => e.type === 'redeemed')
    .reduce((sum, e) => sum + e.amount, 0)

  return {
    balance: state.profile.points ?? 0,
    totalEarned,
    totalRedeemed,
    entries,
  }
}

/* --------------------------------- Kupon ---------------------------------- */

export async function validateCoupon(
  code: string,
  subtotal: number,
): Promise<CouponValidation> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<CouponValidation>(
      '/coupons/validate',
      { params: { code, subtotal } },
    )
    return data
  }

  await sleep(500)
  const normalized = code.trim().toUpperCase()
  const coupon = state.coupons.find(
    (c) => c.code.toUpperCase() === normalized,
  )
  if (!coupon) throw new Error('Kode kupon tidak ditemukan.')
  if (coupon.isActive === false) {
    throw new Error('Kode kupon sedang tidak aktif.')
  }
  if (new Date(coupon.expiresAt) < new Date()) {
    throw new Error('Kode kupon sudah kedaluwarsa.')
  }
  if (subtotal < coupon.minPurchase) {
    throw new Error(
      `Minimal belanja ${formatCurrency(coupon.minPurchase)} untuk kupon ini.`,
    )
  }

  let discount =
    coupon.type === 'percentage'
      ? Math.floor((subtotal * coupon.value) / 100)
      : coupon.value
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount)
  discount = Math.min(discount, subtotal)

  return { code: coupon.code, description: coupon.description, discount }
}

/* ---------------------------------- Admin --------------------------------- */

export async function fetchAdminStats(): Promise<AdminStats> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<{ data: AdminStats }>('/admin/stats')
    return data.data
  }
  await sleep(LATENCY)
  return mockAdminStats
}

export async function fetchAdminProducts(): Promise<Product[]> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<{ data: Product[] }>('/admin/products')
    return data.data
  }
  await sleep(LATENCY)
  return state.products
}

export type ProductInput = Pick<
  Product,
  | 'title'
  | 'category'
  | 'price'
  | 'originalPrice'
  | 'isActive'
  | 'shortDescription'
  | 'description'
  | 'cover'
  | 'highlights'
  | 'includes'
  | 'downloadType'
  | 'downloadUrl'
  | 'fileName'
  | 'fileSize'
  | 'fileType'
  | 'releaseAt'
>

export interface UploadProductFileResult {
  url: string
  fileName: string
  fileSize: number
  fileType: string
}

/** objectURL upload mock — hanya hidup selama sesi (tidak persisten). */
const uploadedFileUrls = new Map<string, string>()

/**
 * Upload file produk.
 * - Mock: simpan sebagai objectURL (session-only) agar alur download terasa nyata.
 * - Backend asli: minta presigned URL ke Laravel lalu PUT langsung ke Cloudflare R2
 *   (S3-compatible). Kredensial R2 TIDAK PERNAH berada di frontend.
 */
export async function uploadProductFile(
  file: File,
): Promise<UploadProductFileResult> {
  if (!USE_MOCK) {
    const { data } = await apiClient.post<{
      uploadUrl: string
      objectKey: string
    }>('/admin/uploads/presigned', {
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
    })
    const response = await fetch(data.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    })
    if (!response.ok) {
      throw new Error('Upload ke storage gagal. Coba lagi.')
    }
    return {
      url: data.objectKey,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'application/octet-stream',
    }
  }

  await sleep(1400)
  const url = URL.createObjectURL(file)
  uploadedFileUrls.set(file.name, url)
  return {
    url,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || 'application/octet-stream',
  }
}

export async function createProduct(payload: ProductInput): Promise<Product> {
  if (!USE_MOCK) {
    const { data } = await apiClient.post<{ data: Product }>(
      '/admin/products',
      payload,
    )
    return data.data
  }

  await sleep(LATENCY)
  const product: Product = {
    id: `prd_${Date.now()}`,
    slug: payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    version: '1.0.0',
    rating: 0,
    sales: 0,
    isActive: true,
    updatedAt: new Date().toISOString(),
    ...payload,
  }
  state.products = [product, ...state.products]
  return product
}

export async function updateProduct(
  id: string,
  payload: ProductInput,
): Promise<Product> {
  if (!USE_MOCK) {
    const { data } = await apiClient.put<{ data: Product }>(
      `/admin/products/${id}`,
      payload,
    )
    return data.data
  }

  await sleep(LATENCY)
  state.products = state.products.map((p) =>
    p.id === id ? { ...p, ...payload, updatedAt: new Date().toISOString() } : p,
  )
  const updated = state.products.find((p) => p.id === id)
  if (!updated) throw new Error('Produk tidak ditemukan.')
  return updated
}

export async function deleteProduct(id: string): Promise<void> {
  if (!USE_MOCK) {
    await apiClient.delete(`/admin/products/${id}`)
    return
  }
  await sleep(LATENCY)
  state.products = state.products.filter((p) => p.id !== id)
}

/* --------------------------------- Categories ------------------------------- */

export async function fetchCategories(): Promise<Category[]> {
  if (!USE_MOCK) {
    // ?all=1: admin mendapat semua kategori (termasuk nonaktif);
    // guest/member tetap hanya yang aktif (dijaga backend).
    const { data } = await apiClient.get<{ data: Category[] }>('/categories', {
      params: { all: true },
    })
    return data.data
  }
  await sleep(LATENCY)
  return [...state.categories]
}

function slugifyCategory(name: string) {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'kategori'
  let slug = base
  let n = 2
  while (state.categories.some((c) => c.slug === slug)) {
    slug = `${base}-${n++}`
  }
  return slug
}

export async function createCategory(
  payload: CategoryInput,
): Promise<Category> {
  if (!USE_MOCK) {
    const { data } = await apiClient.post<{ data: Category }>(
      '/admin/categories',
      payload,
    )
    return data.data
  }

  await sleep(LATENCY)
  const category: Category = {
    id: `cat_${Date.now()}`,
    name: payload.name,
    slug: slugifyCategory(payload.name),
    description: payload.description ?? '',
    color: payload.color ?? '#6366f1',
    sortOrder: state.categories.length + 1,
    isActive: true,
    createdAt: new Date().toISOString(),
  }
  state.categories = [...state.categories, category]
  return category
}

export async function updateCategory(
  id: string,
  payload: Partial<CategoryInput> & { isActive?: boolean; sortOrder?: number },
): Promise<Category> {
  if (!USE_MOCK) {
    const { data } = await apiClient.put<{ data: Category }>(
      `/admin/categories/${id}`,
      payload,
    )
    return data.data
  }

  await sleep(LATENCY)
  state.categories = state.categories.map((c): Category =>
    c.id === id ? { ...c, ...payload } : c,
  )
  const updated = state.categories.find((c) => c.id === id)
  if (!updated) throw new Error('Kategori tidak ditemukan.')
  return updated
}

export async function deleteCategory(id: string): Promise<void> {
  if (!USE_MOCK) {
    await apiClient.delete(`/admin/categories/${id}`)
    return
  }
  await sleep(LATENCY)
  state.categories = state.categories.filter((c) => c.id !== id)
}

/* ---------------------------------- Kupon ---------------------------------- */

export async function fetchCoupons(): Promise<Coupon[]> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<{ data: Coupon[] }>('/admin/coupons')
    return data.data
  }
  await sleep(LATENCY)
  return [...state.coupons]
}

export async function createCoupon(payload: CouponInput): Promise<Coupon> {
  if (!USE_MOCK) {
    const { data } = await apiClient.post<{ data: Coupon }>(
      '/admin/coupons',
      payload,
    )
    return data.data
  }

  await sleep(LATENCY)
  const code = payload.code.trim().toUpperCase()
  if (state.coupons.some((c) => c.code === code)) {
    throw new Error('Kode kupon sudah digunakan.')
  }

  const coupon: Coupon = {
    id: `cpn_${Date.now()}`,
    code,
    type: payload.type,
    value: payload.value,
    minPurchase: payload.minPurchase,
    maxDiscount:
      payload.maxDiscount && payload.maxDiscount > 0
        ? payload.maxDiscount
        : undefined,
    expiresAt: payload.expiresAt,
    description: payload.description,
    isActive: true,
  }
  state.coupons = [...state.coupons, coupon]
  return coupon
}

export async function updateCoupon(
  id: string,
  payload: Partial<CouponInput> & { isActive?: boolean },
): Promise<Coupon> {
  if (!USE_MOCK) {
    const { data } = await apiClient.put<{ data: Coupon }>(
      `/admin/coupons/${id}`,
      payload,
    )
    return data.data
  }

  await sleep(LATENCY)
  const nextCode = payload.code?.trim().toUpperCase()
  if (
    nextCode &&
    state.coupons.some((c) => c.code === nextCode && c.id !== id)
  ) {
    throw new Error('Kode kupon sudah digunakan.')
  }

  state.coupons = state.coupons.map((c): Coupon =>
    c.id === id
      ? {
          ...c,
          ...payload,
          ...(nextCode ? { code: nextCode } : {}),
          ...(payload.maxDiscount !== undefined
            ? {
                maxDiscount:
                  payload.maxDiscount > 0 ? payload.maxDiscount : undefined,
              }
            : {}),
        }
      : c,
  )
  const updated = state.coupons.find((c) => c.id === id)
  if (!updated) throw new Error('Kupon tidak ditemukan.')
  return updated
}

export async function deleteCoupon(id: string): Promise<void> {
  if (!USE_MOCK) {
    await apiClient.delete(`/admin/coupons/${id}`)
    return
  }
  await sleep(LATENCY)
  state.coupons = state.coupons.filter((c) => c.id !== id)
}

export async function setProductActive(
  id: string,
  isActive: boolean,
): Promise<Product> {
  if (!USE_MOCK) {
    const { data } = await apiClient.patch<{ data: Product }>(
      `/admin/products/${id}`,
      { isActive },
    )
    return data.data
  }

  await sleep(LATENCY)
  state.products = state.products.map((p) =>
    p.id === id ? { ...p, isActive } : p,
  )
  const updated = state.products.find((p) => p.id === id)
  if (!updated) throw new Error('Produk tidak ditemukan.')
  return updated
}

export async function fetchAdminTransactions(): Promise<Transaction[]> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<{ data: Transaction[] }>(
      '/admin/transactions',
    )
    return data.data
  }
  await sleep(LATENCY)
  return [...state.transactions, ...mockTransactions].slice(0, 12)
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<{ data: AdminUser[] }>('/admin/users')
    return data.data
  }
  await sleep(LATENCY)
  return state.users
}

export interface AdminUserInput {
  name: string
  email: string
  whatsapp: string
  role: 'member' | 'admin'
  status: 'active' | 'suspended'
}

export async function updateAdminUser(
  id: string,
  payload: AdminUserInput,
): Promise<AdminUser> {
  if (!USE_MOCK) {
    const { data } = await apiClient.put<{ data: AdminUser }>(
      `/admin/users/${id}`,
      payload,
    )
    return data.data
  }

  await sleep(LATENCY)
  state.users = state.users.map((u) =>
    u.id === id ? { ...u, ...payload } : u,
  )
  const updated = state.users.find((u) => u.id === id)
  if (!updated) throw new Error('Pengguna tidak ditemukan.')
  if (state.profile.id === id) {
    state.profile = {
      ...state.profile,
      name: payload.name,
      email: payload.email,
      whatsapp: payload.whatsapp,
      role: payload.role,
    }
  }
  return updated
}

export async function deleteAdminUser(id: string): Promise<void> {
  if (!USE_MOCK) {
    await apiClient.delete(`/admin/users/${id}`)
    return
  }
  await sleep(LATENCY)
  state.users = state.users.filter((u) => u.id !== id)
}

/* ----------------------------- Admin: program poin ---------------------------- */

export async function fetchAdminPoints(): Promise<AdminPointsData> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<{ data: AdminPointsData }>(
      '/admin/points',
    )
    return data.data
  }

  await sleep(LATENCY)
  const now = Date.now()
  const outstanding = state.users.reduce((sum, u) => sum + u.points, 0)
  const recent = state.adminPointEntries.filter(
    (e) => now - new Date(e.createdAt).getTime() <= 30 * 86_400_000,
  )
  const earned30d = recent
    .filter((e) => e.type === 'earned')
    .reduce((sum, e) => sum + e.amount, 0)
  const redeemed30d = recent
    .filter((e) => e.type === 'redeemed')
    .reduce((sum, e) => sum + e.amount, 0)
  const membersWithPoints = state.users.filter((u) => u.points > 0).length

  return {
    stats: { outstanding, earned30d, redeemed30d, membersWithPoints },
    entries: state.adminPointEntries.slice(0, 20),
  }
}

export interface AdjustPointsPayload {
  userId: string
  type: 'add' | 'subtract'
  amount: number
  note?: string
}

export async function adjustUserPoints(
  payload: AdjustPointsPayload,
): Promise<void> {
  if (!USE_MOCK) {
    await apiClient.post(`/admin/users/${payload.userId}/points`, {
      type: payload.type,
      amount: payload.amount,
      note: payload.note,
    })
    return
  }

  await sleep(LATENCY)
  const user = state.users.find((u) => u.id === payload.userId)
  if (!user) throw new Error('Pengguna tidak ditemukan.')

  const amount = Math.floor(payload.amount)
  if (!amount || amount <= 0) {
    throw new Error('Jumlah poin harus lebih dari 0.')
  }
  if (payload.type === 'subtract' && amount > user.points) {
    throw new Error(
      `Poin yang dikurangi melebihi saldo ${user.name} (${user.points} poin).`,
    )
  }

  const delta = payload.type === 'subtract' ? -amount : amount
  user.points += delta
  if (state.profile.id === payload.userId) {
    state.profile.points = (state.profile.points ?? 0) + delta
  }

  const entry: AdminPointEntry = {
    id: `ape_${Date.now()}`,
    user: { id: user.id, name: user.name, email: user.email },
    type: 'adjusted',
    amount,
    description:
      payload.note?.trim() || 'Penyesuaian manual oleh administrator',
    createdAt: new Date().toISOString(),
  }
  state.adminPointEntries = [entry, ...state.adminPointEntries]
}
