import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'

import { FullScreenLoader, GuestRoute, MemberDomainRoute, ProtectedRoute, RoleGuard } from '@/components/layout/guards'
import {
  AuthLayout,
  DashboardLayout,
  PublicLayout,
} from '@/components/layout/layouts'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useThemeStore } from '@/store/themeStore'

/* Code-splitting per halaman agar initial bundle tetap ringan. */
const CatalogPage = lazy(() => import('@/pages/public/catalog-page'))
const ProductDetailPage = lazy(
  () => import('@/pages/public/product-detail-page'),
)
const LoginPage = lazy(() => import('@/pages/auth/login-page'))
const RegisterPage = lazy(() => import('@/pages/auth/register-page'))
const DashboardPage = lazy(() => import('@/pages/dashboard/dashboard-page'))
const MyProductsPage = lazy(() => import('@/pages/dashboard/my-products-page'))
const DownloadsPage = lazy(() => import('@/pages/dashboard/downloads-page'))
const PointsPage = lazy(() => import('@/pages/dashboard/points-page'))
const TransactionsPage = lazy(
  () => import('@/pages/dashboard/transactions-page'),
)
const ProfilePage = lazy(() => import('@/pages/dashboard/profile-page'))
const AdminDashboardPage = lazy(
  () => import('@/pages/admin/admin-dashboard-page'),
)
const AdminProductsPage = lazy(
  () => import('@/pages/admin/admin-products-page'),
)
const AdminTransactionsPage = lazy(
  () => import('@/pages/admin/admin-transactions-page'),
)
const AdminUsersPage = lazy(() => import('@/pages/admin/admin-users-page'))
const AdminPointsPage = lazy(() => import('@/pages/admin/admin-points-page'))
const AdminCategoriesPage = lazy(() => import('@/pages/admin/admin-categories-page'))
const AdminCouponsPage = lazy(() => import('@/pages/admin/admin-coupons-page'))
const NotFoundPage = lazy(() => import('@/pages/not-found-page'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return null
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          {/* Setup multi-domain: halaman member/auth hanya hidup di domain member */}
          <Route element={<MemberDomainRoute />}>
            {/* Auth (guest only) */}
            <Route element={<GuestRoute />}>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>
            </Route>
          </Route>

          {/* Publik */}
          <Route element={<PublicLayout />}>
            <Route index element={<CatalogPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Member area */}
          <Route element={<MemberDomainRoute />}>
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout variant="member" />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route
                  path="/dashboard/products"
                  element={<MyProductsPage />}
                />
                <Route
                  path="/dashboard/downloads"
                  element={<DownloadsPage />}
                />
                <Route path="/dashboard/points" element={<PointsPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>
          </Route>

          {/* Admin area */}
          <Route element={<MemberDomainRoute />}>
            <Route element={<RoleGuard allow="admin" />}>
              <Route element={<DashboardLayout variant="admin" />}>
                <Route
                  path="/admin/dashboard"
                  element={<AdminDashboardPage />}
                />
                <Route path="/admin/products" element={<AdminProductsPage />} />
                <Route
                  path="/admin/transactions"
                  element={<AdminTransactionsPage />}
                />
                <Route path="/admin/points" element={<AdminPointsPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                <Route path="/admin/coupons" element={<AdminCouponsPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}

export default function App() {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <Toaster
          position="top-right"
          theme={resolvedTheme}
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: 'rounded-xl border-border',
            },
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  )
}
