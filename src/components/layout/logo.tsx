import { Link } from 'react-router-dom'

import { APP_NAME } from '@/config'
import { cn } from '@/lib/utils'

export function Logo({
  className,
  to = '/',
  showText = true,
}: {
  className?: string
  to?: string
  showText?: boolean
}) {
  return (
    <Link
      to={to}
      className={cn(
        'group flex items-center gap-2.5 rounded-xl transition-opacity hover:opacity-90',
        className,
      )}
      aria-label={APP_NAME}
    >
      <span className="shadow-soft flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white transition-transform duration-200 group-hover:scale-105">
        <img
          src="/Loggrafista-01.png"
          alt=""
          className="size-full object-contain"
          aria-hidden="true"
        />
      </span>
      {showText && (
        <span className="text-[15px] leading-none font-semibold tracking-tight">
          {APP_NAME}
        </span>
      )}
    </Link>
  )
}
