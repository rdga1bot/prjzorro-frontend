'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function AuthNav() {
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
      <Link href="/login"
        className="text-sm text-muted hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
        Вхід
      </Link>
      <Link href="/register"
        className="text-sm px-3 py-1.5 rounded-lg bg-accent text-white hover:bg-accent/80 transition-colors">
        Реєстрація
      </Link>
    </div>
  )
}
