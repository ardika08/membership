import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getErrorMessage } from '@/api/client'
import {
  checkInvoiceStatus,
  createInvoice,
  fetchAdminTransactions,
  fetchTransactions,
  type InvoiceOptions,
} from '@/api/services'
import { INVOICE_POLL_INTERVAL } from '@/config'
import { useAuth } from '@/hooks/use-auth'
import { pointKeys } from '@/hooks/use-points'
import { productKeys } from '@/hooks/use-products'

export const transactionKeys = {
  all: ['transactions'] as const,
  admin: ['admin', 'transactions'] as const,
  status: (id: string) => ['transactions', id, 'status'] as const,
}

export function useTransactions() {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: transactionKeys.all,
    queryFn: fetchTransactions,
    enabled: isAuthenticated,
    // Selama masih ada transaksi pending (mis. member baru balik dari
    // halaman pembayaran Mayar), refresh berkala sampai status berubah.
    refetchInterval: (query) =>
      query.state.data?.some((t) => t.status === 'pending') ? 8000 : false,
  })
}

export function useAdminTransactions() {
  return useQuery({
    queryKey: transactionKeys.admin,
    queryFn: fetchAdminTransactions,
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { productId: string; options?: InvoiceOptions }) =>
      createInvoice(input.productId, input.options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      queryClient.invalidateQueries({ queryKey: pointKeys.summary })
    },
    onError: (error) =>
      toast.error('Gagal membuat invoice', {
        description: getErrorMessage(error),
      }),
  })
}

/** Polling status pembayaran setiap 5 detik sampai tidak lagi `pending`. */
export function useInvoiceStatus(transactionId: string | null) {
  return useQuery({
    queryKey: transactionKeys.status(transactionId ?? ''),
    queryFn: () => checkInvoiceStatus(transactionId as string),
    enabled: Boolean(transactionId),
    refetchInterval: (query) =>
      query.state.data?.status === 'pending' || !query.state.data
        ? INVOICE_POLL_INTERVAL
        : false,
    refetchIntervalInBackground: true,
  })
}

export function useRefreshAfterPayment() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: productKeys.mine })
    queryClient.invalidateQueries({ queryKey: transactionKeys.all })
    queryClient.invalidateQueries({ queryKey: pointKeys.summary })
  }
}
