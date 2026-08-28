import axios, { AxiosError } from 'axios'
import { toast } from 'sonner'

import { API_BASE_URL } from '@/config'
import { useAuthStore } from '@/store/authStore'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { Accept: 'application/json' },
  withCredentials: false,
  timeout: 20_000,
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
    const status = error.response?.status
    const message = error.response?.data?.message

    if (status === 401) {
      useAuthStore.getState().logout()
      if (!window.location.pathname.startsWith('/login')) {
        toast.error('Sesi berakhir', {
          description: 'Silakan masuk kembali untuk melanjutkan.',
        })
        window.location.assign('/login')
      }
    } else if (status === 403) {
      toast.error('Akses ditolak', {
        description: message ?? 'Kamu tidak memiliki izin untuk aksi ini.',
      })
    } else if (status && status >= 500) {
      toast.error('Server bermasalah', {
        description: 'Coba lagi beberapa saat lagi.',
      })
    }

    return Promise.reject(error)
  },
)

export function getErrorMessage(error: unknown, fallback = 'Terjadi kesalahan') {
  if (error instanceof AxiosError) {
    return error.response?.data?.message ?? error.message ?? fallback
  }
  if (error instanceof Error) return error.message
  return fallback
}
