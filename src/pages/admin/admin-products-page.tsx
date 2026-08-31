import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ExternalLink,
  Eye,
  EyeOff,
  FileUp,
  LayoutGrid,
  Link2,
  List,
  MoreHorizontal,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import type { ProductInput, UploadProductFileResult } from '@/api/services'
import { PageHeader } from '@/components/layout/page-header'
import { PageTransition } from '@/components/layout/page-transition'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/ui/empty-state'
import { TextInput } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useCategoryLabel, useCategoryOptions } from '@/hooks/use-categories'
import {
  useAdminProducts,
  useCreateProduct,
  useDeleteProduct,
  useToggleProductActive,
  useUpdateProduct,
  useUploadProductFile,
} from '@/hooks/use-products'
import { UPLOAD_MAX_SIZE_MB } from '@/config'
import {
  cn,
  computeDiscountPercent,
  formatBytes,
  formatCurrency,
  formatDate,
} from '@/lib/utils'
import { productSchema, type ProductValues } from '@/lib/validations'
import type { Product, ProductCategory } from '@/types'

const EMPTY_FORM: ProductValues = {
  title: '',
  category: 'canva',
  price: 0,
  originalPrice: 0,
  shortDescription: '',
  description: '',
  cover: '',
  highlights: [''],
  includes: [{ label: '', value: '' }],
  downloadType: 'external',
  downloadUrl: '',
  fileName: '',
  releaseAt: '',
}

function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
}) {
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const uploadFile = useUploadProductFile()
  const isEdit = Boolean(product)
  /** URL file aktif untuk mode upload (objectURL mock / objectKey R2). */
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  /** Metadata hasil upload baru (ukuran & tipe file) — null jika belum ada. */
  const [uploadedFile, setUploadedFile] = useState<UploadProductFileResult | null>(
    null,
  )

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    trigger,
    watch,
    formState: { errors },
  } = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: EMPTY_FORM,
  })

  useEffect(() => {
    if (!open) return
    reset(
      product
        ? {
            title: product.title,
            category: product.category,
            price: product.price,
            originalPrice: product.originalPrice ?? 0,
            shortDescription: product.shortDescription,
            description: product.description,
            cover: product.cover,
            highlights: [...product.highlights],
            includes: product.includes.map((i) => ({ ...i })),
            downloadType: product.downloadType ?? 'external',
            downloadUrl: product.downloadUrl ?? '',
            fileName: product.fileName ?? '',
            releaseAt: product.releaseAt
              ? new Date(product.releaseAt).toISOString().slice(0, 16)
              : '',
          }
        : EMPTY_FORM,
    )
    setUploadedUrl(product?.downloadUrl ?? null)
    setUploadedFile(null)
  }, [open, product, reset])

  const category = watch('category')
  const price = watch('price')
  const originalPrice = watch('originalPrice')
  const downloadType = watch('downloadType')
  const watchFileName = watch('fileName')
  const previewDiscount = computeDiscountPercent(price, originalPrice)
  const categoryOptions = useCategoryOptions()

  const onPickFile = async (file: File | undefined) => {
    if (!file) return
    if (file.size > UPLOAD_MAX_SIZE_MB * 1024 * 1024) {
      toast.error(
        `Ukuran file maksimal ${UPLOAD_MAX_SIZE_MB} MB`,
      )
      return
    }
    const result = await uploadFile.mutateAsync(file)
    setValue('fileName', result.fileName, { shouldValidate: true })
    setUploadedUrl(result.url)
    setUploadedFile(result)
  }

  const onSubmit = async (values: ProductValues) => {
    const payload: ProductInput = {
      ...values,
      originalPrice: values.originalPrice > 0 ? values.originalPrice : undefined,
      highlights: values.highlights.map((h) => h.trim()).filter(Boolean),
      includes: values.includes
        .map((i) => ({ label: i.label.trim(), value: i.value.trim() }))
        .filter((i) => i.label && i.value),
      downloadUrl:
        values.downloadType === 'external'
          ? values.downloadUrl
          : (uploadedUrl ?? ''),
      fileName: values.downloadType === 'upload' ? values.fileName : '',
      fileSize:
        values.downloadType === 'upload' && uploadedFile
          ? uploadedFile.fileSize
          : product?.fileSize ?? 0,
      fileType:
        values.downloadType === 'upload' && uploadedFile
          ? uploadedFile.fileType
          : product?.fileType ?? 'ZIP',
      releaseAt: values.releaseAt || null,
    }
    if (product) {
      await updateProduct.mutateAsync({ id: product.id, payload })
    } else {
      await createProduct.mutateAsync(payload)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Ubah Produk' : 'Tambah Produk Baru'}
          </DialogTitle>
          <DialogDescription>
            Lengkapi detail produk digital yang akan ditampilkan di katalog.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <TextInput
            label="Judul produk"
            placeholder="Contoh: Social Media Kit Pro"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select
                value={category}
                onValueChange={(value) =>
                  setValue('category', value as ProductCategory, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <TextInput
              label="Harga (IDR)"
              type="number"
              min={0}
              step={1000}
              placeholder="149000"
              error={errors.price?.message}
              {...register('price', { valueAsNumber: true })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Harga coret (opsional)"
              type="number"
              min={0}
              step={1000}
              placeholder="199000"
              hint="Kosongkan jika tidak ada diskon"
              error={errors.originalPrice?.message}
              {...register('originalPrice', {
                setValueAs: (v) =>
                  v === '' || v === null ? 0 : Number(v),
              })}
            />
            <div className="border-border bg-surface flex flex-col justify-center gap-1 rounded-xl border px-4 py-2.5">
              <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
                Pratinjau harga
              </p>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-lg font-semibold tracking-tight">
                  {formatCurrency(Number.isFinite(price) ? price : 0)}
                </span>
                {previewDiscount > 0 && (
                  <>
                    <span className="text-muted-foreground text-xs line-through">
                      {formatCurrency(originalPrice)}
                    </span>
                    <Badge variant="destructive">−{previewDiscount}%</Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          <TextInput
            label="URL gambar sampul"
            type="url"
            placeholder="https://images.unsplash.com/…"
            error={errors.cover?.message}
            {...register('cover')}
          />

          <TextInput
            label="Tanggal rilis produk (opsional)"
            type="datetime-local"
            hint="Kosongkan untuk produk yang langsung tersedia."
            {...register('releaseAt')}
          />

          <TextInput
            label="Deskripsi singkat"
            placeholder="Satu kalimat yang menjelaskan produk"
            hint="Maksimal 160 karakter, tampil di kartu katalog"
            error={errors.shortDescription?.message}
            {...register('shortDescription')}
          />

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi lengkap</Label>
            <Textarea
              id="description"
              rows={5}
              placeholder="Jelaskan isi produk, siapa yang cocok memakainya, dan apa manfaatnya…"
              aria-invalid={!!errors.description}
              {...register('description')}
            />
            {errors.description && (
              <p role="alert" className="text-destructive text-xs">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Section: Yang Kamu Dapatkan (Highlights) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="highlights">Yang kamu dapatkan</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const current = watch('highlights')
                  setValue('highlights', [...current, ''])
                  trigger('highlights')
                }}
              >
                <Plus size={16} className="mr-1" />
                Tambah Item
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Daftar fitur atau manfaat yang akan didapatkan pelanggan
            </p>
            <div className="space-y-2">
              {watch('highlights')?.map((_, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder={`Item ${idx + 1}`}
                    value={watch('highlights')[idx] ?? ''}
                    onChange={(e) => {
                      const updated = watch('highlights').map(
                        (item: string, i: number) =>
                          i === idx ? e.target.value : item,
                      )
                      setValue('highlights', updated)
                      trigger('highlights')
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      const current = watch('highlights')
                      if (current.length > 1) {
                        setValue(
                          'highlights',
                          current.filter((_: string, i: number) => i !== idx),
                        )
                        trigger('highlights')
                      }
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
            {errors.highlights && (
              <p role="alert" className="text-destructive text-xs">
                {errors.highlights.message}
              </p>
            )}
          </div>

          {/* Section: Spesifikasi (Includes) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Spesifikasi</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const current = watch('includes')
                  setValue('includes', [
                    ...current,
                    { label: '', value: '' },
                  ])
                  trigger('includes')
                }}
              >
                <Plus size={16} className="mr-1" />
                Tambah Baris
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Data teknis seperti ukuran file, versi, format, dll.
            </p>
            <div className="space-y-2">
              {watch('includes')?.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border border-border bg-muted/40 p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="Label (misal: Format)"
                      value={item.label}
                      onChange={(e) => {
                        const updated = watch('includes').map(
                          (i: { label: string; value: string }, i2: number) =>
                            i2 === idx ? { ...i, label: e.target.value } : i,
                        )
                        setValue('includes', updated)
                        trigger('includes')
                      }}
                      className="min-h-[34px] text-sm"
                    />
                    <Input
                      placeholder="Nilai (misal: ZIP + Canva Link)"
                      value={item.value}
                      onChange={(e) => {
                        const updated = watch('includes').map(
                          (i: { label: string; value: string }, i2: number) =>
                            i2 === idx ? { ...i, value: e.target.value } : i,
                        )
                        setValue('includes', updated)
                        trigger('includes')
                      }}
                      className="min-h-[34px] text-sm"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      const current = watch('includes')
                      if (current.length > 1) {
                        setValue(
                          'includes',
                          current.filter((_: unknown, i: number) => i !== idx),
                        )
                        trigger('includes')
                      }
                    }}
                    className="self-start text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
            {errors.includes && (
              <p role="alert" className="text-destructive text-xs">
                {errors.includes.message}
              </p>
            )}
          </div>

          {/* Section: Akses & File Produk */}
          <div className="space-y-2">
            <Label>Sumber file untuk member</Label>
            <p className="text-muted-foreground text-xs">
              Member hanya bisa mengunduh setelah pembayaran terkonfirmasi.
            </p>
            <Tabs
              value={downloadType}
              onValueChange={(value) =>
                setValue('downloadType', value as 'external' | 'upload', {
                  shouldValidate: true,
                })
              }
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="external">
                  <Link2 className="size-3.5" />
                  Link Eksternal
                </TabsTrigger>
                <TabsTrigger value="upload">
                  <UploadCloud className="size-3.5" />
                  Upload File
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {downloadType === 'external' ? (
              <div className="space-y-1.5">
                <Input
                  placeholder="https://drive.google.com/file/d/..."
                  {...register('downloadUrl')}
                />
                {errors.downloadUrl ? (
                  <p role="alert" className="text-destructive text-xs">
                    {errors.downloadUrl.message}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Tempel link Google Drive / Dropbox / URL langsung. Untuk Google
                    Drive, atur akses file ke “Anyone with the link”.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                {watchFileName ? (
                  <div className="border-border bg-muted/40 flex items-center gap-3 rounded-xl border p-3">
                    <FileUp className="text-primary size-5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {watchFileName}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {uploadedFile
                          ? `${formatBytes(uploadedFile.fileSize)} · siap diunduh member`
                          : 'File tersimpan sebelumnya'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Hapus file"
                      onClick={() => {
                        setValue('fileName', '', { shouldValidate: true })
                        setUploadedUrl(null)
                        setUploadedFile(null)
                      }}
                    >
                      <X />
                    </Button>
                  </div>
                ) : (
                  <label
                    className="border-border hover:border-primary/50 hover:bg-muted/40 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center transition-colors"
                  >
                    <UploadCloud className="text-muted-foreground size-6" />
                    <span className="text-sm font-medium">
                      {uploadFile.isPending
                        ? 'Mengunggah…'
                        : 'Klik untuk pilih file'}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      Maksimal {UPLOAD_MAX_SIZE_MB} MB — ZIP, PDF, dkk.
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      disabled={uploadFile.isPending}
                      onChange={(event) => {
                        void onPickFile(event.target.files?.[0])
                        event.target.value = ''
                      }}
                    />
                  </label>
                )}
                {errors.fileName && (
                  <p role="alert" className="text-destructive text-xs">
                    {errors.fileName.message}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              loading={createProduct.isPending || updateProduct.isPending}
            >
              {isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ProductActions({
  product,
  onEdit,
  onDelete,
  onToggle,
}: {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onToggle: (product: Product) => void
}) {
  const isHidden = product.isActive === false

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Aksi produk">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onEdit(product)}>
          <Pencil />
          Ubah produk
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onToggle(product)}>
          {isHidden ? <Eye /> : <EyeOff />}
          {isHidden ? 'Tayangkan produk' : 'Sembunyikan dari katalog'}
        </DropdownMenuItem>
        {!isHidden && (
          <DropdownMenuItem asChild>
            <Link to={`/products/${product.id}`}>
              <ExternalLink />
              Lihat di katalog
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => onDelete(product)}
        >
          <Trash2 />
          Hapus produk
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function AdminProductsPage() {
  const { data: products, isLoading } = useAdminProducts()
  const deleteProduct = useDeleteProduct()
  const toggleProduct = useToggleProductActive()
  const categoryOptions = useCategoryOptions()
  const categoryLabel = useCategoryLabel()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ProductCategory | 'all'>('all')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)

  const filtered = useMemo(() => {
    if (!products) return []
    const keyword = search.trim().toLowerCase()

    return products.filter((product) => {
      const matchCategory = category === 'all' || product.category === category
      const matchKeyword =
        !keyword || product.title.toLowerCase().includes(keyword)
      return matchCategory && matchKeyword
    })
  }, [products, search, category])

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setFormOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    await deleteProduct.mutateAsync(deleting.id)
    setDeleting(null)
  }

  const toggleActive = (product: Product) => {
    toggleProduct.mutate({
      id: product.id,
      isActive: product.isActive === false,
    })
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Kelola Produk"
          description="Tambah, ubah, dan hapus produk digital yang tampil di katalog."
          actions={
            <Button onClick={openCreate}>
              <Plus />
              Tambah Produk
            </Button>
          }
        />

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari produk…"
              aria-label="Cari produk"
              className="pl-10"
            />
          </div>

          <Select
            value={category}
            onValueChange={(value) => setCategory(value as typeof category)}
          >
            <SelectTrigger
              className="w-full sm:w-52"
              aria-label="Filter kategori"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua kategori</SelectItem>
              {categoryOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="bg-muted flex rounded-xl p-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Tampilan kartu"
              aria-pressed={view === 'grid'}
              onClick={() => setView('grid')}
              className={cn(view === 'grid' && 'bg-card shadow-soft')}
            >
              <LayoutGrid />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Tampilan tabel"
              aria-pressed={view === 'table'}
              onClick={() => setView('table')}
              className={cn(view === 'table' && 'bg-card shadow-soft')}
            >
              <List />
            </Button>
          </div>
        </div>

        {/* Konten */}
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden p-0">
                <Skeleton className="aspect-[16/10] rounded-none" />
                <div className="space-y-3 p-5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={PackagePlus}
            title={
              products && products.length > 0
                ? 'Produk tidak ditemukan'
                : 'Belum ada produk'
            }
            description={
              products && products.length > 0
                ? 'Coba ubah kata kunci pencarian atau filter kategori.'
                : 'Tambahkan produk pertama untuk mulai berjualan.'
            }
            action={
              <Button onClick={openCreate}>
                <Plus />
                Tambah Produk
              </Button>
            }
          />
        ) : view === 'grid' ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
              >
                <Card className="group hover:shadow-lift h-full overflow-hidden p-0 transition-all duration-300 hover:-translate-y-0.5">
                  <div className="bg-muted relative aspect-[16/10] overflow-hidden">
                    <img
                      src={product.cover}
                      alt=""
                      loading="lazy"
                      className={cn(
                        'size-full object-cover transition-transform duration-500 group-hover:scale-105',
                        product.isActive === false && 'opacity-70 grayscale',
                      )}
                    />
                    {(product.isActive === false ||
                      computeDiscountPercent(
                        product.price,
                        product.originalPrice,
                      ) > 0) && (
                      <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
                        {product.isActive === false && (
                          <Badge variant="warning">Nonaktif</Badge>
                        )}
                        {computeDiscountPercent(
                          product.price,
                          product.originalPrice,
                        ) > 0 && (
                          <Badge variant="destructive">
                            −
                            {computeDiscountPercent(
                              product.price,
                              product.originalPrice,
                            )}
                            %
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <div className="glass rounded-lg">
                        <ProductActions
                          product={product}
                          onEdit={openEdit}
                          onDelete={setDeleting}
                          onToggle={toggleActive}
                        />
                      </div>
                    </div>
                  </div>

                  <CardContent className="space-y-3 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        {categoryLabel(product.category)}
                      </Badge>
                      {product.isActive === false && (
                        <Badge variant="warning">Nonaktif</Badge>
                      )}
                    </div>
                    <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold">
                      {product.title}
                    </h3>
                    <div className="flex items-end justify-between pt-1">
                      <div>
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <p className="text-lg font-semibold tracking-tight">
                            {formatCurrency(product.price)}
                          </p>
                          {product.originalPrice &&
                            product.originalPrice > product.price && (
                              <span className="text-muted-foreground text-xs line-through">
                                {formatCurrency(product.originalPrice)}
                              </span>
                            )}
                        </div>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          {product.sales.toLocaleString('id-ID')} terjual
                        </p>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        v{product.version}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Terjual</TableHead>
                    <TableHead>Diperbarui</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={product.cover}
                            alt=""
                            className={cn(
                              'size-10 shrink-0 rounded-lg object-cover',
                              product.isActive === false && 'opacity-70 grayscale',
                            )}
                          />
                          <span className="line-clamp-1 max-w-[18rem] text-sm font-medium">
                            {product.title}
                          </span>
                          {product.isActive === false && (
                            <Badge variant="warning">Nonaktif</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {categoryLabel(product.category)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-baseline gap-2">
                            <span>{formatCurrency(product.price)}</span>
                            {product.originalPrice &&
                              product.originalPrice > product.price && (
                                <span className="text-muted-foreground text-xs line-through">
                                  {formatCurrency(product.originalPrice)}
                                </span>
                              )}
                          </div>
                          {computeDiscountPercent(product.price, product.originalPrice) > 0 && (
                            <Badge variant="destructive" className="w-fit">
                              −{computeDiscountPercent(product.price, product.originalPrice)}%
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {product.sales.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {formatDate(product.updatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <ProductActions
                          product={product}
                          onEdit={openEdit}
                          onDelete={setDeleting}
                          onToggle={toggleActive}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
      />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus produk ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Produk{' '}
              <span className="text-foreground font-medium">
                {deleting?.title}
              </span>{' '}
              akan dihapus dari katalog. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                void confirmDelete()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ya, hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  )
}
