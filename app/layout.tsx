'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import './globals.css'

export const metadata = {
  title:       'Prozorro Analytics',
  description: 'Аналітична платформа державних тендерів України',
}

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

function AuthNav() {
  const [email, setEmail] = useState<string | null>(null)
  useEffect(() => {
    setEmail(localStorage.getItem('prz_email'))
  }, [])
  const logout = () => {
    localStorage.removeItem('prz_token')
    localStorage.removeItem('prz_plan')
    localStorage.removeItem('prz_email')
    setEmail(null)
    window.location.href = '/'
  }
  if (email) return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted hidden sm:inline truncate max-w-[120px]">{email}</span>
      <button onClick={logout}
        className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted hover:border-white/30 hover:text-white transition-colors">
        Вийти
      </button>
    </div>
  )
  return (
    <div className="flex items-center gap-1">
      <NavLink href="/login">Вхід</NavLink>
      <Link href="/register"
        className="text-sm px-3 py-1.5 rounded-lg bg-accent text-white hover:bg-accent/80 transition-colors">
        Реєстрація
      </Link>
    </div>
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
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white font-bold text-sm">P</span>
              <span className="font-semibold text-white">Prozorro Analytics</span>
            </Link>
            <nav className="flex items-center gap-1">
              <NavLink href="/tenders">Тендери</NavLink>
              <NavLink href="/companies">Компанії</NavLink>
              <NavLink href="/analytics">Аналітика</NavLink>
              <NavLink href="/hromada">Громади</NavLink>
              <NavLink href="/alerts">Сповіщення</NavLink>
              <NavLink href="/api-keys">API</NavLink>
            </nav>
            <AuthNav />
          </div>
        </header>

        {/* Main */}
        <main className="mx-auto max-w-screen-xl px-4 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border mt-16 py-6 text-center text-xs text-muted">
          Дані: <a href="https://prozorro.gov.ua" className="hover:text-white">Prozorro</a> · CC BY ·{' '}
          <a href="https://public-api.prozorro.gov.ua" className="hover:text-white">API</a>
        </footer>
      </body>
    </html>
  )
}
