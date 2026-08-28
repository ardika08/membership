import { ExternalLink, Receipt, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { publicUrl } from '@/config'
import { TransactionStatusBadge } from '@/components/features/status-badge'
import { PageHeader } from '@/components/layout/page-header'
import { PageTransition } from '@/components/layout/page-transition'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DomainLink } from '@/components/ui/domain-link'
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
import { useTransactions } from '@/hooks/use-transactions'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import type { TransactionStatus } from '@/types'

const STATUS_OPTIONS: { value: TransactionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua status' },
  { value: 'paid', label: 'Lunas' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'expired', label: 'Kedaluwarsa' },
  { value: 'failed', label: 'Gagal' },
]

export default function TransactionsPage() {
  const { data: transactions, isLoading } = useTransactions()
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

  const totalPaid =
    transactions
      ?.filter((t) => t.status === 'paid')
      .reduce((sum, t) => sum + t.amount, 0) ?? 0

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Riwayat Transaksi"
          description="Pantau status invoice dan detail pembayaran setiap pembelian kamu."
          actions={
            <div className="border-border bg-card rounded-xl border px-4 py-2.5 text-right">
              <p className="text-muted-foreground text-xs">Total belanja</p>
              <p className="text-base font-semibold tracking-tight">
                {formatCurrency(totalPaid)}
              </p>
            </div>
          }
        />

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
            <SelectTrigger className="w-full sm:w-48" aria-label="Filter status">
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
                {Array.from({ length: 5 }).map((_, index) => (
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
                        <Link
                          to={`/products/${trx.product.id}`}
                          className="hover:text-primary line-clamp-1 max-w-[16rem] text-sm font-medium transition-colors"
                        >
                          {trx.product.title}
                        </Link>
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
                        {trx.status === 'pending' ? (
                          <Button asChild size="sm">
                            <a
                              href={trx.invoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Bayar
                              <ExternalLink />
                            </a>
                          </Button>
                        ) : (
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
                        )}
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
                    ? 'Coba ubah kata kunci atau filter status.'
                    : 'Setiap pembelian yang kamu lakukan akan tercatat di sini.'
                }
                action={
                  <Button asChild>
                    <DomainLink to={publicUrl('/')}>Jelajahi Katalog</DomainLink>
                  </Button>
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
