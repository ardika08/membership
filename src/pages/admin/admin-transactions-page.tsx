import {
  Clock,
  ExternalLink,
  Receipt,
  Search,
  ShoppingBag,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { TransactionStatusBadge } from '@/components/features/status-badge'
import { PageHeader } from '@/components/layout/page-header'
import { PageTransition } from '@/components/layout/page-transition'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
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
import { useAdminTransactions } from '@/hooks/use-transactions'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import type { TransactionStatus } from '@/types'

const STATUS_OPTIONS: { value: TransactionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua status' },
  { value: 'paid', label: 'Lunas' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'expired', label: 'Kedaluwarsa' },
  { value: 'failed', label: 'Gagal' },
]

interface Stat {
  label: string
  value: string
  hint: string
  icon: LucideIcon
}

function StatsCards({ stats, loading }: { stats: Stat[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-3 p-5">
              <Skeleton className="size-10 rounded-xl" />
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-5">
            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
              <stat.icon className="size-[18px]" aria-hidden />
            </span>
            <p className="mt-4 text-2xl font-semibold tracking-tight">
              {stat.value}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">{stat.label}</p>
            <p className="text-muted-foreground/80 mt-2 text-xs">{stat.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function AdminTransactionsPage() {
  const { data: transactions, isLoading } = useAdminTransactions()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<TransactionStatus | 'all'>('all')

  const filtered = useMemo(() => {
    if (!transactions) return []
    const keyword = search.trim().toLowerCase()

    return transactions.filter((trx) => {
      const matchStatus = status === 'all' || trx.status === status
      const matchKeyword =
        !keyword ||
        trx.invoiceNumber.toLowerCase().includes(keyword) ||
        trx.product.title.toLowerCase().includes(keyword)
      return matchStatus && matchKeyword
    })
  }, [transactions, search, status])

  const paid = transactions?.filter((trx) => trx.status === 'paid') ?? []
  const pendingCount =
    transactions?.filter((trx) => trx.status === 'pending').length ?? 0
  const revenue = paid.reduce((sum, trx) => sum + trx.amount, 0)

  const stats: Stat[] = [
    {
      label: 'Total pendapatan',
      value: formatCurrency(revenue),
      hint: 'Dari transaksi berstatus lunas',
      icon: Wallet,
    },
    {
      label: 'Transaksi lunas',
      value: String(paid.length),
      hint: 'Pembayaran terkonfirmasi',
      icon: ShoppingBag,
    },
    {
      label: 'Menunggu pembayaran',
      value: String(pendingCount),
      hint: 'Invoice belum diselesaikan',
      icon: Clock,
    },
    {
      label: 'Total transaksi',
      value: String(transactions?.length ?? 0),
      hint: 'Seluruh invoice tercatat',
      icon: Receipt,
    },
  ]

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Monitoring Transaksi"
          description="Pantau seluruh transaksi user, status pembayaran, dan pendapatan yang masuk secara real-time."
        />

        <StatsCards stats={stats} loading={isLoading} />

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nomor invoice atau produk…"
              aria-label="Cari transaksi"
              className="pl-10"
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as typeof status)}
          >
            <SelectTrigger className="w-full sm:w-48" aria-label="Filter status transaksi">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((trx) => (
                    <TableRow key={trx.id}>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {trx.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={trx.product.cover}
                            alt=""
                            className="size-10 shrink-0 rounded-lg object-cover"
                          />
                          <span className="line-clamp-1 max-w-[16rem] text-sm font-medium">
                            {trx.product.title}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium whitespace-nowrap">
                        {formatCurrency(trx.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {trx.paymentMethod ?? '—'}
                      </TableCell>
                      <TableCell>
                        <TransactionStatusBadge status={trx.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {formatDateTime(trx.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <a
                            href={trx.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Invoice
                            <ExternalLink />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                icon={Receipt}
                title={
                  transactions && transactions.length > 0
                    ? 'Tidak ada transaksi yang cocok'
                    : 'Belum ada transaksi'
                }
                description={
                  transactions && transactions.length > 0
                    ? 'Coba ubah kata kunci pencarian atau filter status.'
                    : 'Transaksi dari seluruh user akan tampil di halaman ini.'
                }
                className="border-0"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
