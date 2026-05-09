'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { fmtNumber, FLAG_LABELS } from '@/lib/api'
import RiskLeaderTable from '@/components/RiskLeaderTable'

async function fetchRiskLeaders(flagType: string | null) {
  const qs  = flagType ? `&flag_type=${encodeURIComponent(flagType)}` : ''
  const res = await fetch(`/api/v1/stats/risk-leaders?limit=20${qs}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('failed')
  return res.json()
}

export default function RiskyPage() {
  const [activeFlag, setActiveFlag] = useState<string | null>(null)

  const { data, isLoading } = useSWR(
    ['risk-leaders', activeFlag],
    () => fetchRiskLeaders(activeFlag),
    { keepPreviousData: true },
  )

  if (!data && isLoading) {
    return <div className="py-20 text-center text-muted">Завантаження…</div>
  }
  if (!data) {
    return <div className="py-20 text-center text-muted">Сервіс тимчасово недоступний</div>
  }

  const flagStats: { flag_type: string; count: number }[] = data.flag_stats

  return (
    <div className="space-y-6">

      {/* Title + filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-white">Топ ризиків</h1>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted shrink-0">Фактор ризику:</span>
          <select
            value={activeFlag ?? ''}
            onChange={e => setActiveFlag(e.target.value || null)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-white focus:border-accent focus:outline-none"
          >
            <option value="">Усі фактори</option>
            {flagStats.map(f => (
              <option key={f.flag_type} value={f.flag_type}>
                {FLAG_LABELS[f.flag_type] ?? f.flag_type} ({fmtNumber(f.count)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tables */}
      <div className={`grid gap-6 lg:grid-cols-2 transition-opacity ${isLoading ? 'opacity-50' : ''}`}>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-white">Замовники з найвищим ризиком</h2>
            <p className="text-xs text-muted mt-0.5">
              {activeFlag
                ? `${FLAG_LABELS[activeFlag] ?? activeFlag} · ≥2 тендери`
                : '≥5 тендерів · сортування по середньому скору'}
            </p>
          </div>
          <RiskLeaderTable rows={data.top_buyers} role="buyer" />
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-white">Постачальники з найвищим ризиком</h2>
            <p className="text-xs text-muted mt-0.5">
              {activeFlag
                ? `${FLAG_LABELS[activeFlag] ?? activeFlag} · ≥1 перемога`
                : '≥3 перемоги · сортування по середньому скору'}
            </p>
          </div>
          <RiskLeaderTable rows={data.top_suppliers} role="supplier" />
        </div>
      </div>
    </div>
  )
}
