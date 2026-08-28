import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus, Search, Tags, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { PageHeader } from '@/components/layout/page-header'
import { PageTransition } from '@/components/layout/page-transition'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { TextInput } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useAdminProducts } from '@/hooks/use-products'
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/use-categories'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

const COLOR_PRESETS = [
  '#8b5cf6',
  '#3b82f6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#6366f1',
]

const categorySchema = z.object({
  name: z
    .string()
    .min(3, 'Nama kategori minimal 3 karakter')
    .max(40, 'Nama kategori maksimal 40 karakter'),
  description: z.string().max(120, 'Deskripsi maksimal 120 karakter'),
  color: z.string(),
})

type CategoryValues = z.infer<typeof categorySchema>

const EMPTY_FORM: CategoryValues = {
  name: '',
  description: '',
  color: COLOR_PRESETS[0],
}

function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
}) {
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const isEdit = Boolean(category)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: EMPTY_FORM,
  })

  useEffect(() => {
    if (!open) return
    reset(
      category
        ? {
            name: category.name,
            description: category.description,
            color: category.color ?? COLOR_PRESETS[0],
          }
        : EMPTY_FORM,
    )
  }, [open, category, reset])

  const color = watch('color')

  const onSubmit = async (values: CategoryValues) => {
    if (category) {
      await updateCategory.mutateAsync({ id: category.id, payload: values })
    } else {
      await createCategory.mutateAsync(values)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Ubah Kategori' : 'Tambah Kategori Baru'}
          </DialogTitle>
          <DialogDescription>
            Kategori baru otomatis muncul di pilihan kategori saat menambah
            produk dan di filter katalog.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <TextInput
            label="Nama kategori"
            placeholder="Contoh: UI/UX Design Kit"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi (opsional)</Label>
            <Textarea
              id="description"
              rows={2}
              placeholder="Penjelasan singkat isi kategori ini"
              aria-invalid={!!errors.description}
              {...register('description')}
            />
            {errors.description && (
              <p role="alert" className="text-destructive text-xs">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Warna aksen</Label>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Warna kategori">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  role="radio"
                  aria-checked={color === preset}
                  aria-label={`Warna ${preset}`}
                  onClick={() =>
                    setValue('color', preset, { shouldValidate: true })
                  }
                  className={cn(
                    'size-8 rounded-full transition-all duration-200',
                    color === preset
                      ? 'ring-ring ring-2 ring-offset-2 ring-offset-background'
                      : 'hover:scale-110',
                  )}
                  style={{ backgroundColor: preset }}
                />
              ))}
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
            <Button
              type="submit"
              loading={createCategory.isPending || updateCategory.isPending}
            >
              {isEdit ? 'Simpan Perubahan' : 'Tambah Kategori'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminCategoriesPage() {
  const { data: categories, isLoading } = useCategories()
  const { data: products } = useAdminProducts()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)

  const filtered = (categories ?? []).filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()),
  )

  const countProducts = (slug: string) =>
    (products ?? []).filter((p) => p.category === slug).length

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditing(category)
    setFormOpen(true)
  }

  const toggleActive = (category: Category) => {
    updateCategory.mutate({
      id: category.id,
      payload: { isActive: !(category.isActive ?? true) },
    })
  }

  const confirmDelete = async () => {
    if (!deleting) return
    await deleteCategory.mutateAsync(deleting.id)
    setDeleting(null)
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Kelola Kategori"
          description="Tambah kategori baru, ubah, sembunyikan, atau hapus kategori produk."
          actions={
            <Button onClick={openCreate}>
              <Plus />
              Tambah Kategori
            </Button>
          }
        />

        <div className="relative max-w-sm">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kategori…"
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Tags}
            title={
              (categories ?? []).length > 0
                ? 'Kategori tidak ditemukan'
                : 'Belum ada kategori'
            }
            description={
              (categories ?? []).length > 0
                ? 'Coba kata kunci pencarian lain.'
                : 'Tambahkan kategori pertama untuk mengelompokkan produk di katalog.'
            }
            action={
              <Button onClick={openCreate}>
                <Plus />
                Tambah Kategori
              </Button>
            }
          />
        ) : (
          <Card className="p-0">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Deskripsi
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Produk
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((category) => {
                    const used = countProducts(category.slug)
                    return (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span
                              className="size-8 shrink-0 rounded-lg"
                              style={{
                                backgroundColor: `${category.color ?? '#6366f1'}26`,
                              }}
                            >
                              <span
                                className="m-auto mt-2 block size-4 rounded-md"
                                style={{
                                  backgroundColor: category.color ?? '#6366f1',
                                }}
                              />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium">
                                {category.name}
                              </p>
                              <p className="text-muted-foreground font-mono text-xs">
                                {category.slug}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden max-w-[220px] md:table-cell">
                          <p className="text-muted-foreground line-clamp-2 text-sm">
                            {category.description || '—'}
                          </p>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant={used > 0 ? 'secondary' : 'outline'}>
                            {used} produk
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={category.isActive ?? true}
                            onCheckedChange={() => toggleActive(category)}
                            aria-label={`Tampilkan kategori ${category.name}`}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEdit(category)}
                              aria-label={`Ubah kategori ${category.name}`}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setDeleting(category)}
                              aria-label={`Hapus kategori ${category.name}`}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing}
      />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kategori "{deleting?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && countProducts(deleting.slug) > 0
                ? `Kategori ini masih dipakai ${countProducts(deleting.slug)} produk. Produk tidak ikut terhapus, tapi kategorinya tidak akan tersedia lagi di pilihan produk baru.`
                : 'Tindakan ini tidak dapat dibatalkan.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  )
}
