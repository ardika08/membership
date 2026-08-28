import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { AuthShell } from '@/components/features/auth-shell'
import { Button } from '@/components/ui/button'
import { TextInput } from '@/components/ui/form-field'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useRegister } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { registerSchema, type RegisterValues } from '@/lib/validations'

function strengthOf(password: string) {
  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  return Math.min(score, 4)
}

const STRENGTH_LABEL = ['Sangat lemah', 'Lemah', 'Cukup', 'Kuat', 'Sangat kuat']
const STRENGTH_COLOR = [
  'bg-destructive',
  'bg-destructive',
  'bg-warning',
  'bg-success',
  'bg-success',
]

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const registerMutation = useRegister()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      whatsapp: '',
      email: '',
      password: '',
      passwordConfirmation: '',
      agree: false as unknown as true,
    },
  })

  const password = useWatch({ control, name: 'password' }) ?? ''
  const score = strengthOf(password)

  const onSubmit = (values: RegisterValues) => {
    registerMutation.mutate({
      name: values.name,
      whatsapp: values.whatsapp,
      email: values.email,
      password: values.password,
      passwordConfirmation: values.passwordConfirmation,
    })
  }

  return (
    <AuthShell
      title="Buat akun baru"
      description="Akun langsung aktif tanpa verifikasi email. Mulai belanja dalam hitungan detik."
      footer={
        <>
          Sudah punya akun?{' '}
          <Link
            to="/login"
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            Masuk di sini
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <TextInput
          label="Nama lengkap"
          autoComplete="name"
          placeholder="Rizky Pratama"
          icon={<User />}
          error={errors.name?.message}
          {...register('name')}
        />

        <TextInput
          label="Nomor WhatsApp"
          type="tel"
          autoComplete="tel"
          placeholder="08123456789"
          icon={<Phone />}
          hint="Digunakan untuk notifikasi transaksi"
          error={errors.whatsapp?.message}
          {...register('whatsapp')}
        />

        <TextInput
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          icon={<Mail />}
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="space-y-2">
          <TextInput
            label="Kata sandi"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
            icon={<Lock />}
            error={errors.password?.message}
            trailing={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={
                  showPassword
                    ? 'Sembunyikan kata sandi'
                    : 'Tampilkan kata sandi'
                }
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </Button>
            }
            {...register('password')}
          />

          {password.length > 0 && (
            <div className="flex items-center gap-2.5">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2, 3].map((index) => (
                  <span
                    key={index}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors duration-300',
                      index < score ? STRENGTH_COLOR[score] : 'bg-muted',
                    )}
                  />
                ))}
              </div>
              <span className="text-muted-foreground w-20 text-right text-xs">
                {STRENGTH_LABEL[score]}
              </span>
            </div>
          )}
        </div>

        <TextInput
          label="Konfirmasi kata sandi"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Ulangi kata sandi"
          icon={<Lock />}
          error={errors.passwordConfirmation?.message}
          {...register('passwordConfirmation')}
        />

        <div className="space-y-2 pt-1">
          <div className="flex items-start gap-3">
            <Controller
              control={control}
              name="agree"
              render={({ field }) => (
                <Switch
                  id="agree"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-invalid={!!errors.agree}
                  className="mt-0.5"
                />
              )}
            />
            <Label
              htmlFor="agree"
              className="text-muted-foreground text-[13px] leading-relaxed font-normal"
            >
              Saya menyetujui syarat & ketentuan serta kebijakan privasi{' '}
              layanan ini.
            </Label>
          </div>
          {errors.agree && (
            <p role="alert" className="text-destructive text-xs">
              {errors.agree.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={registerMutation.isPending}
        >
          Daftar & Mulai
        </Button>
      </form>
    </AuthShell>
  )
}
