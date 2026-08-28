import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'

import { getErrorMessage } from '@/api/client'
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from '@/api/services'
import { CATEGORIES, CATEGORY_LABEL } from '@/config'
import type { Category, CategoryInput } from '@/types'

export const categoryKeys = {
  all: ['categories'] as const,
}

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: fetchCategories,
  })
}

/** Opsi kategori untuk dropdown/filter: default config + kategori custom aktif. */
export function useCategoryOptions() {
  const { data } = useCategories()

  return useMemo(() => {
    const defaultValues = CATEGORIES.map((c) => c.value)
    const custom = (data ?? [])
      .filter((c) => c.isActive)
      .filter((c) => !defaultValues.includes(c.slug))
      .map((c) => ({ value: c.slug, label: c.name }))
    return [...CATEGORIES, ...custom]
  }, [data])
}

/** Label kategori dengan fallback: config default → kategori custom → slug. */
export function useCategoryLabel() {
  const { data } = useCategories()

  return useCallback(
    (slug: string) =>
      CATEGORY_LABEL[slug] ??
      data?.find((c) => c.slug === slug)?.name ??
      slug,
    [data],
  )
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CategoryInput) => createCategory(payload),
    onSuccess: () => {
      toast.success('Kategori berhasil ditambahkan')
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
    onError: (error) =>
      toast.error('Gagal menambahkan kategori', {
        description: getErrorMessage(error),
      }),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: Partial<CategoryInput> & { isActive?: boolean }
    }) => updateCategory(id, payload),
    onSuccess: (_, variables) => {
      toast.success(
        variables.payload.isActive === undefined
          ? 'Kategori berhasil diperbarui'
          : variables.payload.isActive
            ? 'Kategori ditayangkan kembali'
            : 'Kategori disembunyikan',
      )
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
    onError: (error) =>
      toast.error('Gagal menyimpan kategori', {
        description: getErrorMessage(error),
      }),
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      toast.success('Kategori dihapus')
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
    onError: (error) =>
      toast.error('Gagal menghapus kategori', {
        description: getErrorMessage(error),
      }),
  })
}

export type { Category }
