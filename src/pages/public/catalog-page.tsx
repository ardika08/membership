import { LayoutGrid, PackageSearch, Search, SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { ProductCard, ProductCardSkeleton } from '@/components/features/product-card'
import { PageTransition } from '@/components/layout/page-transition'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCategoryOptions } from '@/hooks/use-categories'
import { useProducts } from '@/hooks/use-products'
import { cn } from '@/lib/utils'
import type { ProductCategory } from '@/types'

type SortKey = 'popular' | 'newest' | 'price-asc' | 'price-desc'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'popular', label: 'Paling populer' },
  { value: 'newest', label: 'Terbaru' },
  { value: 'price-asc', label: 'Harga terendah' },
  { value: 'price-desc', label: 'Harga tertinggi' },
]

export default function CatalogPage() {
  const { data: products, isLoading } = useProducts()
  const categoryOptions = useCategoryOptions()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ProductCategory | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('popular')

  const filtered = useMemo(() => {
    if (!products) return []
    const keyword = search.trim().toLowerCase()

    const result = products.filter((product) => {
      const matchCategory = category === 'all' || product.category === category
      const matchKeyword =
        !keyword ||
        product.title.toLowerCase().includes(keyword) ||
        product.shortDescription.toLowerCase().includes(keyword)
      return matchCategory && matchKeyword
    })

    return [...result].sort((a, b) => {
      switch (sort) {
        case 'newest':
          return +new Date(b.updatedAt) - +new Date(a.updatedAt)
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        default:
          return b.sales - a.sales
      }
    })
  }, [products, search, category, sort])

  const hasFilter = search.trim() !== '' || category !== 'all'

  const resetFilters = () => {
    setSearch('')
    setCategory('all')
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl">
          <Badge variant="secondary" className="mb-4">
            <LayoutGrid aria-hidden />
            {products?.length ?? 0} produk tersedia
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Katalog Produk Digital
          </h1>
          <p className="text-muted-foreground mt-3 leading-relaxed">
            Template, ebook, prompt AI, dan source code premium yang siap pakai.
            Beli sekali, akses selamanya dari dashboard kamu.
          </p>
        </div>

        {/* Toolbar */}
        <div className="mt-8 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari template, ebook, prompt, source code…"
                aria-label="Cari produk"
                className="pl-10"
              />
            </div>

            <Select
              value={sort}
              onValueChange={(value) => setSort(value as SortKey)}
            >
              <SelectTrigger className="w-full sm:w-52" aria-label="Urutkan">
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="size-4 opacity-60" />
                  <SelectValue />
                </span>
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category chips */}
          <div
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
            role="group"
            aria-label="Filter kategori"
          >
            <button
              type="button"
              onClick={() => setCategory('all')}
              aria-pressed={category === 'all'}
              className={cn(
                'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200',
                category === 'all'
                  ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              Semua
            </button>
            {categoryOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setCategory(item.value)}
                aria-pressed={category === item.value}
                className={cn(
                  'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200',
                  category === item.value
                    ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {hasFilter && !isLoading && (
            <div className="text-muted-foreground flex items-center gap-3 text-sm">
              <span>
                {filtered.length} produk cocok dengan filter kamu
              </span>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X />
                Reset
              </Button>
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="mt-8">
          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="Produk tidak ditemukan"
              description="Coba kata kunci lain atau atur ulang filter kategori untuk melihat semua produk."
              action={
                <Button variant="outline" onClick={resetFilters}>
                  Tampilkan semua produk
                </Button>
              }
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
