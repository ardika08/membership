import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getErrorMessage } from '@/api/client'
import {
  deleteAdminUser,
  fetchAdminStats,
  fetchAdminUsers,
  updateAdminUser,
  type AdminUserInput,
} from '@/api/services'

export function useAdminStats() {
  return useQuery({ queryKey: ['admin', 'stats'], queryFn: fetchAdminStats })
}

export function useAdminUsers() {
  return useQuery({ queryKey: ['admin', 'users'], queryFn: fetchAdminUsers })
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminUserInput }) =>
      updateAdminUser(id, payload),
    onSuccess: () => {
      toast.success('Data pengguna tersimpan')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (error) =>
      toast.error('Gagal menyimpan pengguna', {
        description: getErrorMessage(error),
      }),
  })
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteAdminUser(id),
    onSuccess: () => {
      toast.success('Pengguna dihapus')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (error) =>
      toast.error('Gagal menghapus pengguna', {
        description: getErrorMessage(error),
      }),
  })
}
