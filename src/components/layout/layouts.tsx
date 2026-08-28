import { Outlet } from 'react-router-dom'

import { Footer } from '@/components/layout/footer'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'

/** Layout publik: navbar + konten + footer. */
export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

/** Layout dashboard member & admin: sidebar tetap + konten. */
export function DashboardLayout({
  variant = 'member',
}: {
  variant?: 'member' | 'admin'
}) {
  return (
    <div className="bg-surface/40 min-h-dvh">
      <Sidebar variant={variant} />
      <div className="lg:pl-64">
        <Navbar showSidebarToggle />
        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

/** Layout auth: terpusat, tanpa navigasi. */
export function AuthLayout() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
      >
        <div className="bg-primary/12 absolute -top-32 -left-32 size-[26rem] rounded-full blur-[120px]" />
        <div className="bg-chart-4/12 absolute -right-32 -bottom-32 size-[26rem] rounded-full blur-[120px]" />
      </div>
      <Outlet />
    </div>
  )
}
