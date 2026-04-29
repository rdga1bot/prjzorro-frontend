'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserPlus, Check } from 'lucide-react'

const PLANS = [
  {
    id: 'free',
    label: 'Free',
    price: 'Безкоштовно',
    features: ['Перегляд тендерів та аналітики', 'Пошук Meilisearch', 'Сповіщення (до 3)', 'Export: до 500 рядків'],
  },
  {
    id: 'pro',
    label: 'Pro',
    price: 'Незабаром',
    features: ['Все з Free', 'Export: до 50 000 рядків', 'Необмежені сповіщення', 'API ключі (до 10)', 'Пріоритетна підтримка'],
    disabled: true,
  },
]

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== password2) { setError('Паролі не збігаються'); return }
    if (password.length < 8)    { setError('Пароль мінімум 8 символів'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Помилка реєстрації')
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
    <div className="max-w-2xl mx-auto mt-10 space-y-8">
      <div className="flex items-center gap-3">
        <UserPlus size={22} className="text-accent" />
        <h1 className="text-xl font-bold text-white">Реєстрація</h1>
      </div>

      {/* Plans comparison */}
      <div className="grid grid-cols-2 gap-4">
        {PLANS.map(plan => (
          <div key={plan.id}
            className={`rounded-xl border p-5 space-y-4 ${
              plan.disabled
                ? 'border-border bg-card opacity-60'
                : 'border-accent/50 bg-accent/5'
            }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-lg">{plan.label}</span>
              <span className="text-xs text-muted">{plan.price}</span>
            </div>
            <ul className="space-y-2">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted">
                  <Check size={13} className="text-accent shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Register form */}
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-xs text-muted mb-4">Реєструєтесь на план <span className="text-accent font-medium">Free</span></p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              required autoFocus
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:border-accent outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">Пароль</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                required
                className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:border-accent outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">Повторити пароль</label>
              <input type="password" value={password2} onChange={e => setPassword2(e.target.value)}
                required
                className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:border-accent outline-none" />
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80 disabled:opacity-50 transition-colors">
            {loading ? 'Реєструємось...' : 'Створити акаунт'}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-muted">
        Вже є акаунт?{' '}
        <Link href="/login" className="text-accent hover:underline">Увійти</Link>
      </p>
    </div>
  )
}
