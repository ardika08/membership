import { z } from 'zod'

const whatsappRegex = /^(\+?62|0)8[1-9][0-9]{6,11}$/

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email wajib diisi')
    .email('Format email tidak valid'),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter'),
  remember: z.boolean().optional(),
})

export type LoginValues = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Nama minimal 3 karakter')
      .max(60, 'Nama maksimal 60 karakter'),
    whatsapp: z
      .string()
      .min(1, 'Nomor WhatsApp wajib diisi')
      .regex(whatsappRegex, 'Gunakan format 08xxx atau +628xxx'),
    email: z
      .string()
      .min(1, 'Email wajib diisi')
      .email('Format email tidak valid'),
    password: z
      .string()
      .min(8, 'Kata sandi minimal 8 karakter')
      .regex(/[a-zA-Z]/, 'Sertakan minimal satu huruf')
      .regex(/[0-9]/, 'Sertakan minimal satu angka'),
    passwordConfirmation: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
    agree: z.literal(true, {
      message: 'Kamu harus menyetujui syarat & ketentuan',
    }),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['passwordConfirmation'],
  })

export type RegisterValues = z.infer<typeof registerSchema>

export const profileSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().email('Format email tidak valid'),
  whatsapp: z
    .string()
    .regex(whatsappRegex, 'Gunakan format 08xxx atau +628xxx'),
})

export type ProfileValues = z.infer<typeof profileSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, 'Kata sandi saat ini minimal 8 karakter'),
    password: z
      .string()
      .min(8, 'Kata sandi baru minimal 8 karakter')
      .regex(/[a-zA-Z]/, 'Sertakan minimal satu huruf')
      .regex(/[0-9]/, 'Sertakan minimal satu angka'),
    passwordConfirmation: z.string().min(1, 'Konfirmasi wajib diisi'),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['passwordConfirmation'],
  })

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>

export const productSchema = z.object({
  title: z.string().min(5, 'Judul minimal 5 karakter'),
  category: z.string().min(1, 'Kategori wajib dipilih'),
  price: z
    .number({ message: 'Harga wajib diisi' })
    .min(0, 'Harga tidak boleh negatif'),
  originalPrice: z
    .number({ message: 'Harga coret tidak valid' })
    .min(0, 'Harga coret tidak boleh negatif'),
  shortDescription: z
    .string()
    .min(10, 'Deskripsi singkat minimal 10 karakter')
    .max(160, 'Deskripsi singkat maksimal 160 karakter'),
  description: z.string().min(20, 'Deskripsi minimal 20 karakter'),
  cover: z.string().url('Masukkan URL gambar yang valid'),
  highlights: z
    .array(z.string())
    .refine(
      (items) => items.some((item) => item.trim().length >= 3),
      'Isi minimal satu item "Yang kamu dapatkan" (min. 3 karakter)',
    ),
  includes: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .refine(
      (items) =>
        items.some(
          (item) => item.label.trim() && item.value.trim(),
        ),
      'Isi minimal satu baris spesifikasi (label & nilai)',
    ),
  downloadType: z.enum(['external', 'upload']),
  downloadUrl: z.string().trim(),
  fileName: z.string().trim(),
  releaseAt: z.string().trim(),
})
  .refine((data) => data.originalPrice === 0 || data.originalPrice > data.price, {
    message: 'Harga coret harus lebih besar dari harga jual',
    path: ['originalPrice'],
  })
  .refine(
    (data) =>
      data.downloadType !== 'external' ||
      /^https?:\/\/.+\..+/.test(data.downloadUrl),
    { message: 'Masukkan URL valid, diawali https://', path: ['downloadUrl'] },
  )


export type ProductValues = z.infer<typeof productSchema>

export const couponSchema = z
  .object({
    code: z
      .string()
      .min(4, 'Kode kupon minimal 4 karakter')
      .max(20, 'Kode kupon maksimal 20 karakter')
      .regex(
        /^[A-Za-z0-9-]+$/,
        'Gunakan huruf, angka, dan tanda hubung tanpa spasi',
      ),
    type: z.enum(['percentage', 'fixed']),
    value: z
      .number({ message: 'Nilai diskon wajib diisi' })
      .min(1, 'Nilai diskon minimal 1'),
    minPurchase: z
      .number({ message: 'Minimal pembelian tidak valid' })
      .min(0, 'Minimal pembelian tidak boleh negatif'),
    maxDiscount: z
      .number({ message: 'Maksimal diskon tidak valid' })
      .min(0, 'Maksimal diskon tidak boleh negatif'),
    expiresAt: z.string().min(1, 'Tanggal kedaluwarsa wajib diisi'),
    description: z
      .string()
      .min(5, 'Deskripsi minimal 5 karakter')
      .max(120, 'Deskripsi maksimal 120 karakter'),
  })
  .refine((data) => data.type !== 'percentage' || data.value <= 100, {
    message: 'Persentase diskon maksimal 100',
    path: ['value'],
  })

export type CouponValues = z.infer<typeof couponSchema>

export const adminUserSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().email('Format email tidak valid'),
  whatsapp: z.string().regex(whatsappRegex, 'Gunakan format 08xxx atau +628xxx'),
  role: z.enum(['member', 'admin']),
  status: z.enum(['active', 'suspended']),
})

export type AdminUserValues = z.infer<typeof adminUserSchema>
