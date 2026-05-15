'use client'
import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Building2, Plus, Users, Mail, Trash2, AlertCircle, Check } from 'lucide-react'
import Link from 'next/link'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

interface Org {
  id: string
  name: string
  slug: string
  plan: string
  quota_api_day: number
  is_active: boolean
  created_at: string
  role: string
}

interface Member {
  user_id:   string
  email:     string
  role:      string
  joined_at: string
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

const PLAN_QUOTA: Record<string, string> = {
  free: '1 000 API запитів/день',
  pro: '10 000 API запитів/день',
  enterprise: 'Без обмежень',
}

function authFetch(token: string) {
  return (url: string) =>
    fetch(`${BASE}${url}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json() })
}

export default function OrgsPage() {
  const [token, setToken] = useState<string | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [name, setName]     = useState('')
  const [slug, setSlug]     = useState('')
  const [plan, setPlan]     = useState<'free' | 'pro' | 'enterprise'>('free')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [activeOrg, setActiveOrg]   = useState<Org | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole]   = useState<'admin' | 'member'>('member')
  const [inviting, setInviting]       = useState(false)
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState('')
  const [copied, setCopied]           = useState(false)

  useEffect(() => { setToken(localStorage.getItem('prz_token')) }, [])

  const { data: orgs, mutate: mutateOrgs } = useSWR<Org[]>(
    token ? '/api/v1/orgs/me' : null,
    authFetch(token ?? ''),
  )

  const { data: members, mutate: mutateMembers } = useSWR<Member[]>(
    token && activeOrg ? `/api/v1/orgs/${activeOrg.slug}/members` : null,
    authFetch(token ?? ''),
  )

  if (!token) {
    return (
      <div className="max-w-lg mx-auto mt-16 space-y-4 text-center">
        <AlertCircle size={40} className="mx-auto text-muted" />
        <h1 className="text-xl font-bold text-white">Потрібна авторизація</h1>
        <Link href="/login" className="inline-block rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent/80">
          Увійти
        </Link>
      </div>
    )
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true); setCreateError('')
    try {
      const res = await fetch(`${BASE}/api/v1/orgs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, slug, plan }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail ?? `${res.status}`) }
      setName(''); setSlug(''); setPlan('free'); setShowCreate(false)
      mutateOrgs()
    } catch (err: any) { setCreateError(err.message) }
    finally { setCreating(false) }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeOrg) return
    setInviting(true); setInviteError(''); setInviteToken(null)
    try {
      const res = await fetch(`${BASE}/api/v1/orgs/${activeOrg.slug}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail ?? `${res.status}`) }
      const data = await res.json()
      setInviteToken(data.invite_token)
      setInviteEmail('')
    } catch (err: any) { setInviteError(err.message) }
    finally { setInviting(false) }
  }

  const handleRemove = async (email: string) => {
    if (!activeOrg) return
    await fetch(`${BASE}/api/v1/orgs/${activeOrg.slug}/members/${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    mutateMembers()
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Building2 size={22} className="text-accent" />
          <h1 className="text-xl font-bold text-white">Організації</h1>
        </div>
        <button
          onClick={() => setShowCreate(v => !v)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80 transition-colors"
        >
          <Plus size={15} /> Нова організація
        </button>
      </div>

      {/* Форма створення */}
      {showCreate && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">Нова організація</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted">Назва *</label>
                <input value={name} onChange={e => setName(e.target.value)} required
                  placeholder="Моя організація"
                  className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:border-accent outline-none placeholder:text-muted" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted">Slug (URL) *</label>
                <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase())} required
                  placeholder="my-org"
                  className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:border-accent outline-none placeholder:text-muted" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">План</label>
              <div className="grid grid-cols-3 gap-2">
                {(['free', 'pro', 'enterprise'] as const).map(p => (
                  <label key={p}
                    className={`flex flex-col gap-0.5 rounded-lg border px-3 py-2 cursor-pointer transition-colors
                      ${plan === p ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'}`}>
                    <input type="radio" className="sr-only" checked={plan === p} onChange={() => setPlan(p)} />
                    <span className={`text-sm font-medium ${plan === p ? 'text-white' : 'text-muted'}`}>{PLAN_LABELS[p]}</span>
                    <span className="text-xs text-muted">{PLAN_QUOTA[p]}</span>
                  </label>
                ))}
              </div>
            </div>
            {createError && <p className="text-sm text-red-400">{createError}</p>}
            <button type="submit" disabled={creating || !name || !slug}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80 disabled:opacity-50">
              <Plus size={15} />
              {creating ? 'Створюємо...' : 'Створити'}
            </button>
          </form>
        </div>
      )}

      {/* Список організацій */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white">Мої організації</h2>
        {orgs && orgs.length === 0 && (
          <p className="text-sm text-muted">Ви ще не входите до жодної організації</p>
        )}
        {orgs && orgs.map(org => (
          <div key={org.id}
            onClick={() => setActiveOrg(activeOrg?.id === org.id ? null : org)}
            className={`rounded-xl border p-4 cursor-pointer transition-colors
              ${activeOrg?.id === org.id ? 'border-accent/50 bg-accent/5' : 'border-border hover:border-border/60'}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">{org.name}</p>
                <p className="text-xs text-muted">/{org.slug} · {PLAN_LABELS[org.plan]} · {org.role}</p>
              </div>
              <span className="text-xs text-muted shrink-0">
                {org.quota_api_day > 0 ? `${org.quota_api_day.toLocaleString()} req/day` : 'Unlimited'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Панель управління активною org */}
      {activeOrg && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <h2 className="text-sm font-semibold text-white">
            Управління: <span className="text-accent">{activeOrg.name}</span>
          </h2>

          {/* Члени */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-muted" />
              <span className="text-xs font-medium text-muted uppercase tracking-wide">Учасники</span>
            </div>
            {members && members.length > 0 && (
              <div className="divide-y divide-border">
                {members.map(m => (
                  <div key={m.user_id} className="flex items-center justify-between py-2.5 gap-4">
                    <div>
                      <p className="text-sm text-white">{m.email}</p>
                      <p className="text-xs text-muted">{m.role}</p>
                    </div>
                    {m.role !== 'owner' && (
                      <button onClick={() => handleRemove(m.email)}
                        className="p-1 text-muted hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Запрошення */}
          {(activeOrg.role === 'owner' || activeOrg.role === 'admin') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail size={15} className="text-muted" />
                <span className="text-xs font-medium text-muted uppercase tracking-wide">Запросити учасника</span>
              </div>
              <form onSubmit={handleInvite} className="flex gap-2">
                <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  type="email" required placeholder="email@example.com"
                  className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:border-accent outline-none placeholder:text-muted" />
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value as any)}
                  className="rounded-lg border border-border bg-bg px-2 py-2 text-sm text-white focus:border-accent outline-none">
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="submit" disabled={inviting || !inviteEmail}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80 disabled:opacity-50">
                  {inviting ? '...' : 'Запросити'}
                </button>
              </form>
              {inviteError && <p className="text-sm text-red-400">{inviteError}</p>}
              {inviteToken && (
                <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-3 space-y-2">
                  <p className="text-xs text-green-400 font-medium">Запрошення створено</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono text-white break-all">{inviteToken}</code>
                    <button onClick={() => handleCopy(inviteToken)} className="p-1 text-muted hover:text-white">
                      {copied ? <Check size={14} className="text-green-400" /> : <Mail size={14} />}
                    </button>
                  </div>
                  <p className="text-xs text-muted">
                    Надішліть цей токен учаснику. Для прийняття: <code className="text-accent">POST /api/v1/orgs/{activeOrg.slug}/invite/accept</code>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
