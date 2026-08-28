import { motion } from 'framer-motion'
import { ArrowLeft, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { DomainLink } from '@/components/ui/domain-link'
import { publicUrl } from '@/config'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[70dvh] items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-md text-center"
      >
        <p className="text-primary/25 text-[5rem] leading-none font-bold tracking-tighter">
          404
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Halaman tidak ditemukan
        </h1>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          Tautan yang kamu buka mungkin sudah dipindahkan atau tidak pernah ada.
          Kembali ke katalog untuk melanjutkan.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2.5">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft />
            Kembali
          </Button>
          <Button asChild>
            <DomainLink to={publicUrl('/')}>
              <Home />
              Ke Katalog
            </DomainLink>
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
