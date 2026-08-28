import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import type { AdminUserInput } from '@/api/services'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TextInput } from '@/components/ui/form-field'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDeleteAdminUser, useUpdateAdminUser } from '@/hooks/use-admin'
import { adminUserSchema, type AdminUserValues } from '@/lib/validations'
import type { AdminUser, Role } from '@/types'

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'member', label: 'Member' },
  { value: 'admin', label: 'Administrator' },
]

const STATUS_OPTIONS: { value: 'active' | 'suspended'; label: string }[] = [
  { value: 'active', label: 'Aktif' },
  { value: 'suspended', label: 'Ditangguhkan' },
]

const EMPTY_FORM: AdminUserValues = {
  name: '',
  email: '',
  whatsapp: '',
  role: 'member',
  status: 'active',
}

interface EditUserDialogProps {
  user: AdminUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
  const updateUser = useUpdateAdminUser()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AdminUserValues>({
    resolver: zodResolver(adminUserSchema),
    defaultValues: EMPTY_FORM,
  })

  useEffect(() => {
    if (!open) return
    reset(
      user
        ? {
            name: user.name,
            email: user.email,
            whatsapp: user.whatsapp,
            role: user.role,
            status: user.status,
          }
        : EMPTY_FORM,
    )
  }, [open, user, reset])

  const role = watch('role')
  const status = watch('status')

  const onSubmit = async (values: AdminUserValues) => {
    if (!user) return
    const payload = values as AdminUserInput
    await updateUser.mutateAsync({ id: user.id, payload })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ubah Pengguna</DialogTitle>
          <DialogDescription>
            Perbarui data akun, role, dan status pengguna.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <TextInput
            label="Nama lengkap"
            placeholder="Nama pengguna"
            error={errors.name?.message}
            {...register('name')}
          />

          <TextInput
            label="Email"
            type="email"
            placeholder="nama@contoh.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <TextInput
            label="Nomor WhatsApp"
            placeholder="08xxxxxxxxxx"
            hint="Gunakan format 08xxx atau +628xxx"
            error={errors.whatsapp?.message}
            {...register('whatsapp')}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-role">Role</Label>
              <Select
                value={role}
                onValueChange={(value) =>
                  setValue('role', value as Role, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="user-role">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setValue('status', value as 'active' | 'suspended', {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="user-status">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" loading={updateUser.isPending}>
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteUserDialogProps {
  user: AdminUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteUserDialog({ user, open, onOpenChange }: DeleteUserDialogProps) {
  const deleteUser = useDeleteAdminUser()

  const confirmDelete = async () => {
    if (!user) return
    await deleteUser.mutateAsync(user.id)
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus pengguna ini?</AlertDialogTitle>
          <AlertDialogDescription>
            Pengguna{' '}
            <span className="text-foreground font-medium">{user?.name}</span>{' '}
            ({user?.email}) akan dihapus permanen. Tindakan ini tidak dapat
            dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault()
              void confirmDelete()
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Ya, hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
