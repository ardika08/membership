import type * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input bg-card placeholder:text-muted-foreground/70 flex min-h-24 w-full rounded-xl border px-3.5 py-2.5 text-sm shadow-xs transition-all duration-200',
        'focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-4 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
