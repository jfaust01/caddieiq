import Link from 'next/link'

import { siteConfig } from '@/constants/site'

const FOOTER_LINKS = [
  { label: 'Help', href: '/help' },
  { label: 'Settings', href: '/settings' },
  { label: 'Analytics', href: '/analytics' },
]

export function AppFooter() {
  return (
    <footer className="border-t border-border px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
        <p>
          &copy; {new Date().getFullYear()} {siteConfig.name}. {siteConfig.tagline}
        </p>
        <nav className="flex items-center gap-4" aria-label="Footer">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
