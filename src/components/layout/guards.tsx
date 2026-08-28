import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { toast } from 'sonner'

import { isMemberDomain, memberUrl } from '@/config'
import { useAuth } from '@/hooks/use-auth'

function FullScreenLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Loader2 className="text-muted-foreground size-6 animate-spin" />
      <span className="sr-only">Memuat…</span>
    </div>
  )
}

/** Melindungi halaman yang membutuhkan autentikasi (PRD §11). */
export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

/** Membatasi akses halaman khusus admin. */
export function RoleGuard({ allow }: { allow: 'admin' | 'member' }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()
  const denied = isAuthenticated && user?.role !== allow

  useEffect(() => {
    if (denied) {
      toast.error('Akses ditolak', {
        description: 'Halaman ini hanya untuk administrator.',
      })
    }
  }, [denied])

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (denied) return <Navigate to="/dashboard" replace />

  return <Outlet />
}

/** Mencegah user yang sudah login membuka halaman login/register. */
export function GuestRoute() {
  const { isAuthenticated, isAdmin } = useAuth()

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin/dashboard' : '/dashboard'} replace />
  }

  return <Outlet />
}

/**
 * Setup multi-domain: alihkan halaman member/auth ke domain member
 * (member.grafistadigital.com) saat dibuka di domain katalog.
 * Tanpa pengaruh di dev lokal / mode satu domain (MEMBER_URL kosong).
 */
export function MemberDomainRoute() {
  const onMemberDomain = isMemberDomain()

  useEffect(() => {
    if (!onMemberDomain) {
      const { pathname, search } = window.location
      window.location.replace(memberUrl(`${pathname}${search}`))
    }
  }, [onMemberDomain])

  if (!onMemberDomain) {
    return <FullScreenLoader />
  }

  return <Outlet />
}

export { FullScreenLoader }
