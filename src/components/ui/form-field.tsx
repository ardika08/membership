import { AlertCircle } from 'lucide-react'
import * as React from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface TextInputProps extends React.ComponentProps<'input'> {
  label: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  trailing?: React.ReactNode
}

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, hint, icon, trailing, className, id, ...props }, ref) => {
    const reactId = React.useId()
    const inputId = id ?? reactId
    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`

    return (
      <div className="space-y-2">
        <Label htmlFor={inputId}>{label}</Label>
        <div className="relative">
          {icon && (
            <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 [&_svg]:size-4">
              {icon}
            </span>
          )}
          <Input
            id={inputId}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            className={cn(icon && 'pl-10', trailing && 'pr-11', className)}
            {...props}
          />
          {trailing && (
            <span className="absolute top-1/2 right-1.5 -translate-y-1/2">
              {trailing}
            </span>
          )}
        </div>
        {error ? (
          <p
            id={errorId}
            role="alert"
            className="text-destructive flex items-center gap-1.5 text-xs"
          >
            <AlertCircle className="size-3.5 shrink-0" aria-hidden />
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="text-muted-foreground text-xs">
            {hint}
          </p>
        ) : null}
      </div>
    )
  },
)
TextInput.displayName = 'TextInput'

export { TextInput }
