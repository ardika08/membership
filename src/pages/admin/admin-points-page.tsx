import {
  Coins,
  HandCoins,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { PageHeader } from '@/components/layout/page-header'
import { PageTransition } from '@/components/layout/page-transition'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
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
import { useAdminUsers } from '@/hooks/use-admin'
import { useAdjustUserPoints, useAdminPoints } from '@/hooks/use-points'
import { formatDateTime } from '@/lib/utils'
import type { AdminPointEntry, PointEntryType } from '@/types'

interface Stat {
  label: string
  value: string
  hint: string
  icon: LucideIcon
}

const TYPE_BADGE: Record<
  PointEntryType,
  { variant: 'success' | 'default' | 'outline'; icon: LucideIcon; label: string }
> = {
  earned: { variant: 'success', icon: TrendingUp, label: 'Diperoleh' },
  redeemed: { variant: 'default', icon: TrendingDown, label: 'Ditukar' },
  adjusted: { variant: 'outline', icon: SlidersHorizontal, label: 'Penyesuaian' },
}

function formatPoints(value: number) {
  return value.toLocaleString('id-ID')
}

function EntryAmount({ entry }: { entry: AdminPointEntry }) {
  if (entry.type === 'earned') {
    return (
      <span className="text-success font-medium whitespace-nowrap">
        +{formatPoints(entry.amount)}
      </span>
    )
  }

  if (entry.type === 'redeemed') {
    return (
      <span className="text-primary font-medium whitespace-nowrap">
        −{formatPoints(entry.amount)}
      </span>
    )
  }

  return (
    <span className="text-muted-foreground font-medium whitespace-nowrap">
      {formatPoints(entry.amount)}
    </span>
  )
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
            <p className="mt-4 text-2xl font-semibold tracking-tight">{stat.value}</p>
            <p className="text-muted-foreground mt-1 text-sm">{stat.label}</p>
            <p className="text-muted-foreground/80 mt-2 text-xs">{stat.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function AdjustPointsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: users } = useAdminUsers()
  const adjustPoints = useAdjustUserPoints()

  const [userId, setUserId] = useState('')
  const [type, setType] = useState<'add' | 'subtract'>('add')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const members = useMemo(
    () => users?.filter((user) => user.role === 'member') ?? [],
    [users],
  )
  const selectedMember = members.find((member) => member.id === userId) ?? null

  useEffect(() => {
    if (!open) {
      setUserId('')
      setType('add')
      setAmount('')
      setNote('')
      setError(null)
    }
  }, [open])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const parsedAmount = Number(amount)
    if (!userId) {
      setError('Pilih member terlebih dahulu.')
      return
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount < 1) {
      setError('Jumlah poin minimal 1.')
      return
    }

    setError(null)
    try {
      await adjustPoints.mutateAsync({
        userId,
        type,
        amount: parsedAmount,
        note: note.trim() || undefined,
      })
      onOpenChange(false)
    } catch {
      // Toast error sudah ditangani oleh hook.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sesuaikan Poin</DialogTitle>
          <DialogDescription>
            Tambah atau kurangi saldo poin milik member secara manual.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label>Pilih member</Label>
            <Select
              value={userId}
              onValueChange={(value) => {
                setUserId(value)
                setError(null)
              }}
            >
              <SelectTrigger aria-label="Pilih member">
                <SelectValue placeholder="Pilih member" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} · {member.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMember && (
              <p className="text-muted-foreground text-xs">
                Saldo saat ini: {formatPoints(selectedMember.points)} poin
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Jenis penyesuaian</Label>
            <Select value={type} onValueChange={(value) => setType(value as typeof type)}>
              <SelectTrigger aria-label="Jenis penyesuaian">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Tambah poin</SelectItem>
                <SelectItem value="subtract">Kurangi poin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjust-amount">Jumlah poin</Label>
            <Input
              id="adjust-amount"
              type="number"
              min={1}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              aria-label="Jumlah poin"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjust-note">Catatan</Label>
            <Input
              id="adjust-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Alasan penyesuaian"
            />
          </div>

          {error && <p className="text-destructive text-xs font-medium">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={adjustPoints.isPending}
            >
              Batal
            </Button>
            <Button type="submit" loading={adjustPoints.isPending}>
              Simpan Penyesuaian
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminPointsPage() {
  const { data, isLoading } = useAdminPoints()
  const [dialogOpen, setDialogOpen] = useState(false)

  const stats: Stat[] = [
    {
      label: 'Total Poin Beredar',
      value: formatPoints(data?.stats.outstanding ?? 0),
      hint: 'Saldo poin beredar di seluruh member',
      icon: Coins,
    },
    {
      label: 'Poin Diperoleh',
      value: formatPoints(data?.stats.earned30d ?? 0),
      hint: '30 hari terakhir',
      icon: TrendingUp,
    },
    {
      label: 'Poin Ditukar',
      value: formatPoints(data?.stats.redeemed30d ?? 0),
      hint: '30 hari terakhir',
      icon: TrendingDown,
    },
    {
      label: 'Member Berpoin',
      value: formatPoints(data?.stats.membersWithPoints ?? 0),
      hint: 'punya saldo poin',
      icon: Users,
    },
  ]

  const entries = data?.entries ?? []

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Program Poin"
          description="Pantau perolehan, penukaran, dan penyesuaian poin member dalam satu tampilan terpadu."
          actions={
            <Button onClick={() => setDialogOpen(true)}>
              <HandCoins />
              Sesuaikan Poin
            </Button>
          }
        />

        <StatsCards stats={stats} loading={isLoading} />

        <Card>
          <CardHeader>
            <CardTitle>Riwayat Poin</CardTitle>
            <CardDescription>
              Seluruh mutasi poin dari semua member, terbaru di atas.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : entries.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Waktu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => {
                    const badge = TYPE_BADGE[entry.type]

                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{entry.user.name}</span>
                            <span className="text-muted-foreground text-xs">
                              {entry.user.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={badge.variant}>
                            <badge.icon aria-hidden />
                            {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <EntryAmount entry={entry} />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {entry.description}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                          {formatDateTime(entry.createdAt)}
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
                description="Mutasi poin dari semua member akan tampil di halaman ini."
                className="border-0"
              />
            )}
          </CardContent>
        </Card>

        <AdjustPointsDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>
    </PageTransition>
  )
}
