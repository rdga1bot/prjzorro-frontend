import { api, fmtAmount, fmtNumber, FLAG_LABELS } from '@/lib/api'
import Link from 'next/link'
import RiskBadge from '@/components/RiskBadge'

export const revalidate = 300

async function getRiskLeaders() {
  try {
    const BASE = process.env.API_URL ?? 'http://api:8000'
    const res = await fetch(`${BASE}/api/v1/stats/risk-leaders?limit=20`, { next: { revalidate: 300 } })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color = pct >= 70 ? 'bg-risk-critical' : pct >= 50 ? 'bg-risk-high' : pct >= 30 ? 'bg-risk-medium' : 'bg-risk-low'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 rounded-full bg-border overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted w-8">{pct}%</span>
    </div>
  )
}

function EntityTable({ rows, role }: { rows: any[]; role: 'buyer' | 'supplier' }) {
  const path = role === 'buyer' ? 'tenders?buyer_edrpou' : 'companies'
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="px-4 py-2 text-xs text-muted font-medium">Назва</th>
            <th className="px-4 py-2 text-xs text-muted font-medium w-20 text-right">Тендерів</th>
            <th className="px-4 py-2 text-xs text-muted font-medium w-20 text-right">Вис. ризик</th>
            <th className="px-4 py-2 text-xs text-muted font-medium w-36">Серед. ризик</th>
            <th className="px-4 py-2 text-xs text-muted font-medium w-32 text-right">Сума</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.edrpou} className="border-t border-border hover:bg-white/5 transition-colors">
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-muted text-xs w-5 shrink-0">{i + 1}</span>
                  <div>
                    <Link
                      href={role === 'buyer' ? `/tenders?buyer_edrpou=${r.edrpou}` : `/companies/${r.edrpou}`}
                      className="text-white hover:text-accent transition-colors line-clamp-1"
                    >
                      {r.name || r.edrpou}
                    </Link>
                    <span className="text-xs text-muted">{r.edrpou}</span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-2.5 text-right text-muted">{fmtNumber(r.tender_count)}</td>
              <td className="px-4 py-2.5 text-right">
                <span className="text-risk-high font-medium">{fmtNumber(r.high_risk_count)}</span>
              </td>
              <td className="px-4 py-2.5"><ScoreBar score={parseFloat(r.avg_risk_score)} /></td>
              <td className="px-4 py-2.5 text-right text-muted text-xs">{fmtAmount(r.total_amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
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
          <EntityTable rows={data.top_buyers} role="buyer" />
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-white">Постачальники з найвищим ризиком</h2>
            <p className="text-xs text-muted mt-0.5">≥3 перемоги, сортування по середньому скору</p>
          </div>
          <EntityTable rows={data.top_suppliers} role="supplier" />
        </div>
      </div>
    </div>
  )
}
