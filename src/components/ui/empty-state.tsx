import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import type * as React from 'react'

import { cn } from '@/lib/utils'

interface EmptyStateProps extends React.ComponentProps<'div'> {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'border-border bg-surface/60 flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-16 text-center',
        className,
      )}
      {...(props as React.ComponentProps<typeof motion.div>)}
    >
      <div className="bg-primary/8 ring-primary/10 relative mb-5 flex size-16 items-center justify-center rounded-2xl ring-8">
        <Icon className="text-primary size-7" strokeWidth={1.5} aria-hidden />
      </div>
      <h3 className="text-foreground text-base font-semibold">{title}</h3>
      {description && (
        <p className="text-muted-foreground mt-1.5 max-w-sm text-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  )
}

export { EmptyState }
