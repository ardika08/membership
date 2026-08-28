import { CheckCircle2, Clock, TimerOff, XCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { OwnedStatus, TransactionStatus } from '@/types'

const TRANSACTION_MAP: Record<
  TransactionStatus,
  { label: string; variant: 'success' | 'warning' | 'destructive' | 'outline'; icon: typeof Clock }
> = {
  paid: { label: 'Lunas', variant: 'success', icon: CheckCircle2 },
  pending: { label: 'Menunggu', variant: 'warning', icon: Clock },
  expired: { label: 'Kedaluwarsa', variant: 'outline', icon: TimerOff },
  failed: { label: 'Gagal', variant: 'destructive', icon: XCircle },
}

export function TransactionStatusBadge({
  status,
}: {
  status: TransactionStatus
}) {
  const { label, variant, icon: Icon } = TRANSACTION_MAP[status]

  return (
    <Badge variant={variant}>
      <Icon aria-hidden />
      {label}
    </Badge>
  )
}

export function OwnedStatusBadge({ status }: { status: OwnedStatus }) {
  return status === 'active' ? (
    <Badge variant="success">
      <CheckCircle2 aria-hidden />
      Aktif
    </Badge>
  ) : (
    <Badge variant="warning">
      <Clock aria-hidden />
      Menunggu pembayaran
    </Badge>
  )
}
