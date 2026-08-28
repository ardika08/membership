import type * as React from 'react'
import { Link } from 'react-router-dom'

import { isAbsoluteUrl } from '@/config'

interface DomainLinkProps {
  to: string
  className?: string
  children?: React.ReactNode
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
  'aria-label'?: string
  title?: string
}

/**
 * Link navigasi yang sadar-domain: memakai React Router <Link> untuk
 * path se-origin, dan <a> biasa saat targetnya domain lain
 * (grafistadigital.com ↔ member.grafistadigital.com).
 */
export function DomainLink({ to, ...props }: DomainLinkProps) {
  if (isAbsoluteUrl(to)) {
    return <a href={to} {...props} />
  }

  return <Link to={to} {...props} />
}
