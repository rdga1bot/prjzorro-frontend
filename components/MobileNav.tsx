'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/tenders',   label: 'Тендери' },
  { href: '/companies', label: 'Компанії' },
  { href: '/analytics', label: 'Аналітика' },
  { href: '/risky',     label: 'Топ ризиків' },
  { href: '/hromada',   label: 'Громади' },
  { href: '/webhooks',  label: 'Вебхуки' },
  { href: '/orgs',      label: 'Організації' },
  { href: '/alerts',    label: 'Сповіщення' },
  { href: '/api-keys',  label: 'API' },
]

export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Hamburger button — visible only on mobile */}
      <button
        onClick={() => setOpen(v => !v)}
        className="sm:hidden p-2 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors"
        aria-label={open ? 'Закрити меню' : 'Відкрити меню'}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile dropdown menu */}
      {open && (
        <div className="sm:hidden absolute top-full left-0 right-0 z-50 border-b border-border bg-bg/95 backdrop-blur-md shadow-lg">
          <nav className="mx-auto max-w-screen-xl px-4 py-3 grid grid-cols-2 gap-1">
            {NAV_ITEMS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  pathname === href
                    ? 'bg-accent/15 text-accent font-medium'
                    : 'text-muted hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  )
}
