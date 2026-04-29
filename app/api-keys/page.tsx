'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { Key, Plus, Trash2, Copy, Check, Eye, EyeOff } from 'lucide-react'
import { api } from '@/lib/api'

interface KeyForm { name: string; owner_email: string; rate_limit: string }
const EMPTY: KeyForm = { name: '', owner_email: '', rate_limit: '1000' }

interface ApiKeyOut {
  id: string; name: string; owner_email: string
  rate_limit: number; is_active: boolean
  created_at: string; last_used_at: string | null
}

export default function ApiKeysPage() {
  const [form, setForm]         = useState<KeyForm>(EMPTY)
  const [lookupEmail, setLookupEmail] = useState('')
  const [lookupInput, setLookupInput] = useState('')
  const [newKey, setNewKey]     = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState('')
  const [copied, setCopied]     = useState(false)
  const [showKey, setShowKey]   = useState(false)

  const { data: keys, mutate } = useSWR<ApiKeyOut[]>(
    lookupEmail ? ['api-keys', lookupEmail] : null,
    () => fetch(`/api/v1/auth/keys?email=${encodeURIComponent(lookupEmail)}`).then(r => r.json()),
  )

  const set = (k: keyof KeyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true); setError(''); setNewKey(null)
    try {
      const res = await fetch('/api/v1/auth/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        form.name,
          owner_email: form.owner_email,
          rate_limit:  Number(form.rate_limit) || 1000,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setNewKey(data.key)
      setForm(EMPTY)
      if (lookupEmail === form.owner_email) mutate()
    } catch {
      setError('Не вдалось створити ключ.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRevoke = async (id: string) => {
    await fetch(`/api/v1/auth/keys/${id}`, { method: 'DELETE' })
    mutate()
  }

  const handleCopy = () => {
    if (!newKey) return
    navigator.clipboard.writeText(newKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Key size={22} className="text-accent" />
        <h1 className="text-xl font-bold text-white">API Ключі</h1>
      </div>

      {/* New key shown once */}
      {newKey && (
        <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-4 space-y-3">
          <p className="text-sm font-semibold text-green-400">Ключ створено — збережіть його зараз, він більше не буде показаний</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-bg px-3 py-2 text-xs font-mono text-white break-all">
              {showKey ? newKey : newKey.replace(/./g, '•')}
            </code>
            <button onClick={() => setShowKey(v => !v)} className="text-muted hover:text-white transition-colors p-1">
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button onClick={handleCopy} className="text-muted hover:text-white transition-colors p-1">
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
          </div>
          <p className="text-xs text-muted">
            Використовуйте заголовок <code className="text-accent">X-Api-Key: {newKey.slice(0, 12)}…</code> для захищених ендпоінтів
          </p>
        </div>
      )}

      {/* Create form */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h2 className="text-sm font-semibold text-white">Новий ключ</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Назва ключа *" value={form.name} onChange={set('name')}
              placeholder="Мій інтеграційний ключ" required />
            <Field label="Email *" type="email" value={form.owner_email} onChange={set('owner_email')}
              placeholder="you@example.com" required />
          </div>
          <Field label="Ліміт запитів / день" type="number" value={form.rate_limit}
            onChange={set('rate_limit')} placeholder="1000" />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit" disabled={submitting || !form.name || !form.owner_email}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80 disabled:opacity-50 transition-colors"
          >
            <Plus size={16} />
            {submitting ? 'Створюємо...' : 'Створити ключ'}
          </button>
        </form>
      </div>

      {/* Lookup */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white">Мої ключі</h2>
        <div className="flex gap-3">
          <input type="email" value={lookupInput} onChange={e => setLookupInput(e.target.value)}
            placeholder="Введіть email"
            className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:border-accent outline-none placeholder:text-muted" />
          <button onClick={() => setLookupEmail(lookupInput)} disabled={!lookupInput}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-white hover:border-accent disabled:opacity-50 transition-colors">
            Знайти
          </button>
        </div>

        {keys && keys.length === 0 && <p className="text-sm text-muted">Ключів не знайдено</p>}

        {keys && keys.length > 0 && (
          <div className="divide-y divide-border">
            {keys.map(k => (
              <div key={k.id} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <p className="text-sm text-white truncate">{k.name}</p>
                  <p className="text-xs text-muted">
                    {k.rate_limit.toLocaleString('uk-UA')} запитів/день
                    {k.last_used_at && ` · Останній: ${new Date(k.last_used_at).toLocaleDateString('uk-UA')}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${k.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {k.is_active ? 'активний' : 'відкликано'}
                  </span>
                  {k.is_active && (
                    <button onClick={() => handleRevoke(k.id)}
                      className="text-muted hover:text-red-400 transition-colors" title="Відкликати">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage hint */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-sm font-semibold text-white">Як використовувати</h2>
        <div className="space-y-2 text-xs text-muted font-mono">
          <p className="text-white/60">Захищені ендпоінти (Export):</p>
          <pre className="bg-bg rounded-lg p-3 text-green-400 overflow-x-auto">{`GET /api/v1/export/tenders?format=csv
X-Api-Key: prz_ваш_ключ`}</pre>
          <pre className="bg-bg rounded-lg p-3 text-green-400 overflow-x-auto">{`curl -H "X-Api-Key: prz_ваш_ключ" \\
  "https://yourdomain/api/v1/export/tenders?format=xlsx"`}</pre>
        </div>
      </div>
    </div>
  )
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted">{label}</label>
      <input {...props}
        className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:border-accent outline-none placeholder:text-muted" />
    </div>
  )
}
