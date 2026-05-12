'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { api, fmtAmount, fmtNumber } from '@/lib/api'
import type { CompanyProfile } from '@/lib/types'
import RiskBadge from '@/components/RiskBadge'
import Link from 'next/link'
import { Search, X, ArrowLeftRight } from 'lucide-react'

/* ── Company search autocomplete ─────────────────────────── */
interface SearchHit { edrpou: string; name: string; region?: string; total_tenders?: number }

function CompanySearch({
  value, onSelect, placeholder,
}: { value: CompanyProfile | null; onSelect: (c: SearchHit | null) => void; placeholder: string }) {
  const [q, setQ]               = useState('')
  const [open, setOpen]         = useState(false)
  const ref                     = useRef<HTMLDivElement>(null)

  const { data } = useSWR<SearchHit[]>(
    q.length >= 2 ? `autocomplete-company-${q}` : null,
    async () => {
      const r = await fetch(
        `/api/v1/search/autocomplete?q=${encodeURIComponent(q)}&type=company`,
      )
      if (!r.ok) return []
      const hits = await r.json()
      // autocomplete повертає [{edrpou, name, type}, ...]
      return (Array.isArray(hits) ? hits : []) as SearchHit[]
    },
    { keepPreviousData: true },
  )

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-accent/50 bg-card px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{value.name}</p>
          <p className="text-xs text-muted mt-0.5">{value.edrpou}{value.region ? ` · ${value.region}` : ''}</p>
        </div>
        <button onClick={() => onSelect(null)} className="ml-3 text-muted hover:text-white shrink-0">
          <X size={16} />
        </button>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 focus-within:border-accent/50">
        <Search size={15} className="text-muted shrink-0" />
        <input
          className="flex-1 bg-transparent text-sm text-white placeholder:text-muted outline-none"
          placeholder={placeholder}
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => q.length >= 2 && setOpen(true)}
          autoComplete="off"
        />
      </div>
      {open && data && data.length > 0 && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-border bg-card shadow-xl overflow-hidden">
          {data.map(hit => (
            <button
              key={hit.edrpou}
              onMouseDown={e => e.preventDefault()}   // не закриваємо при кліку
              onClick={() => { onSelect(hit); setQ(''); setOpen(false) }}
              className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors border-b border-border last:border-0"
            >
              <p className="text-sm text-white truncate">{hit.name}</p>
              <p className="text-xs text-muted">{hit.edrpou}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Comparison table ─────────────────────────────────────── */
type Winner = 'a' | 'b' | 'tie' | null

function better(a: number, b: number, higherIsBetter: boolean): Winner {
  if (a === b) return 'tie'
  return (higherIsBetter ? a > b : a < b) ? 'a' : 'b'
}

function Row({
  label, a, b, winner, format = v => String(v), zeroOk = false,
}: {
  label: string
  a: number | string | null
  b: number | string | null
  winner?: Winner
  format?: (v: number) => string
  zeroOk?: boolean
}) {
  const fmtVal = (v: number | string | null): string =>
    v === null || (!zeroOk && v === 0) ? '—' : typeof v === 'string' ? v : format(v as number)

  const cellCls = (side: 'a' | 'b') =>
    `px-4 py-3 text-sm text-right font-medium ${
      winner === side ? 'text-risk-low' : 'text-white'
    }`

  return (
    <tr className="border-t border-border hover:bg-white/[0.02]">
      <td className="px-4 py-3 text-xs text-muted w-40">{label}</td>
      <td className={cellCls('a')}>{fmtVal(a)}</td>
      <td className={cellCls('b')}>{fmtVal(b)}</td>
    </tr>
  )
}

function CompareTable({ a, b }: { a: CompanyProfile; b: CompanyProfile }) {
  const winRate = (c: CompanyProfile) =>
    c.as_supplier_bids_count > 0
      ? parseFloat(((c.as_supplier_tenders_count / c.as_supplier_bids_count) * 100).toFixed(1))
      : 0

  const isBuyer = a.as_buyer_tenders_count > 0 || b.as_buyer_tenders_count > 0

  const rows: { label: string; va: number; vb: number; higherIsBetter: boolean; fmt?: (v: number) => string; zeroOk?: boolean }[] = [
    ...(isBuyer ? [
      { label: 'Закупівель (замовник)',    va: a.as_buyer_tenders_count,    vb: b.as_buyer_tenders_count,    higherIsBetter: true,  fmt: fmtNumber },
      { label: 'Сума закупівель',         va: a.as_buyer_total_amount,     vb: b.as_buyer_total_amount,     higherIsBetter: true,  fmt: fmtAmount },
      { label: 'Конкуренція (уч./тендер)',va: a.as_buyer_avg_bids,         vb: b.as_buyer_avg_bids,         higherIsBetter: true,  fmt: (v: number) => v.toFixed(1) },
    ] : []),
    { label: 'Участь у тендерах',        va: a.as_supplier_bids_count,    vb: b.as_supplier_bids_count,    higherIsBetter: true,  fmt: fmtNumber },
    { label: 'Перемог (постачальник)',   va: a.as_supplier_tenders_count, vb: b.as_supplier_tenders_count, higherIsBetter: true,  fmt: fmtNumber },
    { label: 'Сума перемог',             va: a.as_supplier_total_amount,  vb: b.as_supplier_total_amount,  higherIsBetter: true,  fmt: fmtAmount },
    { label: 'Win rate',                va: winRate(a),                  vb: winRate(b),                  higherIsBetter: true,  fmt: v => `${v.toFixed(1)}%`, zeroOk: true },
    { label: 'Ризик-скор',              va: a.risk_score,                vb: b.risk_score,                higherIsBetter: false, fmt: v => v.toFixed(2),       zeroOk: true },
    { label: 'Red flags',               va: a.active_flags_count,        vb: b.active_flags_count,        higherIsBetter: false, fmt: fmtNumber,               zeroOk: true },
  ]

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-white/[0.02]">
            <th className="px-4 py-3 text-left text-xs text-muted w-40">Метрика</th>
            <th className="px-4 py-3 text-right">
              <Link href={`/companies/${a.edrpou}`} className="text-sm font-semibold text-accent hover:underline block truncate ml-auto" title={a.name}>
                {a.name_short ?? a.name}
              </Link>
              <span className="text-xs text-muted font-normal">{a.edrpou}</span>
            </th>
            <th className="px-4 py-3 text-right">
              <Link href={`/companies/${b.edrpou}`} className="text-sm font-semibold text-accent hover:underline block truncate ml-auto" title={b.name}>
                {b.name_short ?? b.name}
              </Link>
              <span className="text-xs text-muted font-normal">{b.edrpou}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Базова інфо */}
          <tr className="border-t border-border bg-white/[0.01]">
            <td className="px-4 py-2 text-xs text-muted">Регіон</td>
            <td className="px-4 py-2 text-sm text-white text-right">{a.region ?? '—'}</td>
            <td className="px-4 py-2 text-sm text-white text-right">{b.region ?? '—'}</td>
          </tr>
          <tr className="border-t border-border bg-white/[0.01]">
            <td className="px-4 py-2 text-xs text-muted">Статус</td>
            <td className="px-4 py-2 text-sm text-white text-right">{a.status ?? '—'}</td>
            <td className="px-4 py-2 text-sm text-white text-right">{b.status ?? '—'}</td>
          </tr>
          <tr className="border-t border-border bg-white/[0.01]">
            <td className="px-4 py-2 text-xs text-muted">Реєстрація</td>
            <td className="px-4 py-2 text-sm text-white text-right">{a.registration_date ? a.registration_date.slice(0, 10) : '—'}</td>
            <td className="px-4 py-2 text-sm text-white text-right">{b.registration_date ? b.registration_date.slice(0, 10) : '—'}</td>
          </tr>
          <tr className="border-t border-border bg-white/[0.01]">
            <td className="px-4 py-2 text-xs text-muted">Ризик-рівень</td>
            <td className="px-4 py-2 text-right"><div className="flex justify-end"><RiskBadge level={a.risk_level} size="sm" /></div></td>
            <td className="px-4 py-2 text-right"><div className="flex justify-end"><RiskBadge level={b.risk_level} size="sm" /></div></td>
          </tr>

          {/* Числові метрики */}
          {rows.map(r => (
            <Row
              key={r.label}
              label={r.label}
              a={r.va}
              b={r.vb}
              winner={r.va === 0 && r.vb === 0 && !r.zeroOk ? null : better(r.va, r.vb, r.higherIsBetter)}
              format={r.fmt}
              zeroOk={r.zeroOk}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────── */
export default function ComparePage() {
  const router       = useRouter()
  const params       = useSearchParams()
  const [edrpouA, setEdrpouA] = useState<string | null>(params.get('a'))
  const [edrpouB, setEdrpouB] = useState<string | null>(params.get('b'))

  const { data: compA, isLoading: loadA } = useSWR(
    edrpouA ? `compare-company-${edrpouA}` : null,
    () => api.companies.get(edrpouA!),
  )
  const { data: compB, isLoading: loadB } = useSWR(
    edrpouB ? `compare-company-${edrpouB}` : null,
    () => api.companies.get(edrpouB!),
  )

  // Sync URL
  useEffect(() => {
    const sp = new URLSearchParams()
    if (edrpouA) sp.set('a', edrpouA)
    if (edrpouB) sp.set('b', edrpouB)
    const qs = sp.toString()
    router.replace(qs ? `/compare?${qs}` : '/compare', { scroll: false })
  }, [edrpouA, edrpouB])

  const handleSwap = () => {
    setEdrpouA(edrpouB)
    setEdrpouB(edrpouA)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Порівняння компаній</h1>

      {/* Search row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] items-center">
        <CompanySearch
          value={compA ?? null}
          onSelect={hit => setEdrpouA(hit?.edrpou ?? null)}
          placeholder="Пошук першої компанії…"
        />
        <button
          onClick={handleSwap}
          disabled={!edrpouA && !edrpouB}
          className="p-2 rounded-lg border border-border text-muted hover:text-white hover:border-white/30 transition-colors disabled:opacity-30 mx-auto"
          title="Поміняти місцями"
        >
          <ArrowLeftRight size={16} />
        </button>
        <CompanySearch
          value={compB ?? null}
          onSelect={hit => setEdrpouB(hit?.edrpou ?? null)}
          placeholder="Пошук другої компанії…"
        />
      </div>

      {/* Loading */}
      {(loadA || loadB) && (
        <div className="h-64 rounded-xl bg-card animate-pulse" />
      )}

      {/* Comparison table */}
      {compA && compB && !loadA && !loadB && (
        <CompareTable a={compA} b={compB} />
      )}

      {/* Hint */}
      {!edrpouA && !edrpouB && (
        <div className="py-16 text-center text-muted text-sm">
          Оберіть дві компанії для порівняння
        </div>
      )}
    </div>
  )
}
