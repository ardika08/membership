import { Menu, Search } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { Logo } from '@/components/layout/logo'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { UserMenu } from '@/components/layout/user-menu'
import { Button } from '@/components/ui/button'
import { DomainLink } from '@/components/ui/domain-link'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'
import { memberUrl } from '@/config'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/uiStore'

interface NavbarProps {
  showSidebarToggle?: boolean
  search?: string
  onSearchChange?: (value: string) => void
}

const PUBLIC_LINKS = [{ to: '/', label: 'Katalog' }]

export function Navbar({
  showSidebarToggle = false,
  search,
  onSearchChange,
}: NavbarProps) {
  const { isAuthenticated, isAdmin } = useAuth()
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const location = useLocation()

  return (
    <header className="glass border-border sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        {showSidebarToggle && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={toggleSidebar}
            aria-label="Buka navigasi"
          >
            <Menu />
          </Button>
        )}

        <Logo className="shrink-0" />

        {!showSidebarToggle && (
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {PUBLIC_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  location.pathname === link.to
                    ? 'text-foreground bg-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {onSearchChange && (
          <div className="relative ml-auto hidden max-w-sm flex-1 sm:block">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
            <Input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Cari produk digital…"
              aria-label="Cari produk"
              className="h-10 pl-10"
            />
          </div>
        )}

        <div
          className={cn(
            'flex items-center gap-1.5',
            onSearchChange ? 'ml-2' : 'ml-auto',
          )}
        >
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              {!showSidebarToggle && (
                <Button asChild size="sm" className="hidden sm:inline-flex">
                  <DomainLink to={memberUrl(isAdmin ? '/admin/dashboard' : '/dashboard')}>
                    Dashboard
                  </DomainLink>
                </Button>
              )}
              <UserMenu />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <DomainLink to={memberUrl('/login')}>Masuk</DomainLink>
              </Button>
              <Button asChild size="sm">
                <DomainLink to={memberUrl('/register')}>Daftar</DomainLink>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
