import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { getErrorMessage } from '@/api/client'
import {
  login as loginRequest,
  logoutRequest,
  register as registerRequest,
  type LoginPayload,
  type RegisterPayload,
} from '@/api/services'
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)

  return {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.role === 'admin',
  }
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession)
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginRequest(payload),
    onSuccess: (data) => {
      setSession(data)
      queryClient.clear()
      toast.success(`Selamat datang kembali, ${data.user.name.split(' ')[0]}!`)
      // Kembali ke halaman asal (mis. halaman produk) jika ada,
      // selain itu ke dashboard sesuai role.
      const from = (location.state as { from?: { pathname?: string } } | null)
        ?.from?.pathname
      navigate(
        from ?? (data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard'),
        { replace: true },
      )
    },
    onError: (error) => {
      toast.error('Gagal masuk', { description: getErrorMessage(error) })
    },
  })
}

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerRequest(payload),
    onSuccess: (data) => {
      setSession(data)
      queryClient.clear()
      toast.success('Akun berhasil dibuat 🎉', {
        description: 'Akun kamu langsung aktif. Selamat menjelajah!',
      })
      navigate('/dashboard', { replace: true })
    },
    onError: (error) => {
      toast.error('Registrasi gagal', { description: getErrorMessage(error) })
    },
  })
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      logout()
      queryClient.clear()
      toast.success('Kamu telah keluar')
      navigate('/login', { replace: true })
    },
  })
}
