import {
  MoreHorizontal,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  DeleteUserDialog,
  EditUserDialog,
} from '@/components/features/admin-user-dialogs'
import { PageHeader } from '@/components/layout/page-header'
import { PageTransition } from '@/components/layout/page-transition'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { useAdminUsers } from '@/hooks/use-admin'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import type { AdminUser, Role } from '@/types'

const ROLE_OPTIONS: { value: Role | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua role' },
  { value: 'member', label: 'Member' },
  { value: 'admin', label: 'Administrator' },
]

const ROLE_LABEL: Record<Role, string> = {
  member: 'Member',
  admin: 'Admin',
}

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

function UserActions({
  user,
  onEdit,
  onDelete,
}: {
  user: AdminUser
  onEdit: (user: AdminUser) => void
  onDelete: (user: AdminUser) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Aksi pengguna">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onEdit(user)}>
          <Pencil />
          Ubah pengguna
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => onDelete(user)}
        >
          <Trash2 />
          Hapus pengguna
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function AdminUsersPage() {
  const { data: users, isLoading } = useAdminUsers()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<Role | 'all'>('all')
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)

  const filtered = useMemo(() => {
    if (!users) return []
    const keyword = search.trim().toLowerCase()

    return users.filter((user) => {
      const matchRole = role === 'all' || user.role === role
      const matchKeyword =
        !keyword ||
        user.name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        user.whatsapp.toLowerCase().includes(keyword)
      return matchRole && matchKeyword
    })
  }, [users, search, role])

  const activeCount = users?.filter((user) => user.status === 'active').length ?? 0
  const adminCount = users?.filter((user) => user.role === 'admin').length ?? 0
  const totalSpent = users?.reduce((sum, user) => sum + user.totalSpent, 0) ?? 0

  const stats: Stat[] = [
    {
      label: 'Total pengguna',
      value: String(users?.length ?? 0),
      hint: 'Seluruh akun terdaftar',
      icon: Users,
    },
    {
      label: 'Pengguna aktif',
      value: String(activeCount),
      hint: 'Akun tanpa status suspend',
      icon: UserCheck,
    },
    {
      label: 'Administrator',
      value: String(adminCount),
      hint: 'Akun dengan akses penuh',
      icon: ShieldCheck,
    },
    {
      label: 'Total nilai belanja',
      value: formatCurrency(totalSpent),
      hint: 'Akumulasi dari semua pengguna',
      icon: Wallet,
    },
  ]

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Manajemen Pengguna"
          description="Kelola akun member dan administrator, pantau aktivitas belanja serta status setiap pengguna."
        />

        <StatsCards stats={stats} loading={isLoading} />

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, email, atau nomor WhatsApp…"
              aria-label="Cari pengguna"
              className="pl-10"
            />
          </div>
          <Select
            value={role}
            onValueChange={(value) => setRole(value as typeof role)}
          >
            <SelectTrigger className="w-full sm:w-48" aria-label="Filter role pengguna">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((option) => (
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
                    <TableHead>Pengguna</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Total Belanja</TableHead>
                    <TableHead>Bergabung</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {user.name}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {user.whatsapp}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.role === 'admin' ? 'default' : 'secondary'}
                        >
                          {ROLE_LABEL[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.status === 'active' ? 'success' : 'destructive'
                          }
                        >
                          {user.status === 'active' ? 'Aktif' : 'Ditangguhkan'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {user.productsOwned}
                      </TableCell>
                      <TableCell className="text-sm font-medium whitespace-nowrap">
                        {formatCurrency(user.totalSpent)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {formatDate(user.joinedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <UserActions
                          user={user}
                          onEdit={setEditingUser}
                          onDelete={setDeletingUser}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                icon={Users}
                title={
                  users && users.length > 0
                    ? 'Tidak ada pengguna yang cocok'
                    : 'Belum ada pengguna'
                }
                description={
                  users && users.length > 0
                    ? 'Coba ubah kata kunci pencarian atau filter role.'
                    : 'Daftar akun yang terdaftar akan tampil di halaman ini.'
                }
                className="border-0"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <EditUserDialog
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
      />

      <DeleteUserDialog
        user={deletingUser}
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
      />
    </PageTransition>
  )
}
