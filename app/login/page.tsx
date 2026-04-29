'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogIn } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Помилка входу')
      }
      const data = await res.json()
      localStorage.setItem('prz_token', data.access_token)
      localStorage.setItem('prz_plan',  data.plan)
      localStorage.setItem('prz_email', data.email)
      router.push('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 space-y-6">
      <div className="flex items-center gap-3">
        <LogIn size={22} className="text-accent" />
        <h1 className="text-xl font-bold text-white">Вхід</h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              required autoFocus
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:border-accent outline-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">Пароль</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              required
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:border-accent outline-none" />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80 disabled:opacity-50 transition-colors">
            {loading ? 'Входимо...' : 'Увійти'}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-muted">
        Немає акаунту?{' '}
        <Link href="/register" className="text-accent hover:underline">Зареєструватись</Link>
      </p>
    </div>
  )
}
