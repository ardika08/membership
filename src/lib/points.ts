import { POINTS_MAX_REDEEM_PERCENT, POINTS_REDEEM_VALUE } from '@/config'

/** Batas poin yang boleh ditukar untuk suatu harga produk. */
export function computeMaxRedeemablePoints(subtotal: number, balance: number) {
  const capDiscount = Math.floor((subtotal * POINTS_MAX_REDEEM_PERCENT) / 100)
  const maxPointsByCap = Math.floor(capDiscount / POINTS_REDEEM_VALUE)
  return Math.max(0, Math.min(balance, maxPointsByCap))
}

/** Konversi poin ke nominal diskon (Rp). */
export function pointsToDiscount(points: number) {
  return points * POINTS_REDEEM_VALUE
}

/** Poin yang didapat dari nominal belanja (Rp). */
export function amountToPoints(amount: number) {
  return Math.floor(amount / 1000)
}
