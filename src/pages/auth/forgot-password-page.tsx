import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Mail, MailCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { AuthShell } from '@/components/features/auth-shell'
import { Button } from '@/components/ui/button'
import { TextInput } from '@/components/ui/form-field'
import { useForgotPassword } from '@/hooks/use-auth'
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from '@/lib/validations'

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const forgotPassword = useForgotPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = (values: ForgotPasswordValues) => {
    forgotPassword.mutate(values.email, {
      onSuccess: () => setSentTo(values.email),
    })
  }

  if (sentTo) {
    return (
      <AuthShell
        title="Periksa email kamu"
        description="Kami telah mengirim tautan untuk mengatur ulang kata sandi."
        footer={
          <Link
            to="/login"
            className="text-primary inline-flex items-center gap-1.5 font-medium underline-offset-4 hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            Kembali ke halaman masuk
          </Link>
        }
      >
        <div className="border-border bg-surface flex flex-col items-center gap-3 rounded-2xl border p-6 text-center">
          <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
            <MailCheck className="size-6" />
          </span>
          <p className="text-sm leading-relaxed">
            Tautan reset dikirim ke{' '}
            <span className="font-medium">{sentTo}</span>. Cek juga folder
            spam/promosi. Tautan berlaku 60 menit.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-1"
            onClick={() => setSentTo(null)}
          >
            Kirim ke email lain
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Lupa kata sandi?"
      description="Masukkan email akun kamu. Kami akan mengirim tautan untuk mengatur ulang kata sandi."
      footer={
        <Link
          to="/login"
          className="text-primary inline-flex items-center gap-1.5 font-medium underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          Kembali ke halaman masuk
        </Link>
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

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={forgotPassword.isPending}
        >
          Kirim tautan reset
        </Button>
      </form>
    </AuthShell>
  )
}
