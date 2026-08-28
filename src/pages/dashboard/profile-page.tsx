import { zodResolver } from '@hookform/resolvers/zod'
import {
  Calendar,
  Lock,
  LogOut,
  Mail,
  Monitor,
  Moon,
  Phone,
  Sun,
  User as UserIcon,
} from 'lucide-react'
import { useForm } from 'react-hook-form'

import { PageHeader } from '@/components/layout/page-header'
import { PageTransition } from '@/components/layout/page-transition'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { TextInput } from '@/components/ui/form-field'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth, useLogout } from '@/hooks/use-auth'
import { useChangePassword, useUpdateProfile } from '@/hooks/use-profile'
import { cn, formatDate, getInitials } from '@/lib/utils'
import {
  changePasswordSchema,
  profileSchema,
  type ChangePasswordValues,
  type ProfileValues,
} from '@/lib/validations'
import { useThemeStore, type Theme } from '@/store/themeStore'

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Terang', icon: Sun },
  { value: 'dark', label: 'Gelap', icon: Moon },
  { value: 'system', label: 'Sistem', icon: Monitor },
]

function ProfileForm() {
  const { user } = useAuth()
  const updateProfile = useUpdateProfile()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      whatsapp: user?.whatsapp ?? '',
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informasi Pribadi</CardTitle>
        <CardDescription>
          Perbarui data akun kamu. Nomor WhatsApp digunakan untuk notifikasi
          transaksi.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((values) => updateProfile.mutate(values))}
          className="space-y-4"
          noValidate
        >
          <TextInput
            label="Nama lengkap"
            autoComplete="name"
            icon={<UserIcon />}
            error={errors.name?.message}
            {...register('name')}
          />
          <TextInput
            label="Email"
            type="email"
            autoComplete="email"
            icon={<Mail />}
            error={errors.email?.message}
            {...register('email')}
          />
          <TextInput
            label="Nomor WhatsApp"
            type="tel"
            autoComplete="tel"
            icon={<Phone />}
            error={errors.whatsapp?.message}
            {...register('whatsapp')}
          />

          <div className="flex gap-2.5 pt-1">
            <Button
              type="submit"
              loading={updateProfile.isPending}
              disabled={!isDirty}
            >
              Simpan Perubahan
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => reset()}
              disabled={!isDirty}
            >
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function PasswordForm() {
  const changePassword = useChangePassword()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      password: '',
      passwordConfirmation: '',
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ubah Kata Sandi</CardTitle>
        <CardDescription>
          Gunakan kombinasi huruf dan angka minimal 8 karakter.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(async (values) => {
            await changePassword.mutateAsync(values)
            reset()
          })}
          className="space-y-4"
          noValidate
        >
          <TextInput
            label="Kata sandi saat ini"
            type="password"
            autoComplete="current-password"
            icon={<Lock />}
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
          />
          <TextInput
            label="Kata sandi baru"
            type="password"
            autoComplete="new-password"
            icon={<Lock />}
            error={errors.password?.message}
            {...register('password')}
          />
          <TextInput
            label="Konfirmasi kata sandi baru"
            type="password"
            autoComplete="new-password"
            icon={<Lock />}
            error={errors.passwordConfirmation?.message}
            {...register('passwordConfirmation')}
          />

          <Button type="submit" loading={changePassword.isPending}>
            Perbarui Kata Sandi
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function AppearanceCard() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tampilan</CardTitle>
        <CardDescription>
          Pilih tema tampilan. Mode sistem mengikuti preferensi perangkat kamu.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="grid gap-3 sm:grid-cols-3"
          role="radiogroup"
          aria-label="Tema tampilan"
        >
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={theme === option.value}
              onClick={() => setTheme(option.value)}
              className={cn(
                'flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200',
                theme === option.value
                  ? 'border-primary bg-primary/5 shadow-soft'
                  : 'border-border hover:border-primary/40 hover:bg-accent/50',
              )}
            >
              <span
                className={cn(
                  'flex size-9 items-center justify-center rounded-lg transition-colors',
                  theme === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                <option.icon className="size-4" />
              </span>
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function ProfilePage() {
  const { user, isAdmin } = useAuth()
  const logout = useLogout()

  if (!user) return null

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Pengaturan"
          description="Kelola informasi akun, keamanan, dan preferensi tampilan."
        />

        {/* Kartu identitas */}
        <Card>
          <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
            <Avatar className="size-16">
              {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
              <AvatarFallback className="text-lg">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-lg font-semibold tracking-tight">
                  {user.name}
                </h2>
                <Badge variant={isAdmin ? 'default' : 'secondary'}>
                  {isAdmin ? 'Administrator' : 'Member'}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">{user.email}</p>
              <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Calendar className="size-3.5" />
                Bergabung {formatDate(user.createdAt)}
              </p>
            </div>

            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive sm:self-start"
              onClick={() => logout.mutate()}
              loading={logout.isPending}
            >
              <LogOut />
              Keluar
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="security">Keamanan</TabsTrigger>
            <TabsTrigger value="appearance">Tampilan</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileForm />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <PasswordForm />
            <Card>
              <CardHeader>
                <CardTitle>Sesi Aktif</CardTitle>
                <CardDescription>
                  Keluar dari perangkat ini akan menghapus token akses lokal.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Separator className="mb-4" />
                <Button
                  variant="destructive"
                  onClick={() => logout.mutate()}
                  loading={logout.isPending}
                >
                  <LogOut />
                  Keluar dari perangkat ini
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <AppearanceCard />
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  )
}
