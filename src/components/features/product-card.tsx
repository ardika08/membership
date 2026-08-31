import { motion } from 'framer-motion'
import { ArrowUpRight, Star } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategoryLabel } from '@/hooks/use-categories'
import { memberUrl } from '@/config'
import { cn, computeDiscountPercent, formatCurrency } from '@/lib/utils'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  index?: number
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const categoryLabel = useCategoryLabel()
  const discount = computeDiscountPercent(product.price, product.originalPrice)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.04, 0.3),
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Card className="group hover:shadow-lift h-full overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1">
        <Link
          to={memberUrl(`/products/${product.id}`)}
          className="flex h-full flex-col rounded-2xl focus-visible:outline-none"
        >
          <div className="bg-muted relative aspect-[16/10] overflow-hidden">
            <img
              src={product.cover}
              alt=""
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
            <div className="absolute top-3 left-3 flex gap-1.5">
              <Badge className="glass border-white/20 text-white shadow-sm backdrop-blur">
                {categoryLabel(product.category)}
              </Badge>
              {discount > 0 && (
                <Badge variant="destructive" className="bg-destructive text-white">
                  -{discount}%
                </Badge>
              )}
            </div>
            <span className="glass absolute right-3 bottom-3 flex size-8 items-center justify-center rounded-full text-foreground opacity-0 transition-all duration-300 group-hover:opacity-100">
              <ArrowUpRight className="size-4" />
            </span>
          </div>

          <div className="flex flex-1 flex-col gap-3 p-5">
            <div className="space-y-1.5">
              <h3 className="group-hover:text-primary line-clamp-2 text-[15px] leading-snug font-semibold transition-colors">
                {product.title}
              </h3>
              <p className="text-muted-foreground line-clamp-2 text-[13px] leading-relaxed">
                {product.shortDescription}
              </p>
            </div>

            <div className="mt-auto flex items-end justify-between gap-3 pt-1">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[17px] font-semibold tracking-tight">
                    {formatCurrency(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-muted-foreground text-xs line-through">
                      {formatCurrency(product.originalPrice)}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {product.sales.toLocaleString('id-ID')} terjual
                </p>
              </div>

              <div className="text-muted-foreground flex items-center gap-1 text-xs">
                <Star className="fill-warning text-warning size-3.5" />
                <span className="text-foreground font-medium">
                  {product.rating.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </Link>
      </Card>
    </motion.div>
  )
}

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden p-0', className)}>
      <Skeleton className="aspect-[16/10] rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-10" />
        </div>
      </div>
    </Card>
  )
}
