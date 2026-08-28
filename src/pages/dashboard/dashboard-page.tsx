import { motion } from 'framer-motion'
import {
  ArrowRight,
  Coins,
  Download,
  Package,
  Receipt,
  Send,
  ShoppingBag,
  Store,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { POINTS_REDEEM_VALUE, TELEGRAM_GROUP_URL } from '@/config'

import { OwnedStatusBadge, TransactionStatusBadge } from '@/components/features/status-badge'
import { PageTransition } from '@/components/layout/page-transition'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { usePointsSummary } from '@/hooks/use-points'
import { useDownloads, useMyProducts } from '@/hooks/use-products'
import { useTransactions } from '@/hooks/use-transactions'
import { formatCurrency, formatRelativeTime, getGreeting } from '@/lib/utils'

interface Stat {
  label: string
  value: string
  hint: string
  icon: LucideIcon
  to: string
}

function StatsCards({ stats, loading }: { stats: Stat[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-3 p-5">
              <Skeleton className="size-10 rounded-xl" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.06 }}
        >
          <Link to={stat.to} className="block rounded-2xl">
            <Card className="hover:shadow-lift h-full transition-all duration-300 hover:-translate-y-0.5">
              <CardContent className="p-5">
                <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                  <stat.icon className="size-[18px]" />
                </span>
                <p className="mt-4 text-2xl font-semibold tracking-tight">
                  {stat.value}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {stat.label}
                </p>
                <p className="text-muted-foreground/80 mt-2 text-xs">
                  {stat.hint}
                </p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}

const QUICK_ACTIONS = [
  {
    to: '/',
    label: 'Jelajahi Katalog',
    description: 'Temukan produk digital baru',
    icon: Store,
  },
  {
    to: '/dashboard/products',
    label: 'Produk Saya',
    description: 'Unduh produk yang kamu miliki',
    icon: Package,
  },
  {
    to: '/transactions',
    label: 'Riwayat Transaksi',
    description: 'Cek status invoice terakhir',
    icon: Receipt,
  },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: owned, isLoading: ownedLoading } = useMyProducts()
  const { data: transactions, isLoading: trxLoading } = useTransactions()
  const { data: downloads, isLoading: dlLoading } = useDownloads()
  const pointsQuery = usePointsSummary()

  const loading = ownedLoading || trxLoading || dlLoading || pointsQuery.isLoading

  const activeProducts = owned?.filter((o) => o.status === 'active') ?? []
  const paidTransactions = transactions?.filter((t) => t.status === 'paid') ?? []
  const pendingCount =
    transactions?.filter((t) => t.status === 'pending').length ?? 0

  const stats: Stat[] = [
    {
      label: 'Produk dimiliki',
      value: String(activeProducts.length),
      hint: `${owned?.length ?? 0} total pembelian`,
      icon: Package,
      to: '/dashboard/products',
    },
    {
      label: 'Transaksi berhasil',
      value: String(paidTransactions.length),
      hint: pendingCount > 0 ? `${pendingCount} menunggu pembayaran` : 'Semua lunas',
      icon: ShoppingBag,
      to: '/transactions',
    },
    {
      label: 'Total unduhan',
      value: String(downloads?.length ?? 0),
      hint: 'Unduh ulang tanpa batas',
      icon: Download,
      to: '/dashboard/downloads',
    },
    {
      label: 'Saldo Poin',
      value: (pointsQuery.data?.balance ?? 0).toLocaleString('id-ID'),
      hint: `1 poin = Rp${POINTS_REDEEM_VALUE.toLocaleString('id-ID')} diskon`,
      icon: Coins,
      to: '/dashboard/points',
    },
  ]

  const firstName = user?.name.split(' ')[0] ?? 'Member'
  const greeting = getGreeting()

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Greeting banner */}
        <div className="from-primary/10 via-primary/5 border-border relative overflow-hidden rounded-2xl border bg-gradient-to-br to-transparent p-6 sm:p-8">
          <div
            aria-hidden
            className="bg-primary/10 pointer-events-none absolute -top-20 -right-16 size-64 rounded-full blur-[100px]"
          />
          <div className="relative">
            <p className="text-muted-foreground text-sm">
              Member Area
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              {greeting}
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">
              Halo, {firstName} 👋
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-relaxed">
              Semua produk digital kamu tersimpan rapi di sini. Unduh kapan
              saja, kelola transaksi, dan temukan produk baru di katalog.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Button asChild>
                <Link to="/dashboard/products">
                  <Package />
                  Produk Saya
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/">
                  Jelajahi Katalog
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <a
                  href={TELEGRAM_GROUP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Send />
                  Join Grup Support
                </a>
              </Button>
            </div>
          </div>
        </div>

        <StatsCards stats={stats} loading={loading} />

        {/* Quick actions */}
        <div className="grid gap-4 sm:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.to} to={action.to} className="group rounded-2xl">
              <Card className="hover:border-primary/40 hover:shadow-soft h-full transition-all duration-300">
                <CardContent className="flex items-center gap-4 p-5">
                  <span className="bg-accent text-foreground flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                    <action.icon className="size-5" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{action.label}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Aktivitas */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Produk terbaru kamu</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard/products">Lihat semua</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {ownedLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Skeleton className="size-12 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-3/4" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : owned && owned.length > 0 ? (
                <ul className="space-y-1">
                  {owned.slice(0, 4).map((item) => (
                    <li key={item.id}>
                      <Link
                        to="/dashboard/products"
                        className="hover:bg-accent/60 flex items-center gap-3 rounded-xl p-2 transition-colors"
                      >
                        <img
                          src={item.product.cover}
                          alt=""
                          className="size-12 shrink-0 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium">
                              {item.product.title}
                            </p>
                            <span className="hidden shrink-0 sm:inline-flex">
                              <OwnedStatusBadge status={item.status} />
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-2">
                            <p className="text-muted-foreground text-xs">
                              {formatRelativeTime(item.purchasedAt)}
                            </p>
                            <span className="shrink-0 sm:hidden">
                              <OwnedStatusBadge status={item.status} />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={Package}
                  title="Belum ada produk"
                  description="Mulai jelajahi katalog dan temukan produk digital pertama kamu."
                  action={
                    <Button asChild>
                      <Link to="/">Lihat Katalog</Link>
                    </Button>
                  }
                  className="border-0 py-10"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Transaksi terakhir</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link to="/transactions">Lihat semua</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {trxLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-14 w-full" />
                  ))}
                </div>
              ) : transactions && transactions.length > 0 ? (
                <ul className="space-y-1">
                  {transactions.slice(0, 4).map((trx) => (
                    <li
                      key={trx.id}
                      className="hover:bg-accent/60 rounded-xl p-2.5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {trx.product.title}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-medium">
                          {formatCurrency(trx.amount)}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p className="text-muted-foreground min-w-0 truncate font-mono text-xs">
                          {trx.invoiceNumber} · {formatRelativeTime(trx.createdAt)}
                        </p>
                        <TransactionStatusBadge status={trx.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={Receipt}
                  title="Belum ada transaksi"
                  description="Riwayat pembelian kamu akan muncul di sini."
                  className="border-0 py-10"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  )
}
