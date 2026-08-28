import { DownloadCloud, FileArchive } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/layout/page-header'
import { PageTransition } from '@/components/layout/page-transition'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDownloads } from '@/hooks/use-products'
import { formatBytes, formatDateTime } from '@/lib/utils'

export default function DownloadsPage() {
  const { data: downloads, isLoading } = useDownloads()

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Riwayat Unduhan"
          description="Catatan setiap file yang pernah kamu unduh dari member area."
          actions={
            <Button asChild variant="outline">
              <Link to="/dashboard/products">Ke Produk Saya</Link>
            </Button>
          }
        />

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-6">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : downloads && downloads.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead>Nama file</TableHead>
                    <TableHead>Ukuran</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead className="text-right">IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {downloads.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={item.product.cover}
                            alt=""
                            className="size-10 shrink-0 rounded-lg object-cover"
                          />
                          <span className="line-clamp-1 max-w-[16rem] text-sm font-medium">
                            {item.product.title}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground flex items-center gap-2 font-mono text-xs">
                          <FileArchive className="size-3.5 shrink-0" />
                          {item.fileName}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {formatBytes(item.fileSize)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {formatDateTime(item.downloadedAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right font-mono text-xs">
                        {item.ip}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                icon={DownloadCloud}
                title="Belum ada unduhan"
                description="Setiap kali kamu mengunduh produk, riwayatnya akan tercatat di sini."
                action={
                  <Button asChild>
                    <Link to="/dashboard/products">Buka Produk Saya</Link>
                  </Button>
                }
                className="border-0"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
