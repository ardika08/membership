import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getErrorMessage } from '@/api/client'
import {
  adjustUserPoints,
  fetchAdminPoints,
  fetchPoints,
  validateCoupon,
  type AdjustPointsPayload,
} from '@/api/services'
import { useAuth } from '@/hooks/use-auth'

export const pointKeys = {
  summary: ['points'] as const,
  admin: ['admin', 'points'] as const,
}

export function usePointsSummary() {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: pointKeys.summary,
    queryFn: fetchPoints,
    enabled: isAuthenticated,
  })
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: ({ code, subtotal }: { code: string; subtotal: number }) =>
      validateCoupon(code, subtotal),
  })
}

export function useAdminPoints() {
  return useQuery({ queryKey: pointKeys.admin, queryFn: fetchAdminPoints })
}

export function useAdjustUserPoints() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AdjustPointsPayload) => adjustUserPoints(payload),
    onSuccess: () => {
      toast.success('Poin berhasil disesuaikan')
      queryClient.invalidateQueries({ queryKey: pointKeys.admin })
      queryClient.invalidateQueries({ queryKey: pointKeys.summary })
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (error) =>
      toast.error('Gagal menyesuaikan poin', {
        description: getErrorMessage(error),
      }),
  })
}
