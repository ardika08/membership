import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getErrorMessage } from '@/api/client'
import {
  changePassword,
  updateProfile,
  type ChangePasswordPayload,
  type UpdateProfilePayload,
} from '@/api/services'
import { useAuthStore } from '@/store/authStore'

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: (user) => {
      setUser(user)
      toast.success('Profil berhasil diperbarui')
    },
    onError: (error) =>
      toast.error('Gagal memperbarui profil', {
        description: getErrorMessage(error),
      }),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changePassword(payload),
    onSuccess: () => toast.success('Kata sandi berhasil diubah'),
    onError: (error) =>
      toast.error('Gagal mengubah kata sandi', {
        description: getErrorMessage(error),
      }),
  })
}
