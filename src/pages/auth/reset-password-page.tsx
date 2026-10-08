import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'

import { AuthShell } from '@/components/features/auth-shell'
import { Button } from '@/components/ui/button'
import { TextInput } from '@/components/ui/form-field'
import { useResetPassword } from '@/hooks/use-auth'
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from '@/lib/validations'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''

  const [showPassword, setShowPassword] = useState(false)
  const resetPassword = useResetPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', passwordConfirmation: '' },
  })

  if (!token || !email) {
    return (
      <AuthShell
        title="Tautan tidak valid"
        description="Tautan reset ini tidak lengkap atau sudah rusak."
        footer={
          <Link
            to="/forgot-password"
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            Minta tautan baru
          </Link>
        }
      >
        <div className="border-border bg-surface flex flex-col items-center gap-3 rounded-2xl border p-6 text-center">
          <span className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-full">
            <ShieldAlert className="size-6" />
          </span>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Silakan buka tautan langsung dari email yang kami kirim, atau minta
            tautan reset yang baru.
          </p>
        </div>
      </AuthShell>
    )
  }

  const onSubmit = (values: ResetPasswordValues) => {
    resetPassword.mutate({
      email,
      token,
      password: values.password,
      passwordConfirmation: values.passwordConfirmation,
    })
  }

  return (
    <AuthShell
      title="Atur kata sandi baru"
      description={`Buat kata sandi baru untuk ${email}.`}
      footer={
        <Link
          to="/login"
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          Kembali ke halaman masuk
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <TextInput
          label="Kata sandi baru"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
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

        <TextInput
          label="Konfirmasi kata sandi"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="••••••••"
          icon={<Lock />}
          error={errors.passwordConfirmation?.message}
          {...register('passwordConfirmation')}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={resetPassword.isPending}
        >
          Simpan kata sandi baru
        </Button>
      </form>
    </AuthShell>
  )
}
