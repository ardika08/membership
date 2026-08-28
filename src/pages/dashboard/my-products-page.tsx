import { motion } from 'framer-motion'
import { Clock, Download, ExternalLink, Package, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { OwnedStatusBadge } from '@/components/features/status-badge'
import { PageHeader } from '@/components/layout/page-header'
import { PageTransition } from '@/components/layout/page-transition'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCategoryLabel } from '@/hooks/use-categories'
import { useDownloadProduct, useMyProducts } from '@/hooks/use-products'
import { formatBytes, formatDate, formatRelativeTime } from '@/lib/utils'
import type { OwnedProduct } from '@/types'

function OwnedCard({ item, index }: { item: OwnedProduct; index: number }) {
  const categoryLabel = useCategoryLabel()
  const download = useDownloadProduct()
  const isActive = item.status === 'active'

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Card className="hover:shadow-lift h-full overflow-hidden p-0 transition-all duration-300 hover:-translate-y-0.5">
        <div className="bg-muted relative aspect-[16/9] overflow-hidden">
          <img
            src={item.product.cover}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
          <div className="absolute top-3 left-3">
            <OwnedStatusBadge status={item.status} />
          </div>
        </div>

        <CardContent className="flex flex-1 flex-col gap-4 p-5">
          <div className="space-y-2">
            <Badge variant="secondary">
              {categoryLabel(item.product.category)}
            </Badge>
            <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold">
              {item.product.title}
            </h3>
          </div>

          <dl className="text-muted-foreground grid grid-cols-2 gap-y-1.5 text-xs">
            <dt>Dibeli</dt>
            <dd className="text-foreground text-right font-medium">
              {formatDate(item.purchasedAt)}
            </dd>
            <dt>Ukuran</dt>
            <dd className="text-foreground text-right font-medium">
              {formatBytes(item.product.fileSize)}
            </dd>
            <dt>Diunduh</dt>
            <dd className="text-foreground text-right font-medium">
              {item.downloadCount}×
              {item.lastDownloadedAt &&
                ` · ${formatRelativeTime(item.lastDownloadedAt)}`}
            </dd>
          </dl>

          <div className="mt-auto flex gap-2 pt-1">
            <Button
              className="flex-1"
              disabled={!isActive}
              loading={download.isPending && download.variables === item.id}
              onClick={() => download.mutate(item.id)}
            >
              {isActive ? (
                <>
                  <Download />
                  Download
                </>
              ) : (
                <>
                  <Clock />
                  Menunggu bayar
                </>
              )}
            </Button>
            <Button asChild variant="outline" size="icon" aria-label="Lihat detail produk">
              <Link to={`/products/${item.product.id}`}>
                <ExternalLink />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function MyProductsPage() {
  const { data: owned, isLoading } = useMyProducts()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | 'active' | 'pending'>('all')

  const filtered = useMemo(() => {
    if (!owned) return []
    const keyword = search.trim().toLowerCase()

    return owned.filter((item) => {
      const matchTab = tab === 'all' || item.status === tab
      const matchKeyword =
        !keyword || item.product.title.toLowerCase().includes(keyword)
      return matchTab && matchKeyword
    })
  }, [owned, search, tab])

  const activeCount = owned?.filter((o) => o.status === 'active').length ?? 0
  const pendingCount = owned?.filter((o) => o.status === 'pending').length ?? 0

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Produk Saya"
          description="Semua produk digital yang kamu miliki. Klik download untuk mengunduh file terbaru."
          actions={
            <Button asChild variant="outline">
              <Link to="/">Jelajahi Katalog</Link>
            </Button>
          }
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as typeof tab)}
          >
            <TabsList>
              <TabsTrigger value="all">
                Semua ({owned?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="active">Aktif ({activeCount})</TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pendingCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:max-w-xs">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari produk saya…"
              aria-label="Cari produk saya"
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="overflow-hidden p-0">
                <Skeleton className="aspect-[16/9] rounded-none" />
                <div className="space-y-3 p-5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title={
              owned && owned.length > 0
                ? 'Tidak ada produk yang cocok'
                : 'Belum ada produk'
            }
            description={
              owned && owned.length > 0
                ? 'Coba ubah kata kunci pencarian atau pilih tab lain.'
                : 'Akses produk akan muncul di sini setelah pembayaran kamu terkonfirmasi.'
            }
            action={
              <Button asChild>
                <Link to="/">Jelajahi Katalog</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item, index) => (
              <OwnedCard key={item.id} item={item} index={index} />
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
