import {
  Coins,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

import { PageHeader } from '@/components/layout/page-header'
import { PageTransition } from '@/components/layout/page-transition'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  POINTS_EARN_RATE,
  POINTS_MAX_REDEEM_PERCENT,
  POINTS_MIN_REDEEM,
  POINTS_REDEEM_VALUE,
  publicUrl,
} from '@/config'
import { DomainLink } from '@/components/ui/domain-link'
import { usePointsSummary } from '@/hooks/use-points'
import { formatDateTime } from '@/lib/utils'
import type { PointEntryType } from '@/types'

const ENTRY_BADGES: Record<
  PointEntryType,
  { label: string; variant: 'success' | 'default' | 'outline'; icon: LucideIcon }
> = {
  earned: { label: 'Diperoleh', variant: 'success', icon: TrendingUp },
  redeemed: { label: 'Ditukar', variant: 'default', icon: TrendingDown },
  adjusted: { label: 'Penyesuaian', variant: 'outline', icon: SlidersHorizontal },
}

const HOW_IT_WORKS = [
  {
    title: 'Cara mendapat poin',
    description: `1 poin untuk setiap Rp${POINTS_EARN_RATE.toLocaleString('id-ID')} belanja terkonfirmasi`,
    icon: ShoppingBag,
  },
  {
    title: 'Nilai tukar',
    description: `1 poin = Rp${POINTS_REDEEM_VALUE.toLocaleString('id-ID')} diskon di transaksi berikutnya`,
    icon: Coins,
  },
  {
    title: 'Syarat tukar',
    description: `Minimal ${POINTS_MIN_REDEEM.toLocaleString('id-ID')} poin, maksimal ${POINTS_MAX_REDEEM_PERCENT}% harga produk`,
    icon: ShieldCheck,
  },
]

function PointAmount({ type, amount }: { type: PointEntryType; amount: number }) {
  const formatted = amount.toLocaleString('id-ID')

  if (type === 'earned') {
    return <span className="text-success font-medium">+{formatted}</span>
  }
  if (type === 'redeemed') {
    return <span className="text-primary">−{formatted}</span>
  }
  return <span className="text-muted-foreground">{formatted}</span>
}

export default function PointsPage() {
  const { data, isLoading } = usePointsSummary()

  const balance = data?.balance ?? 0
  const totalEarned = data?.totalEarned ?? 0
  const totalRedeemed = data?.totalRedeemed ?? 0
  const entries = data?.entries ?? []

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Poin Saya"
          description="Kumpulkan poin dari setiap belanja dan tukarkan jadi diskon untuk transaksi berikutnya."
        />

        {/* Kartu saldo hero */}
        <div className="from-primary/10 via-primary/5 border-border relative overflow-hidden rounded-2xl border bg-gradient-to-br to-transparent p-6 sm:p-8">
          <div
            aria-hidden
            className="bg-primary/10 pointer-events-none absolute -top-20 -right-16 size-64 rounded-full blur-[100px]"
          />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Saldo poin</p>
              {isLoading ? (
                <Skeleton className="mt-2 h-10 w-36" />
              ) : (
                <p className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">
                  {balance.toLocaleString('id-ID')}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
                <p className="text-muted-foreground">
                  Total didapat{' '}
                  <span className="text-success font-medium">
                    {totalEarned.toLocaleString('id-ID')}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Total ditukar{' '}
                  <span className="text-primary font-medium">
                    {totalRedeemed.toLocaleString('id-ID')}
                  </span>
                </p>
              </div>
            </div>
            <Button asChild>
              <DomainLink to={publicUrl('/')}>Jelajahi Katalog</DomainLink>
            </Button>
          </div>
        </div>

        {/* Cara kerja program */}
        <div className="grid gap-4 sm:grid-cols-3">
          {HOW_IT_WORKS.map((item) => (
            <Card key={item.title}>
              <CardContent className="p-5">
                <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                  <item.icon className="size-[18px]" />
                </span>
                <p className="mt-4 text-sm font-medium">{item.title}</p>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Riwayat poin */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-6">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : entries.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead className="text-right">Poin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => {
                    const badge = ENTRY_BADGES[entry.type]
                    const BadgeIcon = badge.icon

                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                          {formatDateTime(entry.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {entry.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant={badge.variant}>
                            <BadgeIcon />
                            {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          <PointAmount type={entry.type} amount={entry.amount} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                icon={Coins}
                title="Belum ada riwayat poin"
                description="Poin akan terkumpul otomatis setiap transaksi belanjamu terkonfirmasi."
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
