'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { api } from '@/lib/api'
import { Bell, BellOff, Plus, Trash2 } from 'lucide-react'

const RISK_OPTIONS = ['', 'low', 'medium', 'high', 'critical']
const RISK_LABELS: Record<string, string> = {
  '': 'Будь-який', low: 'Низький', medium: 'Середній', high: 'Високий', critical: 'Критичний',
}

interface AlertForm {
  email: string; name: string; buyer_edrpou: string; supplier_edrpou: string
  cpv_code: string; region: string; amount_min: string; risk_level: string
  telegram_chat_id: string; notify_email: boolean; notify_telegram: boolean
}

const EMPTY: AlertForm = {
  email: '', name: '', buyer_edrpou: '', supplier_edrpou: '',
  cpv_code: '', region: '', amount_min: '', risk_level: '',
  telegram_chat_id: '', notify_email: true, notify_telegram: false,
}

export default function AlertsPage() {
  const [form, setForm]       = useState<AlertForm>(EMPTY)
  const [lookup, setLookup]   = useState('')
  const [lookupInput, setLookupInput] = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [success, setSuccess]         = useState(false)
  const [error, setError]             = useState('')

  const { data: myAlerts, mutate } = useSWR(
    lookup ? ['alerts', lookup] : null,
    () => api.alerts.list(lookup),
  )

  const set = (k: keyof AlertForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true); setError(''); setSuccess(false)
    try {
      await api.alerts.create({
        email:            form.email,
        name:             form.name || undefined,
        buyer_edrpou:     form.buyer_edrpou || undefined,
        supplier_edrpou:  form.supplier_edrpou || undefined,
        cpv_code:         form.cpv_code || undefined,
        region:           form.region || undefined,
        amount_min:       form.amount_min ? Number(form.amount_min) : undefined,
        risk_level:       form.risk_level || undefined,
        telegram_chat_id: form.telegram_chat_id || undefined,
        notify_email:     form.notify_email,
        notify_telegram:  form.notify_telegram,
      })
      setSuccess(true)
      setForm(EMPTY)
      if (lookup === form.email) mutate()
    } catch {
      setError('Не вдалось створити підписку. Перевірте email.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    await api.alerts.delete(id).catch(() => null)
    mutate()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Bell size={22} className="text-accent" />
        <h1 className="text-xl font-bold text-white">Сповіщення</h1>
      </div>

      {/* Create form */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h2 className="text-sm font-semibold text-white">Нова підписка</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email *" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
            <Field label="Назва підписки" value={form.name} onChange={set('name')} placeholder="Київські тендери" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="ЄДРПОУ замовника" value={form.buyer_edrpou} onChange={set('buyer_edrpou')} placeholder="14360570" />
            <Field label="ЄДРПОУ постачальника" value={form.supplier_edrpou} onChange={set('supplier_edrpou')} placeholder="00000000" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="CPV код" value={form.cpv_code} onChange={set('cpv_code')} placeholder="45000000" />
            <Field label="Регіон" value={form.region} onChange={set('region')} placeholder="Київ" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Сума від (UAH)" type="number" value={form.amount_min} onChange={set('amount_min')} placeholder="0" />
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">Рівень ризику</label>
              <select
                value={form.risk_level}
                onChange={set('risk_level')}
                className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:border-accent outline-none"
              >
                {RISK_OPTIONS.map(o => <option key={o} value={o}>{RISK_LABELS[o]}</option>)}
              </select>
            </div>
          </div>

          {/* Канали сповіщень */}
          <div className="space-y-2 pt-1">
            <p className="text-xs text-muted">Канали сповіщень</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.notify_email}
                onChange={e => setForm(f => ({ ...f, notify_email: e.target.checked }))}
                className="accent-accent" />
              <span className="text-sm text-white">Email</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.notify_telegram}
                onChange={e => setForm(f => ({ ...f, notify_telegram: e.target.checked }))}
                className="accent-accent" />
              <span className="text-sm text-white">Telegram</span>
            </label>
            {form.notify_telegram && (
              <Field
                label="Telegram Chat ID (отримати у @userinfobot)"
                value={form.telegram_chat_id}
                onChange={set('telegram_chat_id')}
                placeholder="-1001234567890"
              />
            )}
          </div>

          {error   && <p className="text-sm text-red-400">{error}</p>}
          {success && <p className="text-sm text-green-400">Підписку створено!</p>}

          <button
            type="submit"
            disabled={submitting || !form.email}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80 disabled:opacity-50 transition-colors"
          >
            <Plus size={16} />
            {submitting ? 'Зберігаємо...' : 'Підписатись'}
          </button>
        </form>
      </div>

      {/* Lookup */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white">Мої підписки</h2>
        <div className="flex gap-3">
          <input
            type="email"
            value={lookupInput}
            onChange={e => setLookupInput(e.target.value)}
            placeholder="Введіть email"
            className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:border-accent outline-none placeholder:text-muted"
          />
          <button
            onClick={() => setLookup(lookupInput)}
            disabled={!lookupInput}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-white hover:border-accent disabled:opacity-50 transition-colors"
          >
            Знайти
          </button>
        </div>

        {myAlerts && myAlerts.length === 0 && (
          <p className="text-sm text-muted">Підписок не знайдено</p>
        )}

        {myAlerts && myAlerts.length > 0 && (
          <div className="divide-y divide-border">
            {myAlerts.map(a => (
              <div key={a.id} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-white">{a.name || 'Без назви'}</p>
                  <p className="text-xs text-muted">
                    {[
                      a.buyer_edrpou    && `Замовник: ${a.buyer_edrpou}`,
                      a.supplier_edrpou && `Постачальник: ${a.supplier_edrpou}`,
                      a.cpv_code        && `CPV: ${a.cpv_code}`,
                      a.region          && `Регіон: ${a.region}`,
                      a.risk_level      && `Ризик: ${RISK_LABELS[a.risk_level] ?? a.risk_level}`,
                      a.amount_min      && `Від: ${a.amount_min.toLocaleString('uk-UA')} ₴`,
                    ].filter(Boolean).join(' · ') || 'Всі нові тендери'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!a.is_active && <BellOff size={14} className="text-muted" />}
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-muted hover:text-red-400 transition-colors"
                    title="Скасувати"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted">{label}</label>
      <input
        {...props}
        className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:border-accent outline-none placeholder:text-muted"
      />
    </div>
  )
}
