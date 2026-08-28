import {
  ArrowDownRight,
  ArrowUpRight,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { PageHeader } from '@/components/layout/page-header'
import { PageTransition } from '@/components/layout/page-transition'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminStats } from '@/hooks/use-admin'
import { cn, formatCurrency } from '@/lib/utils'

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

function compactCurrency(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} jt`
  if (value >= 1_000) return `${Math.round(value / 1_000)} rb`
  return String(value)
}

function ChartTooltip({
  active,
  payload,
  label,
  currency = false,
}: {
  active?: boolean
  payload?: { name?: string; value?: number; color?: string }[]
  label?: string
  currency?: boolean
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-popover border-border shadow-lift rounded-xl border p-3 text-xs">
      {label && <p className="mb-1.5 font-medium">{label}</p>}
      {payload.map((entry) => (
        <p
          key={entry.name}
          className="text-muted-foreground flex items-center gap-2"
        >
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="capitalize">{entry.name}</span>
          <span className="text-foreground ml-auto font-medium">
            {currency
              ? formatCurrency(entry.value ?? 0)
              : (entry.value ?? 0).toLocaleString('id-ID')}
          </span>
        </p>
      ))}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  growth: number
  icon: LucideIcon
}

function StatCard({ label, value, growth, icon: Icon }: StatCardProps) {
  const positive = growth >= 0

  return (
    <Card className="hover:shadow-lift transition-shadow duration-300">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
            <Icon className="size-[18px]" />
          </span>
          <Badge variant={positive ? 'success' : 'destructive'}>
            {positive ? <ArrowUpRight /> : <ArrowDownRight />}
            {Math.abs(growth)}%
          </Badge>
        </div>
        <p className="mt-4 text-2xl font-semibold tracking-tight">{value}</p>
        <p className="text-muted-foreground mt-1 text-sm">{label}</p>
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-3 p-5">
              <Skeleton className="size-10 rounded-xl" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useAdminStats()

  if (isLoading || !stats) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <PageHeader
            title="Dashboard Admin"
            description="Ringkasan performa penjualan produk digital."
          />
          <DashboardSkeleton />
        </div>
      </PageTransition>
    )
  }

  const maxSales = Math.max(...stats.popularProducts.map((p) => p.sales))

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard Admin"
          description="Ringkasan performa penjualan, pertumbuhan pengguna, dan produk terpopuler."
          actions={
            <Badge variant="secondary">
              <TrendingUp aria-hidden />6 bulan terakhir
            </Badge>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total pendapatan"
            value={formatCurrency(stats.revenue)}
            growth={stats.revenueGrowth}
            icon={TrendingUp}
          />
          <StatCard
            label="Total pesanan"
            value={stats.orders.toLocaleString('id-ID')}
            growth={stats.ordersGrowth}
            icon={ShoppingCart}
          />
          <StatCard
            label="Pengguna terdaftar"
            value={stats.users.toLocaleString('id-ID')}
            growth={stats.usersGrowth}
            icon={Users}
          />
          <StatCard
            label="Produk aktif"
            value={String(stats.products)}
            growth={stats.productsGrowth}
            icon={Package}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Pendapatan</CardTitle>
              <CardDescription>
                Tren pendapatan bulanan dalam 6 bulan terakhir
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-0">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stats.revenueSeries}
                    margin={{ top: 8, right: 20, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="revenueGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0.32}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke="var(--border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={compactCurrency}
                      width={56}
                    />
                    <Tooltip
                      content={<ChartTooltip currency />}
                      cursor={{ stroke: 'var(--border)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="pendapatan"
                      stroke="var(--chart-1)"
                      strokeWidth={2.5}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Distribusi Kategori</CardTitle>
              <CardDescription>Porsi penjualan per kategori</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryBreakdown}
                      dataKey="value"
                      nameKey="category"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {stats.categoryBreakdown.map((entry, index) => (
                        <Cell
                          key={entry.category}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <ul className="mt-4 space-y-2">
                {stats.categoryBreakdown.map((entry, index) => (
                  <li
                    key={entry.category}
                    className="flex items-center gap-2.5 text-sm"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                    <span className="text-muted-foreground flex-1 truncate">
                      {entry.category}
                    </span>
                    <span className="font-medium">{entry.value}%</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* User growth */}
          <Card>
            <CardHeader>
              <CardTitle>Pertumbuhan Pengguna</CardTitle>
              <CardDescription>
                Total pengguna terdaftar per bulan
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-0">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.userGrowthSeries}
                    margin={{ top: 8, right: 20, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke="var(--border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      width={48}
                    />
                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{ fill: 'var(--accent)' }}
                    />
                    <Bar
                      dataKey="users"
                      name="pengguna"
                      fill="var(--chart-2)"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={44}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Popular products */}
          <Card>
            <CardHeader>
              <CardTitle>Produk Terpopuler</CardTitle>
              <CardDescription>
                Lima produk dengan penjualan tertinggi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.popularProducts.map((product, index) => (
                <div key={product.id} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold',
                        index === 0
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {index + 1}
                    </span>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">
                      {product.title}
                    </p>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {product.sales.toLocaleString('id-ID')} terjual
                    </span>
                  </div>
                  <div className="flex items-center gap-3 pl-9">
                    <Progress
                      value={(product.sales / maxSales) * 100}
                      className="h-1.5"
                    />
                    <span className="text-muted-foreground w-24 shrink-0 text-right text-xs">
                      {formatCurrency(product.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  )
}
