import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'
import { toast } from 'sonner'

import { getErrorMessage } from '@/api/client'
import {
  createProduct,
  deleteProduct,
  fetchAdminProducts,
  fetchDownloads,
  fetchMyProducts,
  fetchProduct,
  fetchProducts,
  requestDownload,
  setProductActive,
  updateProduct,
  uploadProductFile,
  type ProductInput,
} from '@/api/services'

export const productKeys = {
  all: ['products'] as const,
  detail: (id: string) => ['products', id] as const,
  mine: ['my-products'] as const,
  downloads: ['downloads'] as const,
  admin: ['admin', 'products'] as const,
}

export function useProducts() {
  return useQuery({
    queryKey: productKeys.all,
    queryFn: fetchProducts,
    placeholderData: keepPreviousData,
  })
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id ?? ''),
    queryFn: () => fetchProduct(id as string),
    enabled: Boolean(id),
  })
}

export function useMyProducts() {
  return useQuery({ queryKey: productKeys.mine, queryFn: fetchMyProducts })
}

export function useDownloads() {
  return useQuery({ queryKey: productKeys.downloads, queryFn: fetchDownloads })
}

export function useDownloadProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ownedId: string) => requestDownload(ownedId),
    onSuccess: (data) => {
      if (data.downloadType === 'external') {
        window.open(data.url, '_blank', 'noopener,noreferrer')
      } else {
        const anchor = document.createElement('a')
        anchor.href = data.url
        anchor.download = data.fileName
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
      }
      toast.success('Unduhan dimulai', { description: data.fileName })
      queryClient.invalidateQueries({ queryKey: productKeys.mine })
      queryClient.invalidateQueries({ queryKey: productKeys.downloads })
    },
    onError: (error) => {
      toast.error('Gagal mengunduh', { description: getErrorMessage(error) })
    },
  })
}

export function useUploadProductFile() {
  return useMutation({
    mutationFn: (file: File) => uploadProductFile(file),
    onError: (error) => {
      toast.error('Upload gagal', { description: getErrorMessage(error) })
    },
  })
}

export function useAdminProducts() {
  return useQuery({ queryKey: productKeys.admin, queryFn: fetchAdminProducts })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ProductInput) => createProduct(payload),
    onSuccess: () => {
      toast.success('Produk berhasil ditambahkan')
      queryClient.invalidateQueries({ queryKey: productKeys.admin })
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
    onError: (error) =>
      toast.error('Gagal menyimpan produk', {
        description: getErrorMessage(error),
      }),
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProductInput }) =>
      updateProduct(id, payload),
    onSuccess: () => {
      toast.success('Perubahan produk tersimpan')
      queryClient.invalidateQueries({ queryKey: productKeys.admin })
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
    onError: (error) =>
      toast.error('Gagal menyimpan produk', {
        description: getErrorMessage(error),
      }),
  })
}

export function useToggleProductActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      isActive,
    }: {
      id: string
      isActive: boolean
    }) => setProductActive(id, isActive),
    onSuccess: (_, variables) => {
      toast.success(
        variables.isActive
          ? 'Produk ditayangkan kembali di katalog'
          : 'Produk disembunyikan dari katalog',
      )
      queryClient.invalidateQueries({ queryKey: productKeys.admin })
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
    onError: (error) =>
      toast.error('Gagal mengubah status produk', {
        description: getErrorMessage(error),
      }),
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      toast.success('Produk dihapus')
      queryClient.invalidateQueries({ queryKey: productKeys.admin })
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
    onError: (error) =>
      toast.error('Gagal menghapus produk', {
        description: getErrorMessage(error),
      }),
  })
}
