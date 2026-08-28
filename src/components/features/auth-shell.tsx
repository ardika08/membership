import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import type * as React from 'react'

import { Logo } from '@/components/layout/logo'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { DomainLink } from '@/components/ui/domain-link'
import { APP_NAME, publicUrl } from '@/config'

const BENEFITS = [
  'Akses instan setelah pembayaran terkonfirmasi',
  'Update produk gratis selamanya',
  'Unduh ulang kapan saja dari dashboard',
  'Lisensi personal & komersial',
]

interface AuthShellProps {
  title: string
  description: string
  footer: React.ReactNode
  children: React.ReactNode
}

export function AuthShell({
  title,
  description,
  footer,
  children,
}: AuthShellProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Form */}
      <div className="flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm"
          >
            <div className="mb-7 space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {title}
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {description}
              </p>
            </div>

            {children}

            <div className="text-muted-foreground mt-6 text-center text-sm">
              {footer}
            </div>
          </motion.div>
        </div>

        <p className="text-muted-foreground text-center text-xs">
          © {new Date().getFullYear()} {APP_NAME}.{' '}
          <DomainLink
            to={publicUrl('/')}
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            Lihat katalog
          </DomainLink>
        </p>
      </div>

      {/* Panel dekoratif */}
      <div className="bg-surface border-border relative hidden overflow-hidden border-l lg:block">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="bg-primary/15 absolute -top-24 -right-24 size-[30rem] rounded-full blur-[130px]" />
          <div className="bg-chart-4/12 absolute -bottom-32 -left-24 size-[28rem] rounded-full blur-[130px]" />
        </div>

        <div className="relative flex h-full flex-col justify-center px-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-md"
          >
            <h2 className="text-3xl leading-tight font-semibold tracking-tight">
              Semua produk digital kamu,
              <br />
              <span className="text-primary">dalam satu dashboard.</span>
            </h2>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              Template Canva, Elementor, ebook, prompt AI, hingga source code
              premium — tersimpan rapi dan siap diunduh kapan pun.
            </p>

            <ul className="mt-9 space-y-3.5">
              {BENEFITS.map((benefit, index) => (
                <motion.li
                  key={benefit}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.2 + index * 0.08 }}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-full">
                    <Check className="size-3.5" strokeWidth={2.5} />
                  </span>
                  {benefit}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
