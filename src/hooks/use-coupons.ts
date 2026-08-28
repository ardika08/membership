import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getErrorMessage } from '@/api/client'
import {
  createCoupon,
  deleteCoupon,
  fetchCoupons,
  updateCoupon,
} from '@/api/services'
import type { Coupon, CouponInput } from '@/types'

export const couponKeys = {
  all: ['coupons'] as const,
}

export function useCoupons() {
  return useQuery({ queryKey: couponKeys.all, queryFn: fetchCoupons })
}

export function useCreateCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CouponInput) => createCoupon(payload),
    onSuccess: () => {
      toast.success('Kupon berhasil dibuat')
      queryClient.invalidateQueries({ queryKey: couponKeys.all })
    },
    onError: (error) =>
      toast.error('Gagal membuat kupon', {
        description: getErrorMessage(error),
      }),
  })
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: Partial<CouponInput> & { isActive?: boolean }
    }) => updateCoupon(id, payload),
    onSuccess: (_, variables) => {
      toast.success(
        variables.payload.isActive === undefined
          ? 'Kupon berhasil diperbarui'
          : variables.payload.isActive
            ? 'Kupon diaktifkan'
            : 'Kupon dinonaktifkan',
      )
      queryClient.invalidateQueries({ queryKey: couponKeys.all })
    },
    onError: (error) =>
      toast.error('Gagal menyimpan kupon', {
        description: getErrorMessage(error),
      }),
  })
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: () => {
      toast.success('Kupon dihapus')
      queryClient.invalidateQueries({ queryKey: couponKeys.all })
    },
    onError: (error) =>
      toast.error('Gagal menghapus kupon', {
        description: getErrorMessage(error),
      }),
  })
}

export type { Coupon }
