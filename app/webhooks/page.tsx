'use client'
import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Webhook, Plus, Trash2, Zap, Copy, Check, Eye, EyeOff, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { fmtDate } from '@/lib/api'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

const ALL_EVENTS: { id: string; label: string }[] = [
  { id: 'tender.created',      label: 'Новий тендер' },
  { id: 'tender.risk_flag',    label: 'Red flag виявлено' },
  { id: 'tender.complete',     label: 'Тендер завершено' },
  { id: 'company.risk_update', label: 'Оновлення ризику компанії' },
]

interface Webhook {
  id: string
  url: string
  events: string[]
  is_active: boolean
  created_at: string
  deliveries_ok: number
  deliveries_fail: number
}

function authFetch(token: string) {
  return (url: string) =>
    fetch(`${BASE}${url}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => {
      if (!r.ok) throw new Error(`${r.status}`)
      return r.json()
    })
}

export default function WebhooksPage() {
  const [token, setToken]   = useState<string | null>(null)
  const [url, setUrl]       = useState('')
  const [events, setEvents] = useState<string[]>(['tender.risk_flag', 'tender.complete'])
  const [creating, setCreating]   = useState(false)
  const [error, setError]         = useState('')
  const [newSecret, setNewSecret] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState(false)
  const [copied, setCopied]       = useState(false)
  const [testing, setTesting]     = useState<string | null>(null)
  const [testResult, setTestResult] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setToken(localStorage.getItem('prz_token'))
  }, [])

  const { data: webhooks, mutate } = useSWR<Webhook[]>(
    token ? '/api/v1/webhooks/' : null,
    authFetch(token ?? ''),
  )

  if (!token) {
    return (
      <div className="max-w-lg mx-auto mt-16 space-y-4 text-center">
        <AlertCircle size={40} className="mx-auto text-muted" />
        <h1 className="text-xl font-bold text-white">Потрібна авторизація</h1>
        <p className="text-sm text-muted">Для управління вебхуками увійдіть в акаунт</p>
        <Link href="/login"
          className="inline-block rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent/80 transition-colors">
          Увійти
        </Link>
      </div>
    )
  }

  const toggleEvent = (id: string) =>
    setEvents(ev => ev.includes(id) ? ev.filter(e => e !== id) : [...ev, id])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url || events.length === 0) return
    setCreating(true); setError(''); setNewSecret(null)
    try {
      const res = await fetch(`${BASE}/api/v1/webhooks/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url, events }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.detail ?? `Помилка ${res.status}`)
      }
      const data = await res.json()
      setNewSecret(data.secret)
      setUrl('')
      setEvents(['tender.risk_flag', 'tender.complete'])
      mutate()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    await fetch(`${BASE}/api/v1/webhooks/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    mutate()
  }

  const handleTest = async (id: string) => {
    setTesting(id)
    try {
      const res = await fetch(`${BASE}/api/v1/webhooks/${id}/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setTestResult(r => ({ ...r, [id]: data.success }))
    } finally {
      setTesting(null)
    }
  }

  const handleCopy = () => {
    if (!newSecret) return
    navigator.clipboard.writeText(newSecret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Webhook size={22} className="text-accent" />
        <h1 className="text-xl font-bold text-white">Вебхуки</h1>
      </div>

      {/* Secret показується один раз */}
      {newSecret && (
        <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-4 space-y-3">
          <p className="text-sm font-semibold text-green-400">
            Webhook створено — збережіть секрет зараз, він більше не буде показаний
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-bg px-3 py-2 text-xs font-mono text-white break-all">
              {showSecret ? newSecret : newSecret.replace(/./g, '•')}
            </code>
            <button onClick={() => setShowSecret(v => !v)} className="p-1 text-muted hover:text-white transition-colors">
              {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button onClick={handleCopy} className="p-1 text-muted hover:text-white transition-colors">
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
          </div>
          <p className="text-xs text-muted">
            Перевіряйте підпис: заголовок <code className="text-accent">X-Prozorro-Signature: sha256=…</code>
          </p>
        </div>
      )}

      {/* Форма створення */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h2 className="text-sm font-semibold text-white">Новий webhook</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">URL ендпоінту *</label>
            <input
              type="url" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://your-service.com/hook" required
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:border-accent outline-none placeholder:text-muted"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted">Події</label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_EVENTS.map(ev => (
                <label key={ev.id}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors
                    ${events.includes(ev.id) ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'}`}>
                  <input type="checkbox" className="sr-only"
                    checked={events.includes(ev.id)}
                    onChange={() => toggleEvent(ev.id)} />
                  <span className={`text-xs ${events.includes(ev.id) ? 'text-white' : 'text-muted'}`}>
                    {ev.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button type="submit" disabled={creating || !url || events.length === 0}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80 disabled:opacity-50 transition-colors">
            <Plus size={16} />
            {creating ? 'Створюємо...' : 'Створити webhook'}
          </button>
        </form>
      </div>

      {/* Список webhooks */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white">Мої webhooks</h2>

        {webhooks && webhooks.length === 0 && (
          <p className="text-sm text-muted">Вебхуки ще не створені</p>
        )}

        {webhooks && webhooks.length > 0 && (
          <div className="divide-y divide-border">
            {webhooks.map(wh => (
              <div key={wh.id} className="py-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-mono text-white truncate">{wh.url}</p>
                    <p className="text-xs text-muted">
                      Створено: {fmtDate(wh.created_at)}
                      {' · '}
                      <span className="text-green-400">{wh.deliveries_ok} ✓</span>
                      {' · '}
                      <span className={wh.deliveries_fail > 0 ? 'text-red-400' : 'text-muted'}>
                        {wh.deliveries_fail} ✗
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${wh.is_active ? 'bg-green-500/20 text-green-400' : 'bg-border text-muted'}`}>
                      {wh.is_active ? 'активний' : 'вимкнено'}
                    </span>
                    <button
                      onClick={() => handleTest(wh.id)}
                      disabled={testing === wh.id}
                      title="Тестовий запит"
                      className="p-1 text-muted hover:text-accent transition-colors disabled:opacity-50">
                      <Zap size={14} className={
                        testResult[wh.id] === true  ? 'text-green-400' :
                        testResult[wh.id] === false ? 'text-red-400' : ''
                      } />
                    </button>
                    <button
                      onClick={() => handleDelete(wh.id)}
                      title="Видалити"
                      className="p-1 text-muted hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {wh.events.map(ev => (
                    <span key={ev}
                      className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                      {ALL_EVENTS.find(e => e.id === ev)?.label ?? ev}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Документація */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-sm font-semibold text-white">Верифікація підпису</h2>
        <pre className="rounded-lg bg-bg p-3 text-xs font-mono text-green-400 overflow-x-auto">{`import hmac, hashlib

def verify(secret: str, body: bytes, signature: str) -> bool:
    expected = "sha256=" + hmac.new(
        secret.encode(), body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)`}</pre>
      </div>
    </div>
  )
}
