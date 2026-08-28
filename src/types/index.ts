export type Role = 'member' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  whatsapp: string
  role: Role
  points: number
  avatar?: string | null
  createdAt: string
}

/** Slug kategori default. Kategori custom dari /admin/categories berupa string bebas. */
export type ProductCategory =
  | 'canva'
  | 'elementor'
  | 'ebook'
  | 'prompt-ai'
  | 'source-code'
  | (string & {})

export interface Product {
  id: string
  slug: string
  title: string
  /** Gunakan kategori default atau custom yang dikelola di /admin/categories */
  category: ProductCategory
  price: number
  originalPrice?: number
  /** Produk nonaktif tidak tampil di katalog publik. Default: aktif. */
  isActive?: boolean
  /** Sumber unduhan member. Tanpa ini, produk belum bisa diunduh. */
  downloadType?: DownloadType
  /** URL eksternal (Google Drive dkk.) atau objectURL/signed URL hasil upload. */
  downloadUrl?: string
  /** Nama file untuk mode upload. */
  fileName?: string
  shortDescription: string
  description: string
  cover: string
  highlights: string[]
  includes: { label: string; value: string }[]
  fileSize: number
  fileType: string
  version: string
  rating: number
  sales: number
  updatedAt: string
}

export type OwnedStatus = 'active' | 'pending'

/** Sumber file produk: link eksternal (mis. Google Drive) atau upload (R2/storage). */
export type DownloadType = 'external' | 'upload'

export interface OwnedProduct {
  id: string
  product: Product
  status: OwnedStatus
  purchasedAt: string
  downloadCount: number
  lastDownloadedAt: string | null
}

export type TransactionStatus = 'paid' | 'pending' | 'expired' | 'failed'

export interface Transaction {
  id: string
  invoiceNumber: string
  product: Pick<Product, 'id' | 'title' | 'cover' | 'category'>
  amount: number
  status: TransactionStatus
  paymentMethod: string | null
  invoiceUrl: string
  createdAt: string
  paidAt: string | null
  baseAmount?: number
  couponCode?: string | null
  pointsRedeemed?: number
}

export interface DownloadHistory {
  id: string
  product: Pick<Product, 'id' | 'title' | 'cover' | 'category'>
  fileName: string
  fileSize: number
  downloadedAt: string
  ip: string
}

/* --------------------------------- Poin ---------------------------------- */

export type PointEntryType = 'earned' | 'redeemed' | 'adjusted'

export interface PointEntry {
  id: string
  type: PointEntryType
  amount: number
  transactionId?: string
  description: string
  createdAt: string
}

export interface PointsSummary {
  balance: number
  totalEarned: number
  totalRedeemed: number
  entries: PointEntry[]
}

export interface AdminPointEntry {
  id: string
  user: { id: string; name: string; email: string }
  type: PointEntryType
  amount: number
  description: string
  createdAt: string
}

export interface AdminPointsData {
  stats: {
    outstanding: number
    earned30d: number
    redeemed30d: number
    membersWithPoints: number
  }
  entries: AdminPointEntry[]
}

/* --------------------------------- Kupon ---------------------------------- */

export type CouponType = 'percentage' | 'fixed'

export interface Coupon {
  id: string
  code: string
  type: CouponType
  value: number
  minPurchase: number
  maxDiscount?: number
  expiresAt: string
  description: string
  /** Kupon nonaktif ditolak saat checkout. Default: aktif. */
  isActive?: boolean
}

export interface CouponInput {
  code: string
  type: CouponType
  value: number
  minPurchase: number
  maxDiscount?: number
  expiresAt: string
  description: string
}

export interface CouponValidation {
  code: string
  description: string
  discount: number
}

/* --------------------------------- Admin ---------------------------------- */

export interface AdminStats {
  revenue: number
  revenueGrowth: number
  orders: number
  ordersGrowth: number
  users: number
  usersGrowth: number
  products: number
  productsGrowth: number
  revenueSeries: { month: string; revenue: number; orders: number }[]
  userGrowthSeries: { month: string; users: number }[]
  categoryBreakdown: { category: string; value: number }[]
  popularProducts: { id: string; title: string; sales: number; revenue: number }[]
}

export interface AdminUser {
  id: string
  name: string
  email: string
  whatsapp: string
  role: Role
  status: 'active' | 'suspended'
  points: number
  totalSpent: number
  productsOwned: number
  joinedAt: string
}

/* ------------------------------ Kategori ---------------------------------- */

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  color?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
}

export interface CategoryInput {
  name: string
  description: string
  color?: string
}
