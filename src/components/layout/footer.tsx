import { Link } from 'react-router-dom'

import { APP_NAME, APP_TAGLINE } from '@/config'

const LINKS = [
  { label: 'Katalog', to: '/' },
  { label: 'Masuk', to: '/login' },
  { label: 'Daftar', to: '/register' },
]

export function Footer() {
  return (
    <footer className="border-border mt-auto border-t">
      <div className="text-muted-foreground mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 px-4 py-8 text-sm sm:flex-row sm:px-6 lg:px-8">
        <p>
          © {new Date().getFullYear()} {APP_NAME} — {APP_TAGLINE}
        </p>
        <nav className="flex items-center gap-5">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="hover:text-foreground rounded transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
