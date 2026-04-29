'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { api, fmtAmount, fmtDate } from '@/lib/api'
import { Search, Building2, FileText } from 'lucide-react'
import RiskBadge from '@/components/RiskBadge'

type Tab = 'all' | 'tenders' | 'companies'

export default function SearchPage() {
  const params   = useSearchParams()
  const router   = useRouter()
  const q        = params.get('q') ?? ''
  const [tab, setTab] = useState<Tab>('all')
  const [input, setInput] = useState(q)

  const { data, isLoading } = useSWR(
    q.length >= 2 ? ['search', q] : null,
    () => api.search.query(q),
  )

  const tenders   = data?.tenders   ?? []
  const companies = data?.companies ?? []

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim().length >= 2) router.push(`/search?q=${encodeURIComponent(input.trim())}`)
  }

  const visibleTenders   = tab === 'companies' ? [] : tenders
  const visibleCompanies = tab === 'tenders'   ? [] : companies

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="flex-1 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 focus-within:border-accent transition-colors">
          <Search size={18} className="shrink-0 text-muted" />
          <input
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Пошук тендерів, компаній, ЄДРПОУ..."
            className="flex-1 bg-transparent text-white placeholder:text-muted outline-none text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-accent px-5 py-3 text-sm font-medium text-white hover:bg-accent/80 transition-colors"
        >
          Знайти
        </button>
      </form>

      {q.length < 2 ? (
        <p className="text-center text-muted py-16">Введіть мінімум 2 символи для пошуку</p>
      ) : isLoading ? (
        <p className="text-center text-muted py-16">Шукаємо...</p>
      ) : !data || (tenders.length === 0 && companies.length === 0) ? (
        <p className="text-center text-muted py-16">Нічого не знайдено для «{q}»</p>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-border">
            {([
              ['all',       'Всі результати', tenders.length + companies.length],
              ['tenders',   'Тендери',         tenders.length],
              ['companies', 'Компанії',        companies.length],
            ] as [Tab, string, number][]).map(([t, label, count]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition-colors -mb-px
                  ${tab === t
                    ? 'border-accent text-white'
                    : 'border-transparent text-muted hover:text-white'}`}
              >
                {label}
                <span className="rounded-full bg-border px-1.5 text-xs">{count}</span>
              </button>
            ))}
          </div>

          {/* Companies */}
          {visibleCompanies.length > 0 && (
            <section className="space-y-2">
              {tab === 'all' && (
                <h2 className="flex items-center gap-2 text-sm font-semibold text-muted uppercase tracking-wider">
                  <Building2 size={14} /> Компанії
                </h2>
              )}
              <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                {visibleCompanies.map(c => (
                  <Link
                    key={c.edrpou}
                    href={`/companies/${c.edrpou}`}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{c.name}</p>
                      <p className="text-xs text-muted mt-0.5">
                        ЄДРПОУ {c.edrpou}
                        {c.region && ` · ${c.region}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {c.risk_level && <RiskBadge level={c.risk_level} />}
                      <p className="text-xs text-muted mt-1">
                        {c.as_buyer_tenders_count > 0 && `${c.as_buyer_tenders_count} закупівель`}
                        {c.as_buyer_tenders_count > 0 && c.as_supplier_tenders_count > 0 && ' · '}
                        {c.as_supplier_tenders_count > 0 && `${c.as_supplier_tenders_count} перемог`}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Tenders */}
          {visibleTenders.length > 0 && (
            <section className="space-y-2">
              {tab === 'all' && (
                <h2 className="flex items-center gap-2 text-sm font-semibold text-muted uppercase tracking-wider">
                  <FileText size={14} /> Тендери
                </h2>
              )}
              <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                {visibleTenders.map(t => (
                  <Link
                    key={t.id}
                    href={`/tenders/${t.tender_id}`}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{t.title}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {t.tender_id}
                        {t.procuring_entity_name && ` · ${t.procuring_entity_name}`}
                        {t.date_created && ` · ${fmtDate(t.date_created)}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {t.value_amount != null && (
                        <p className="text-sm text-white">{fmtAmount(t.value_amount)}</p>
                      )}
                      {t.risk_level && <RiskBadge level={t.risk_level} />}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
