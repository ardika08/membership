import { zodResolver } from '@hookform/resolvers/zod'
import {
  BadgePercent,
  Check,
  Copy,
  Pencil,
  Plus,
  Search,
  Ticket,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/page-header'
import { PageTransition } from '@/components/layout/page-transition'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { TextInput } from '@/components/ui/form-field'
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
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  useCoupons,
  useCreateCoupon,
  useDeleteCoupon,
  useUpdateCoupon,
} from '@/hooks/use-coupons'
import type { Coupon, CouponInput, CouponType } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { couponSchema, type CouponValues } from '@/lib/validations'

const EMPTY_FORM: CouponValues = {
  code: '',
  type: 'percentage',
  value: 10,
  minPurchase: 0,
  maxDiscount: 0,
  expiresAt: '',
  description: '',
}

function CouponFormDialog({
  open,
  onOpenChange,
  coupon,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  coupon: Coupon | null
}) {
  const createCoupon = useCreateCoupon()
  const updateCoupon = useUpdateCoupon()
  const isEdit = Boolean(coupon)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CouponValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: EMPTY_FORM,
  })

  useEffect(() => {
    if (!open) return
    reset(
      coupon
        ? {
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            minPurchase: coupon.minPurchase,
            maxDiscount: coupon.maxDiscount ?? 0,
            expiresAt: coupon.expiresAt.slice(0, 10),
            description: coupon.description,
          }
        : EMPTY_FORM,
    )
  }, [open, coupon, reset])

  const type = watch('type')

  const onSubmit = async (values: CouponValues) => {
    const payload: CouponInput = {
      code: values.code.trim().toUpperCase(),
      type: values.type,
      value: values.value,
      minPurchase: values.minPurchase,
      maxDiscount:
        values.type === 'percentage' && values.maxDiscount > 0
          ? values.maxDiscount
          : undefined,
      expiresAt: new Date(`${values.expiresAt}T23:59:59`).toISOString(),
      description: values.description.trim(),
    }
    if (coupon) {
      await updateCoupon.mutateAsync({ id: coupon.id, payload })
    } else {
      await createCoupon.mutateAsync(payload)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Ubah Kupon' : 'Tambah Kupon Baru'}</DialogTitle>
          <DialogDescription>
            Kupon aktif bisa dipakai member di halaman checkout untuk
            mendapatkan potongan harga.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Kode kupon"
              placeholder="GRAFIS20"
              hint="Huruf besar otomatis saat disimpan"
              error={errors.code?.message}
              {...register('code')}
            />

            <div className="space-y-2">
              <Label htmlFor="coupon-type">Tipe diskon</Label>
              <Select
                value={type}
                onValueChange={(value) =>
                  setValue('type', value as CouponType, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="coupon-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Persentase (%)</SelectItem>
                  <SelectItem value="fixed">Nominal (Rp)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label={type === 'percentage' ? 'Diskon (%)' : 'Diskon (Rp)'}
              type="number"
              min={1}
              step={type === 'percentage' ? 1 : 1000}
              placeholder={type === 'percentage' ? '20' : '50000'}
              error={errors.value?.message}
              {...register('value', {
                setValueAs: (v) => (v === '' || v === null ? 0 : Number(v)),
              })}
            />

            <TextInput
              label="Minimal pembelian (Rp)"
              type="number"
              min={0}
              step={1000}
              placeholder="0"
              hint="0 = tanpa minimum belanja"
              error={errors.minPurchase?.message}
              {...register('minPurchase', {
                setValueAs: (v) => (v === '' || v === null ? 0 : Number(v)),
              })}
            />
          </div>

          {type === 'percentage' && (
            <TextInput
              label="Maksimal diskon (Rp, opsional)"
              type="number"
              min={0}
              step={1000}
              placeholder="50000"
              hint="Kosongkan / 0 = tanpa batas"
              error={errors.maxDiscount?.message}
              {...register('maxDiscount', {
                setValueAs: (v) => (v === '' || v === null ? 0 : Number(v)),
              })}
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="expiresAt">Berlaku hingga</Label>
            <Input
              id="expiresAt"
              type="date"
              aria-invalid={!!errors.expiresAt}
              {...register('expiresAt')}
            />
            {errors.expiresAt && (
              <p role="alert" className="text-destructive text-xs">
                {errors.expiresAt.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="coupon-description">Deskripsi</Label>
            <Textarea
              id="coupon-description"
              rows={2}
              placeholder="Contoh: Diskon 20%, maksimal Rp50.000"
              aria-invalid={!!errors.description}
              {...register('description')}
            />
            {errors.description && (
              <p role="alert" className="text-destructive text-xs">
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              loading={createCoupon.isPending || updateCoupon.isPending}
            >
              {isEdit ? 'Simpan Perubahan' : 'Tambah Kupon'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminCouponsPage() {
  const { data: coupons, isLoading } = useCoupons()
  const updateCoupon = useUpdateCoupon()
  const deleteCoupon = useDeleteCoupon()

  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [deleting, setDeleting] = useState<Coupon | null>(null)

  const filtered = (coupons ?? []).filter((c) => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return true
    return (
      c.code.toLowerCase().includes(keyword) ||
      c.description.toLowerCase().includes(keyword)
    )
  })

  const isExpired = (coupon: Coupon) => new Date(coupon.expiresAt) < new Date()

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon)
    setFormOpen(true)
  }

  const toggleActive = (coupon: Coupon) => {
    updateCoupon.mutate({
      id: coupon.id,
      payload: { isActive: coupon.isActive === false },
    })
  }

  const copyCode = async (coupon: Coupon) => {
    try {
      await navigator.clipboard.writeText(coupon.code)
      setCopied(coupon.code)
      toast.success(`Kode ${coupon.code} disalin`)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      toast.error('Gagal menyalin kode')
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    await deleteCoupon.mutateAsync(deleting.id)
    setDeleting(null)
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Kelola Kupon"
          description="Atur kode kupon diskon yang bisa dipakai member saat checkout."
          actions={
            <Button onClick={openCreate}>
              <Plus />
              Tambah Kupon
            </Button>
          }
        />

        <div className="relative max-w-sm">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode kupon…"
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title={
              (coupons ?? []).length > 0
                ? 'Kupon tidak ditemukan'
                : 'Belum ada kupon'
            }
            description={
              (coupons ?? []).length > 0
                ? 'Coba kata kunci pencarian lain.'
                : 'Buat kupon pertama untuk memberikan potongan harga ke member.'
            }
            action={
              <Button onClick={openCreate}>
                <Plus />
                Tambah Kupon
              </Button>
            }
          />
        ) : (
          <Card className="p-0">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Diskon</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Min. Belanja
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Berlaku Hingga
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted rounded-md px-2 py-1 font-mono text-sm font-semibold tracking-wide">
                            {coupon.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => copyCode(coupon)}
                            aria-label={`Salin kode ${coupon.code}`}
                            className="text-muted-foreground"
                          >
                            {copied === coupon.code ? (
                              <Check className="text-success" />
                            ) : (
                              <Copy />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="gap-1">
                            {coupon.type === 'percentage' ? (
                              <BadgePercent className="size-3" />
                            ) : null}
                            {coupon.type === 'percentage'
                              ? `${coupon.value}%`
                              : formatCurrency(coupon.value)}
                          </Badge>
                          {coupon.maxDiscount ? (
                            <span className="text-muted-foreground text-xs">
                              maks {formatCurrency(coupon.maxDiscount)}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-muted-foreground text-sm">
                          {coupon.minPurchase > 0
                            ? formatCurrency(coupon.minPurchase)
                            : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {formatDate(coupon.expiresAt)}
                          </span>
                          {isExpired(coupon) && (
                            <Badge variant="destructive">Kedaluwarsa</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={coupon.isActive !== false}
                          disabled={isExpired(coupon)}
                          onCheckedChange={() => toggleActive(coupon)}
                          aria-label={`Aktifkan kupon ${coupon.code}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEdit(coupon)}
                            aria-label={`Ubah kupon ${coupon.code}`}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeleting(coupon)}
                            aria-label={`Hapus kupon ${coupon.code}`}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <CouponFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        coupon={editing}
      />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus kupon "{deleting?.code}"?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Member tidak akan bisa menggunakan kode ini lagi. Riwayat
              transaksi yang sudah memakai kupon ini tidak terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  )
}
