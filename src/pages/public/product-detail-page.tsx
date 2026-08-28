import {
  ArrowLeft,
  Check,
  Download,
  FileArchive,
  PackageX,
  RefreshCw,
  ShieldCheck,
  Star,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { InvoiceModal } from '@/components/features/invoice-modal'
import { ProductCard } from '@/components/features/product-card'
import { PageTransition } from '@/components/layout/page-transition'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategoryLabel } from '@/hooks/use-categories'
import { useAuth } from '@/hooks/use-auth'
import { useMyProducts, useProduct, useProducts } from '@/hooks/use-products'
import {
  computeDiscountPercent,
  formatBytes,
  formatCurrency,
  formatDate,
} from '@/lib/utils'

const GUARANTEES = [
  { icon: ShieldCheck, label: 'Pembayaran aman via Mayar' },
  { icon: RefreshCw, label: 'Update gratis selamanya' },
  { icon: Download, label: 'Unduh ulang kapan saja' },
]

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-5 w-32" />
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    </div>
  )
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const categoryLabel = useCategoryLabel()
  const [invoiceOpen, setInvoiceOpen] = useState(false)

  const { data: product, isLoading, isError } = useProduct(id)
  const { data: allProducts } = useProducts()
  const { data: owned } = useMyProducts()

  if (isLoading) return <DetailSkeleton />

  if (isError || !product) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState
          icon={PackageX}
          title="Produk tidak ditemukan"
          description="Produk yang kamu cari mungkin sudah dihapus atau tautannya tidak valid."
          action={
            <Button asChild>
              <Link to="/">Kembali ke katalog</Link>
            </Button>
          }
        />
      </div>
    )
  }

  const ownedItem = owned?.find(
    (item) => item.product.id === product.id && item.status === 'active',
  )
  const isOwned = Boolean(ownedItem)

  const related =
    allProducts
      ?.filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, 4) ?? []

  const discount = computeDiscountPercent(product.price, product.originalPrice)

  const handleBuy = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/products/${id}` } } })
      return
    }
    setInvoiceOpen(true)
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/">
            <ArrowLeft />
            Kembali ke katalog
          </Link>
        </Button>

        <div className="mt-6 grid items-start gap-10 lg:grid-cols-[1.5fr_1fr]">
          {/* Konten utama */}
          <div className="space-y-8">
            <div className="bg-muted shadow-soft relative aspect-[16/9] overflow-hidden rounded-2xl">
              <img
                src={product.cover}
                alt={product.title}
                className="size-full object-cover"
              />
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{categoryLabel(product.category)}</Badge>
                <span className="text-muted-foreground flex items-center gap-1 text-sm">
                  <Star className="fill-warning text-warning size-4" />
                  <span className="text-foreground font-medium">
                    {product.rating.toFixed(1)}
                  </span>
                  · {product.sales.toLocaleString('id-ID')} terjual
                </span>
              </div>

              <h1 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                {product.title}
              </h1>

              <p className="text-muted-foreground text-[15px] leading-relaxed">
                {product.description}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold">Yang kamu dapatkan</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {product.highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="border-border bg-surface flex items-start gap-3 rounded-xl border p-3.5 text-sm"
                  >
                    <span className="bg-success/12 text-success mt-px flex size-5 shrink-0 items-center justify-center rounded-full">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    <span className="leading-relaxed">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold">Spesifikasi</h2>
              <dl className="border-border mt-4 divide-y rounded-2xl border">
                {[
                  ...product.includes,
                  { label: 'Ukuran file', value: formatBytes(product.fileSize) },
                  { label: 'Format file', value: product.fileType },
                  { label: 'Versi', value: `v${product.version}` },
                  {
                    label: 'Terakhir diperbarui',
                    value: formatDate(product.updatedAt),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-4 px-4 py-3.5 text-sm"
                  >
                    <dt className="text-muted-foreground">{item.label}</dt>
                    <dd className="text-right font-medium">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Panel pembelian */}
          <div className="lg:sticky lg:top-24">
            <Card className="overflow-hidden">
              <CardContent className="space-y-5 p-6">
                <div>
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <span className="text-3xl font-semibold tracking-tight">
                      {formatCurrency(product.price)}
                    </span>
                    {product.originalPrice && (
                      <>
                        <span className="text-muted-foreground text-sm line-through">
                          {formatCurrency(product.originalPrice)}
                        </span>
                        <Badge variant="destructive">Hemat {discount}%</Badge>
                      </>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1.5 text-sm">
                    Pembayaran sekali, akses selamanya.
                  </p>
                </div>

                <Separator />

                {isOwned ? (
                  <div className="space-y-3">
                    <div className="bg-success/10 text-success flex items-center gap-2.5 rounded-xl p-3.5 text-sm font-medium">
                      <Check className="size-4" strokeWidth={2.5} />
                      Kamu sudah memiliki produk ini
                    </div>
                    <Button asChild size="lg" className="w-full">
                      <Link to="/dashboard/products">
                        <Download />
                        Buka Produk Saya
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button size="lg" className="w-full" onClick={handleBuy}>
                      Beli Sekarang
                    </Button>
                    {!isAuthenticated && (
                      <p className="text-muted-foreground text-center text-xs">
                        Perlu masuk terlebih dahulu untuk membeli.
                      </p>
                    )}
                  </div>
                )}

                <Separator />

                <ul className="space-y-3">
                  {GUARANTEES.map((item) => (
                    <li
                      key={item.label}
                      className="text-muted-foreground flex items-center gap-2.5 text-sm"
                    >
                      <item.icon className="text-primary size-4 shrink-0" />
                      {item.label}
                    </li>
                  ))}
                </ul>

                <div className="border-border bg-surface flex items-center gap-3 rounded-xl border p-3.5">
                  <FileArchive className="text-muted-foreground size-5 shrink-0" />
                  <div className="min-w-0 text-xs">
                    <p className="font-medium">
                      {product.fileType} · {formatBytes(product.fileSize)}
                    </p>
                    <p className="text-muted-foreground">
                      Unduhan tersedia langsung setelah pembayaran
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-semibold tracking-tight">
              Produk serupa
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item, index) => (
                <ProductCard key={item.id} product={item} index={index} />
              ))}
            </div>
          </section>
        )}
      </div>

      <InvoiceModal
        product={product}
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
      />
    </PageTransition>
  )
}
