import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3,
  Coins,
  Download,
  LayoutDashboard,
  Loader2,
  LogOut,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  Store,
  Tags,
  Ticket,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import { Logo } from '@/components/layout/logo'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth, useLogout } from '@/hooks/use-auth'
import { isAbsoluteUrl, publicUrl } from '@/config'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/uiStore'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const MEMBER_NAV: { title: string; items: NavItem[] }[] = [
  {
    title: 'Member Area',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/dashboard/products', label: 'Produk Saya', icon: Package },
      { to: '/dashboard/points', label: 'Poin', icon: Coins },
      { to: '/dashboard/downloads', label: 'Riwayat Unduhan', icon: Download },
      { to: '/transactions', label: 'Transaksi', icon: Receipt },
    ],
  },
  {
    title: 'Lainnya',
    items: [
      { to: publicUrl('/'), label: 'Katalog Produk', icon: Store, end: true },
      { to: '/profile', label: 'Pengaturan', icon: Settings },
    ],
  },
]

const ADMIN_NAV: { title: string; items: NavItem[] }[] = [
  {
    title: 'Administrasi',
    items: [
      { to: '/admin/dashboard', label: 'Analytics', icon: BarChart3 },
      { to: '/admin/products', label: 'Produk', icon: ShoppingBag },
      { to: '/admin/categories', label: 'Kategori', icon: Tags },
      { to: '/admin/coupons', label: 'Kupon', icon: Ticket },
      { to: '/admin/transactions', label: 'Transaksi', icon: Receipt },
      { to: '/admin/points', label: 'Poin', icon: Coins },
      { to: '/admin/users', label: 'Pengguna', icon: Users },
    ],
  },
  {
    title: 'Lainnya',
    items: [
      { to: publicUrl('/'), label: 'Lihat Katalog', icon: Store, end: true },
      { to: '/profile', label: 'Pengaturan', icon: Settings },
    ],
  },
]

function SidebarNav({ variant }: { variant: 'member' | 'admin' }) {
  const groups = variant === 'admin' ? ADMIN_NAV : MEMBER_NAV
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen)

  return (
    <nav className="flex-1 space-y-6 px-3 py-4" aria-label="Navigasi utama">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="text-muted-foreground px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.label}>
                {isAbsoluteUrl(item.to) ? (
                  <a
                    href={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'group text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    )}
                  >
                    <item.icon
                      className="size-[18px] shrink-0"
                      strokeWidth={1.8}
                    />
                    <span className="truncate">{item.label}</span>
                  </a>
                ) : (
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span
                            layoutId={`sidebar-indicator-${variant}`}
                            className="bg-primary absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full"
                            transition={{
                              type: 'spring',
                              stiffness: 380,
                              damping: 30,
                            }}
                          />
                        )}
                        <item.icon
                          className="size-[18px] shrink-0"
                          strokeWidth={isActive ? 2.2 : 1.8}
                        />
                        <span className="truncate">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function SidebarFooter() {
  const { user } = useAuth()
  const logout = useLogout()

  return (
    <div className="px-3 pb-4">
      <Separator className="mb-3" />
      <div className="bg-surface border-border flex items-center gap-3 rounded-xl border p-3">
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-sm font-medium">
            {user?.name}
          </p>
          <p className="text-muted-foreground truncate text-xs">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-destructive shrink-0"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          aria-label="Keluar"
          title="Keluar"
        >
          {logout.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogOut className="size-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

export function Sidebar({ variant }: { variant: 'member' | 'admin' }) {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen)
  const location = useLocation()

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname, setSidebarOpen])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setSidebarOpen])

  return (
    <>
      {/* Desktop */}
      <aside className="bg-sidebar border-sidebar-border fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r lg:flex">
        <div className="flex h-16 shrink-0 items-center px-5">
          <Logo to={variant === 'admin' ? '/admin/dashboard' : '/dashboard'} />
        </div>
        <SidebarNav variant={variant} />
        <SidebarFooter />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm lg:hidden"
              aria-hidden
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="bg-sidebar border-sidebar-border fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Navigasi"
            >
              <div className="flex h-16 shrink-0 items-center justify-between px-5">
                <Logo
                  to={variant === 'admin' ? '/admin/dashboard' : '/dashboard'}
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Tutup navigasi"
                >
                  <X />
                </Button>
              </div>
              <SidebarNav variant={variant} />
              <SidebarFooter />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
