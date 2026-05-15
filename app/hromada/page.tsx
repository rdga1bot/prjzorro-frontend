'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import dynamic from 'next/dynamic'
import { MapPin, TrendingUp, Users, ChevronRight, ArrowLeft } from 'lucide-react'
import { PROCEDURE_LABELS } from '@/lib/api'

const BarChart = dynamic(() => import('@/components/charts/HromadaCharts').then(m => m.RegionBarChart), { ssr: false })
const TrendChart = dynamic(() => import('@/components/charts/HromadaCharts').then(m => m.RegionTrendChart), { ssr: false })

interface RegionSummary {
  region: string
  tender_count: number
  total_amount: number
  avg_amount: number
  avg_bids: number
  buyer_count: number
  risk_medium: number
  risk_high: number
  risk_critical: number
}

interface TopBuyer { edrpou: string; name: string; tender_count: number; total_amount: number }
interface ProcTypeRow { procedure_type: string; tender_count: number; total_amount: number }
interface MonthRow { month: string; tender_count: number; total_amount: number }
interface RegionDetail extends RegionSummary {
  top_buyers: TopBuyer[]
  proc_types: ProcTypeRow[]
  monthly_trend: MonthRow[]
}

const fmt = (n: number) => (n / 1_000_000).toLocaleString('uk-UA', { maximumFractionDigits: 1 }) + ' млн ₴'
const fmtK = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)

function RiskBadge({ label, count, color }: { label: string; count: number; color: string }) {
  if (!count) return null
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>
      {label}: {count}
    </span>
  )
}

function HromadaPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selected = searchParams.get('region')

  const [sortBy, setSortBy] = useState<'total_amount' | 'tender_count' | 'buyer_count' | 'avg_bids'>('total_amount')

  const { data: regions } = useSWR<RegionSummary[]>(
    'hromada-list',
    () => fetch('/api/v1/hromada').then(r => r.json()),
  )

  const { data: detail } = useSWR<RegionDetail>(
    selected ? ['hromada-detail', selected] : null,
    () => fetch(`/api/v1/hromada/${encodeURIComponent(selected!)}`).then(r => r.json()),
  )

  const sorted = regions
    ? [...regions].sort((a, b) => b[sortBy] - a[sortBy])
    : []

  const totalAmount = regions ? regions.reduce((s, r) => s + r.total_amount, 0) : 0

  function selectRegion(region: string) {
    router.push(`/hromada?region=${encodeURIComponent(region)}`)
  }

  function goBack() {
    router.back()
  }

  if (selected && detail) {
    return <RegionDetailView detail={detail} onBack={goBack} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin size={22} className="text-accent" />
          <div>
            <h1 className="text-xl font-bold text-white">Громади</h1>
            <p className="text-xs text-muted">Аналіз державних закупівель по регіонах України</p>
          </div>
        </div>
        {regions && (
          <div className="text-right">
            <p className="text-xs text-muted">Загалом по країні</p>
            <p className="text-lg font-bold text-accent">{fmt(totalAmount)}</p>
          </div>
        )}
      </div>

      {/* Top chart */}
      {regions && regions.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted mb-3">Витрати по регіонах (млн ₴)</p>
          <BarChart data={sorted.slice(0, 20)} onSelect={selectRegion} />
        </div>
      )}

      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted">Сортувати:</span>
        {([
          ['total_amount', 'За сумою'],
          ['tender_count', 'За к-стю'],
          ['buyer_count',  'За замовниками'],
          ['avg_bids',     'За конкуренцією'],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setSortBy(key)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              sortBy === key ? 'border-accent text-accent' : 'border-border text-muted hover:border-white/30'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Region grid */}
      {!regions ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map(r => (
            <button key={r.region} onClick={() => selectRegion(r.region)}
              className="text-left rounded-xl border border-border bg-card p-4 hover:border-accent/50 transition-colors group space-y-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-white group-hover:text-accent transition-colors leading-tight">
                  {r.region}
                </p>
                <ChevronRight size={14} className="text-muted shrink-0 mt-0.5 group-hover:text-accent transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <Stat icon={<TrendingUp size={11} />} label="Сума" value={fmt(r.total_amount)} />
                <Stat icon={<Users size={11} />} label="Замовники" value={fmtK(r.buyer_count)} />
                <Stat label="Тендери" value={fmtK(r.tender_count)} />
                <Stat label="Конкуренція" value={r.avg_bids > 0 ? `${r.avg_bids} уч.` : '—'} />
              </div>
              {(r.risk_medium + r.risk_high + r.risk_critical) > 0 && (
                <div className="flex flex-wrap gap-1">
                  <RiskBadge label="М" count={r.risk_medium}   color="bg-yellow-500/20 text-yellow-400" />
                  <RiskBadge label="В" count={r.risk_high}     color="bg-orange-500/20 text-orange-400" />
                  <RiskBadge label="К" count={r.risk_critical} color="bg-red-500/20 text-red-400" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function HromadaPage() {
  return (
    <Suspense>
      <HromadaPageInner />
    </Suspense>
  )
}

function Stat({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1">
      {icon && <span className="text-muted">{icon}</span>}
      <span className="text-xs text-muted">{label}:</span>
      <span className="text-xs text-white font-medium">{value}</span>
    </div>
  )
}

function RegionDetailView({ detail, onBack }: { detail: RegionDetail; onBack: () => void }) {
  const fmt = (n: number) => (n / 1_000_000).toLocaleString('uk-UA', { maximumFractionDigits: 1 }) + ' млн ₴'

  return (
    <div className="space-y-6">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors">
          <ArrowLeft size={16} /> Регіони
        </button>
        <span className="text-muted">/</span>
        <h1 className="text-xl font-bold text-white">{detail.region}</h1>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Загальна сума',   value: fmt(detail.total_amount),  accent: true },
          { label: 'Тендери',         value: detail.tender_count.toLocaleString('uk-UA') },
          { label: 'Замовники',       value: detail.buyer_count.toLocaleString('uk-UA') },
          { label: 'Середня сума',    value: fmt(detail.avg_amount) },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted">{k.label}</p>
            <p className={`text-lg font-bold mt-1 ${k.accent ? 'text-accent' : 'text-white'}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      {detail.monthly_trend.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted mb-3">Щомісячна динаміка (останні 12 місяців)</p>
          <TrendChart data={detail.monthly_trend} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top buyers */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-sm font-semibold text-white">Топ-10 замовників</p>
          <div className="divide-y divide-border">
            {detail.top_buyers.map((b, i) => (
              <div key={b.edrpou} className="py-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted mb-0.5">#{i + 1} · {b.edrpou}</p>
                  <p className="text-sm text-white truncate">{b.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-white">{fmt(b.total_amount)}</p>
                  <p className="text-xs text-muted">{b.tender_count} тенд.</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Procedure types */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-sm font-semibold text-white">Типи процедур</p>
          <div className="space-y-2">
            {detail.proc_types.map(pt => {
              const pct = detail.tender_count > 0
                ? Math.round(pt.tender_count / detail.tender_count * 100)
                : 0
              return (
                <div key={pt.procedure_type} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted truncate max-w-[60%]">{PROCEDURE_LABELS[pt.procedure_type] ?? pt.procedure_type}</span>
                    <span className="text-white">{pt.tender_count.toLocaleString('uk-UA')} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Risk summary */}
          {(detail.risk_medium + detail.risk_high + detail.risk_critical) > 0 && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted mb-2">Ризикові тендери</p>
              <div className="flex flex-wrap gap-2">
                <RiskBadge label="Середній"   count={detail.risk_medium}   color="bg-yellow-500/20 text-yellow-400" />
                <RiskBadge label="Високий"    count={detail.risk_high}     color="bg-orange-500/20 text-orange-400" />
                <RiskBadge label="Критичний"  count={detail.risk_critical} color="bg-red-500/20 text-red-400" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
