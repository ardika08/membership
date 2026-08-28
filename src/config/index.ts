import type { ProductCategory } from '@/types'

export const APP_NAME = 'Grafista Digital'
export const APP_TAGLINE = 'Digital Product Membership'

export const TELEGRAM_GROUP_URL = 'https://t.me/grafista_digital'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

export const TOKEN_STORAGE_KEY = 'membership.auth'
export const THEME_STORAGE_KEY = 'membership.theme'

export const INVOICE_POLL_INTERVAL = 5000

/* ------------------------------ Program poin ------------------------------ */

/** Batas ukuran file upload produk (MB). Samakan dengan policy R2/Laravel. */
export const UPLOAD_MAX_SIZE_MB = 100

/** Belanja Rp1.000 = 1 poin. */
export const POINTS_EARN_RATE = 1000

/** 1 poin = Rp10 diskon saat redeem (belanja Rp399.000 → 399 poin → Rp3.990). */
export const POINTS_REDEEM_VALUE = 10

/** Minimal poin untuk redeem dalam satu transaksi (100 poin = Rp10.000). */
export const POINTS_MIN_REDEEM = 100

/** Maksimum diskon dari poin, sebagai persen harga produk. */
export const POINTS_MAX_REDEEM_PERCENT = 50

export const CATEGORIES: {
  value: ProductCategory
  label: string
  description: string
}[] = [
  {
    value: 'canva',
    label: 'Template Canva',
    description: 'Desain siap edit untuk sosial media & bisnis',
  },
  {
    value: 'elementor',
    label: 'Template Elementor',
    description: 'Landing page & website WordPress premium',
  },
  {
    value: 'ebook',
    label: 'Ebook',
    description: 'Panduan praktis dan playbook digital',
  },
  {
    value: 'prompt-ai',
    label: 'Prompt AI',
    description: 'Koleksi prompt siap pakai untuk berbagai model AI',
  },
  {
    value: 'source-code',
    label: 'Source Code',
    description: 'Starter kit & boilerplate production-ready',
  },
]

export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  canva: 'Template Canva',
  elementor: 'Template Elementor',
  ebook: 'Ebook',
  'prompt-ai': 'Prompt AI',
  'source-code': 'Source Code',
}
