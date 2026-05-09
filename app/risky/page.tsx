import { fmtNumber, FLAG_LABELS } from '@/lib/api'
import Link from 'next/link'
import RiskLeaderTable from '@/components/RiskLeaderTable'

export const dynamic = 'force-dynamic'

async function getRiskLeaders() {
  try {
    const BASE = process.env.API_URL ?? 'http://api:8000'
    const res = await fetch(`${BASE}/api/v1/stats/risk-leaders?limit=20`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}


export default async function RiskyPage() {
  const data = await getRiskLeaders()

  if (!data) {
    return <div className="py-20 text-center text-muted">Сервіс тимчасово недоступний</div>
  }

  const totalFlags = data.flag_stats.reduce((s: number, f: any) => s + f.count, 0)

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-white">Топ ризиків</h1>

      {/* Flag distribution */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-medium text-muted mb-4">Розподіл по типах порушень</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data.flag_stats.map((f: any) => {
            const pct = totalFlags ? (f.count / totalFlags * 100).toFixed(1) : 0
            return (
              <Link
                key={f.flag_type}
                href={`/tenders?flag_type=${f.flag_type}`}
                className="flex items-center justify-between rounded-lg border border-border bg-bg/40 px-3 py-2 hover:border-accent/50 transition-colors"
              >
                <span className="text-sm text-white">{FLAG_LABELS[f.flag_type] ?? f.flag_type}</span>
                <span className="text-xs text-muted ml-2 shrink-0">{fmtNumber(f.count)} ({pct}%)</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Top buyers / suppliers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-white">Замовники з найвищим ризиком</h2>
            <p className="text-xs text-muted mt-0.5">≥5 тендерів, сортування по середньому скору</p>
          </div>
          <RiskLeaderTable rows={data.top_buyers} role="buyer" />
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-white">Постачальники з найвищим ризиком</h2>
            <p className="text-xs text-muted mt-0.5">≥3 перемоги, сортування по середньому скору</p>
          </div>
          <RiskLeaderTable rows={data.top_suppliers} role="supplier" />
        </div>
      </div>
    </div>
  )
}
