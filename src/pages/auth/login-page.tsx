import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { AuthShell } from '@/components/features/auth-shell'
import { Button } from '@/components/ui/button'
import { TextInput } from '@/components/ui/form-field'
import { useLogin } from '@/hooks/use-auth'
import { IS_MOCK_API } from '@/api/services'
import { loginSchema, type LoginValues } from '@/lib/validations'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const login = useLogin()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = (values: LoginValues) => {
    login.mutate({ email: values.email, password: values.password })
  }

  const fillDemo = (role: 'member' | 'admin') => {
    setValue('email', role === 'admin' ? 'admin@example.com' : 'rizky@example.com')
    setValue('password', 'password123')
  }

  return (
    <AuthShell
      title="Selamat datang kembali"
      description="Masuk untuk mengakses produk digital dan riwayat transaksi kamu."
      footer={
        <>
          Belum punya akun?{' '}
          <Link
            to="/register"
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            Daftar sekarang
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <TextInput
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          icon={<Mail />}
          error={errors.email?.message}
          {...register('email')}
        />

        <TextInput
          label="Kata sandi"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••"
          icon={<Lock />}
          error={errors.password?.message}
          trailing={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={
                showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'
              }
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </Button>
          }
          {...register('password')}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={login.isPending}
        >
          Masuk
        </Button>
      </form>

      {IS_MOCK_API && (
        <div className="border-border mt-6 rounded-xl border border-dashed p-3.5">
          <p className="text-muted-foreground mb-2.5 text-xs">
            Mode demo — isi kredensial contoh:
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => fillDemo('member')}
            >
              Sebagai Member
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => fillDemo('admin')}
            >
              Sebagai Admin
            </Button>
          </div>
        </div>
      )}
    </AuthShell>
  )
}
