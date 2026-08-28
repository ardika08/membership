import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  CheckCircle2,
  Coins,
  Copy,
  ExternalLink,
  Loader2,
  ShieldCheck,
  TicketPercent,
  TimerOff,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { IS_MOCK_API, type CreateInvoiceResponse } from '@/api/services'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { POINTS_MIN_REDEEM, POINTS_REDEEM_VALUE } from '@/config'
import { useAuth } from '@/hooks/use-auth'
import { useCategoryLabel } from '@/hooks/use-categories'
import { usePointsSummary, useValidateCoupon } from '@/hooks/use-points'
import {
  useCreateInvoice,
  useInvoiceStatus,
  useRefreshAfterPayment,
} from '@/hooks/use-transactions'
import { amountToPoints, computeMaxRedeemablePoints } from '@/lib/points'
import { getErrorMessage } from '@/api/client'
import { formatCurrency } from '@/lib/utils'
import type { CouponValidation, Product } from '@/types'

type Step = 'confirm' | 'waiting' | 'success' | 'expired'

interface InvoiceModalProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InvoiceModal({
  product,
  open,
  onOpenChange,
}: InvoiceModalProps) {
  const [step, setStep] = useState<Step>('confirm')
  const [invoice, setInvoice] = useState<CreateInvoiceResponse | null>(null)
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState<CouponValidation | null>(null)
  const [redeemOn, setRedeemOn] = useState(false)
  const [pointsInput, setPointsInput] = useState('')

  const { user } = useAuth()
  const navigate = useNavigate()
  const categoryLabel = useCategoryLabel()
  const createInvoice = useCreateInvoice()
  const refreshAfterPayment = useRefreshAfterPayment()
  const pointsQuery = usePointsSummary()
  const validateCoupon = useValidateCoupon()

  const pointsBalance = pointsQuery.data?.balance ?? 0

  const { data: statusData } = useInvoiceStatus(
    step === 'waiting' ? (invoice?.transactionId ?? null) : null,
  )

  useEffect(() => {
    if (!open) {
      const timeout = setTimeout(() => {
        setStep('confirm')
        setInvoice(null)
        setCouponInput('')
        setCoupon(null)
        setRedeemOn(false)
        setPointsInput('')
      }, 250)
      return () => clearTimeout(timeout)
    }
  }, [open])

  useEffect(() => {
    if (step !== 'waiting' || !statusData) return

    if (statusData.status === 'paid') {
      setStep('success')
      refreshAfterPayment()
      toast.success('Pembayaran terkonfirmasi 🎉', {
        description: 'Produk sudah tersedia di halaman Produk Saya.',
      })
    } else if (statusData.status === 'expired' || statusData.status === 'failed') {
      setStep('expired')
    }
  }, [statusData, step, refreshAfterPayment])

  if (!product) return null

  /* ----- Perhitungan harga (mirror logika "server" di services) ----- */

  const subtotal = product.price
  const couponDiscount = coupon?.discount ?? 0
  const afterCoupon = Math.max(0, subtotal - couponDiscount)
  const maxRedeemable = computeMaxRedeemablePoints(subtotal, pointsBalance)
  const canRedeem =
    pointsBalance >= POINTS_MIN_REDEEM && maxRedeemable >= POINTS_MIN_REDEEM
  const requestedPoints = redeemOn
    ? Math.max(0, parseInt(pointsInput, 10) || 0)
    : 0
  const effectivePoints =
    canRedeem && requestedPoints >= POINTS_MIN_REDEEM
      ? Math.min(requestedPoints, maxRedeemable)
      : 0
  const pointsDiscount = effectivePoints * POINTS_REDEEM_VALUE
  const total = Math.max(0, afterCoupon - pointsDiscount)
  const pointsEarned = amountToPoints(total)

  const handleApplyCoupon = async () => {
    const code = couponInput.trim()
    if (!code) return

    try {
      const result = await validateCoupon.mutateAsync({ code, subtotal })
      setCoupon(result)
      toast.success(`Kupon ${result.code} diterapkan`, {
        description: result.description,
      })
    } catch {
      setCoupon(null)
    }
  }

  const handleRemoveCoupon = () => {
    setCoupon(null)
    setCouponInput('')
    validateCoupon.reset()
  }

  const handleCreateInvoice = async () => {
    try {
      const data = await createInvoice.mutateAsync({
        productId: product.id,
        options: {
          couponCode: coupon?.code,
          pointsToRedeem:
            effectivePoints >= POINTS_MIN_REDEEM ? effectivePoints : undefined,
        },
      })
      setInvoice(data)

      // Total Rp 0 (kupon/poin menutup penuh) → backend langsung mengonfirmasi
      // tanpa invoice Mayar — jangan tampilkan step menunggu pembayaran.
      if (!data.invoiceUrl) {
        setStep('success')
        refreshAfterPayment()
        toast.success('Checkout gratis berhasil 🎉', {
          description: 'Produk sudah tersedia di halaman Produk Saya.',
        })
        return
      }

      setStep('waiting')
    } catch {
      /* toast sudah ditangani di hook */
    }
  }

  const copyInvoiceUrl = async () => {
    if (!invoice) return
    await navigator.clipboard.writeText(invoice.invoiceUrl)
    toast.success('Tautan invoice disalin')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <AnimatePresence mode="wait" initial={false}>
          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <DialogHeader>
                <DialogTitle>Konfirmasi Pembelian</DialogTitle>
                <DialogDescription>
                  Periksa detail pesanan sebelum invoice dibuat.
                </DialogDescription>
              </DialogHeader>

              <div className="border-border bg-surface flex gap-3.5 rounded-xl border p-3.5">
                <img
                  src={product.cover}
                  alt=""
                  className="size-16 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 space-y-1">
                  <Badge variant="secondary">
                    {categoryLabel(product.category)}
                  </Badge>
                  <p className="line-clamp-2 text-sm leading-snug font-medium">
                    {product.title}
                  </p>
                </div>
              </div>

              {/* Kupon */}
              <div className="space-y-2">
                <Label>Kode kupon</Label>
                {coupon ? (
                  <div className="border-primary/30 bg-primary/5 flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5">
                    <span className="flex min-w-0 items-center gap-2 text-sm">
                      <TicketPercent className="text-primary size-4 shrink-0" />
                      <span className="truncate font-medium">
                        {coupon.code}
                      </span>
                      <span className="text-muted-foreground shrink-0">
                        −{formatCurrency(coupon.discount)}
                      </span>
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={handleRemoveCoupon}
                      aria-label="Hapus kupon"
                    >
                      <X />
                    </Button>
                  </div>
                ) : (
                  <>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault()
                        void handleApplyCoupon()
                      }}
                      className="flex gap-2"
                    >
                      <div className="relative flex-1">
                        <TicketPercent className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
                        <Input
                          value={couponInput}
                          onChange={(event) => {
                            setCouponInput(event.target.value)
                            if (validateCoupon.isError) validateCoupon.reset()
                          }}
                          placeholder="Masukkan kode kupon"
                          aria-label="Kode kupon"
                          aria-invalid={validateCoupon.isError}
                          className="pl-10"
                        />
                      </div>
                      <Button
                        type="submit"
                        variant="outline"
                        disabled={!couponInput.trim()}
                        loading={validateCoupon.isPending}
                      >
                        Terapkan
                      </Button>
                    </form>
                    {validateCoupon.isError && (
                      <p
                        role="alert"
                        className="text-destructive flex items-center gap-1.5 text-xs"
                      >
                        <AlertCircle className="size-3.5 shrink-0" aria-hidden />
                        {getErrorMessage(validateCoupon.error)}
                      </p>
                    )}
                    {IS_MOCK_API && (
                      <p className="text-muted-foreground/70 text-xs">
                        Kode demo: GRAFIS20, HEMAT50, WELCOME10
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Tukar poin */}
              {canRedeem ? (
                <div className="border-border bg-surface space-y-3 rounded-xl border p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Coins className="text-primary size-4 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Tukar poin</p>
                        <p className="text-muted-foreground truncate text-xs">
                          Saldo {pointsBalance.toLocaleString('id-ID')} poin · 1
                          poin = Rp{POINTS_REDEEM_VALUE}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={redeemOn}
                      onCheckedChange={(checked) => {
                        setRedeemOn(checked)
                        if (checked) setPointsInput(String(maxRedeemable))
                      }}
                      aria-label="Gunakan poin untuk diskon"
                    />
                  </div>

                  {redeemOn && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <Input
                          type="number"
                          value={pointsInput}
                          min={POINTS_MIN_REDEEM}
                          max={maxRedeemable}
                          onChange={(event) =>
                            setPointsInput(event.target.value)
                          }
                          aria-label="Jumlah poin yang ditukar"
                          className="h-10"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 shrink-0"
                          onClick={() => setPointsInput(String(maxRedeemable))}
                        >
                          Maks
                        </Button>
                      </div>
                      <div className="text-muted-foreground flex items-center justify-between text-xs">
                        <span>
                          Maks {maxRedeemable.toLocaleString('id-ID')} poin ·
                          batas 50% harga
                        </span>
                        <span className="text-foreground font-medium">
                          −{formatCurrency(pointsDiscount)}
                        </span>
                      </div>
                      {effectivePoints > 0 && (
                        <p className="text-muted-foreground text-xs">
                          {effectivePoints.toLocaleString('id-ID')} poin ×
                          Rp{POINTS_REDEEM_VALUE.toLocaleString('id-ID')} ={' '}
                          {formatCurrency(pointsDiscount)} potongan
                        </p>
                      )}
                      {requestedPoints < POINTS_MIN_REDEEM && (
                        <p className="text-destructive text-xs">
                          Minimal tukar{' '}
                          {POINTS_MIN_REDEEM.toLocaleString('id-ID')} poin.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : pointsBalance > 0 ? (
                <p className="text-muted-foreground text-xs">
                  Butuh minimal{' '}
                  {POINTS_MIN_REDEEM.toLocaleString('id-ID')} poin untuk menukar
                  (maks 50% harga produk). Saldo kamu:{' '}
                  {pointsBalance.toLocaleString('id-ID')} poin.
                </p>
              ) : null}

              {/* Ringkasan harga */}
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pembeli</span>
                  <span className="font-medium">{user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="max-w-[60%] truncate font-medium">
                    {user?.email}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Harga produk</span>
                  <span className="font-medium">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                {coupon && (
                  <div className="text-success flex justify-between">
                    <span className="flex items-center gap-1.5">
                      <TicketPercent className="size-3.5" aria-hidden />
                      Kupon {coupon.code}
                    </span>
                    <span className="font-medium">
                      −{formatCurrency(couponDiscount)}
                    </span>
                  </div>
                )}
                {effectivePoints > 0 && (
                  <div className="text-success flex justify-between">
                    <span className="flex items-center gap-1.5">
                      <Coins className="size-3.5" aria-hidden />
                      Poin ({effectivePoints.toLocaleString('id-ID')} poin ={' '}
                      {formatCurrency(pointsDiscount)})
                    </span>
                    <span className="font-medium">
                      −{formatCurrency(pointsDiscount)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex items-baseline justify-between">
                  <span className="font-medium">Total pembayaran</span>
                  <span className="text-primary text-lg font-semibold">
                    {formatCurrency(total)}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">
                  Transaksi ini memberimu{' '}
                  {pointsEarned.toLocaleString('id-ID')} poin setelah pembayaran
                  terkonfirmasi.
                </p>
              </div>

              <p className="text-muted-foreground bg-muted/60 flex items-start gap-2 rounded-xl p-3 text-xs leading-relaxed">
                <ShieldCheck className="mt-px size-4 shrink-0" />
                Pembayaran diproses aman melalui Mayar. Akses produk terbuka
                otomatis setelah pembayaran terkonfirmasi.
              </p>

              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Batal
                </Button>
                <Button
                  onClick={handleCreateInvoice}
                  loading={createInvoice.isPending}
                >
                  Buat Invoice
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {step === 'waiting' && invoice && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <DialogHeader>
                <DialogTitle>Menunggu Pembayaran</DialogTitle>
                <DialogDescription>
                  Selesaikan pembayaran di halaman Mayar. Status akan diperbarui
                  otomatis.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col items-center py-4">
                <div className="relative flex size-20 items-center justify-center">
                  <span className="border-primary/20 absolute inset-0 rounded-full border-4" />
                  <motion.span
                    className="border-primary absolute inset-0 rounded-full border-4 border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                  <Loader2 className="text-primary size-7 animate-pulse" />
                </div>
                <p className="mt-4 text-2xl font-semibold tracking-tight">
                  {formatCurrency(invoice.amount)}
                </p>
                <p className="text-muted-foreground mt-1 font-mono text-xs">
                  {invoice.invoiceNumber}
                </p>
              </div>

              <div className="border-border bg-surface flex items-center gap-2 rounded-xl border p-2.5">
                <span className="text-muted-foreground min-w-0 flex-1 truncate px-1.5 font-mono text-xs">
                  {invoice.invoiceUrl}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={copyInvoiceUrl}
                  aria-label="Salin tautan invoice"
                >
                  <Copy />
                </Button>
              </div>

              <DialogFooter className="sm:flex-col">
                <Button asChild className="w-full">
                  <a
                    href={invoice.invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Bayar di Mayar
                    <ExternalLink />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => onOpenChange(false)}
                >
                  Bayar nanti
                </Button>
              </DialogFooter>

              <p className="text-muted-foreground text-center text-xs">
                Memeriksa status setiap 5 detik…
              </p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <DialogHeader className="items-center text-center sm:items-center">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  className="bg-success/12 ring-success/10 mb-2 flex size-16 items-center justify-center rounded-full ring-8"
                >
                  <CheckCircle2 className="text-success size-8" />
                </motion.span>
                <DialogTitle>Pembayaran Berhasil</DialogTitle>
                <DialogDescription>
                  Terima kasih! Akses ke{' '}
                  <span className="text-foreground font-medium">
                    {product.title}
                  </span>{' '}
                  sudah aktif.
                </DialogDescription>
              </DialogHeader>

              {invoice && (
                <div className="border-primary/20 bg-primary/5 divide-primary/10 divide-y rounded-xl border text-sm">
                  {invoice.pointsRedeemed > 0 && (
                    <div className="flex items-center justify-between px-3.5 py-2.5">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Coins className="size-4" aria-hidden />
                        Poin ditukar
                      </span>
                      <span className="font-medium">
                        −{invoice.pointsRedeemed.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-3.5 py-2.5">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Coins className="size-4" aria-hidden />
                      Poin didapat
                    </span>
                    <span className="text-primary font-semibold">
                      +{invoice.pointsEarned.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}

              <DialogFooter className="sm:flex-col">
                <Button
                  className="w-full"
                  onClick={() => {
                    onOpenChange(false)
                    navigate('/dashboard/products')
                  }}
                >
                  Buka Produk Saya
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => onOpenChange(false)}
                >
                  Tutup
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {step === 'expired' && (
            <motion.div
              key="expired"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <DialogHeader className="items-center text-center sm:items-center">
                <span className="bg-destructive/12 ring-destructive/10 mb-2 flex size-16 items-center justify-center rounded-full ring-8">
                  <TimerOff className="text-destructive size-8" />
                </span>
                <DialogTitle>Invoice Kedaluwarsa</DialogTitle>
                <DialogDescription>
                  Waktu pembayaran habis dan poin yang ditukar sudah
                  dikembalikan. Silakan buat invoice baru untuk melanjutkan.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="sm:flex-col">
                <Button className="w-full" onClick={() => setStep('confirm')}>
                  Buat Invoice Baru
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => onOpenChange(false)}
                >
                  Tutup
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
