import {
  Coins,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth, useLogout } from '@/hooks/use-auth'
import { getInitials } from '@/lib/utils'

export function UserMenu() {
  const { user, isAdmin } = useAuth()
  const logout = useLogout()

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-full"
          aria-label="Menu akun"
        >
          <Avatar className="size-8">
            {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[15rem]">
        <DropdownMenuLabel className="px-2.5 py-2">
          <p className="text-foreground truncate text-sm font-semibold">
            {user.name}
          </p>
          <p className="text-muted-foreground truncate text-xs font-normal">
            {user.email}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isAdmin ? (
          <DropdownMenuItem asChild>
            <Link to="/admin/dashboard">
              <ShieldCheck />
              Panel Admin
            </Link>
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link to="/dashboard">
                <LayoutDashboard />
                Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/dashboard/products">
                <Package />
                Produk Saya
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/dashboard/points">
                <Coins />
                Poin Saya
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/transactions">
                <Receipt />
                Transaksi
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuItem asChild>
          <Link to="/profile">
            <Settings />
            Pengaturan Profil
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => logout.mutate()}
        >
          <LogOut />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
