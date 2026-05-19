import type { Metadata } from 'next'
import Link from 'next/link'
import AuthNav from '@/components/AuthNav'
import MobileNav from '@/components/MobileNav'
import './globals.css'

export const metadata: Metadata = {
  title:       'Prozorro Analytics',
  description: 'Аналітична платформа державних тендерів України',
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-muted hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
    >
      {children}
    </Link>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md">
          <div className="relative mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white font-bold text-sm">P</span>
              <span className="font-semibold text-white">Prozorro Analytics</span>
            </Link>

            {/* Desktop nav — hidden on mobile */}
            <nav className="hidden sm:flex items-center gap-1">
              <NavLink href="/tenders">Тендери</NavLink>
              <NavLink href="/companies">Компанії</NavLink>
              <NavLink href="/analytics">Аналітика</NavLink>
              <NavLink href="/risky">Топ ризиків</NavLink>
              <NavLink href="/hromada">Громади</NavLink>
              <NavLink href="/webhooks">Вебхуки</NavLink>
              <NavLink href="/orgs">Організації</NavLink>
              <NavLink href="/alerts">Сповіщення</NavLink>
              <NavLink href="/api-keys">API</NavLink>
            </nav>

            <div className="flex items-center gap-2">
              <AuthNav />
              {/* Hamburger — visible only on mobile */}
              <MobileNav />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-screen-xl px-4 py-6">
          {children}
        </main>

        <footer className="border-t border-border mt-16 py-6 text-center text-xs text-muted">
          Дані: <a href="https://prozorro.gov.ua" className="hover:text-white">Prozorro</a> · CC BY ·{' '}
          <a href="https://public-api.prozorro.gov.ua" className="hover:text-white">API</a> ·{' '}
          <Link href="/privacy" className="hover:text-white">Конфіденційність</Link>
        </footer>
      </body>
    </html>
  )
}
