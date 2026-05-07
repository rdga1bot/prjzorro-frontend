import { api, fmtAmount, PROCEDURE_LABELS } from '@/lib/api'
import TrendSection from '@/components/charts/TrendSection'
import TendersByRegion from '@/components/charts/TendersByRegion'
import RiskDistribution from '@/components/charts/RiskDistribution'
import Link from 'next/link'

export const revalidate = 300

export default async function AnalyticsPage() {
  let stats
  try {
    stats = await api.stats.dashboard()
  } catch {
    return (
      <div className="py-20 text-center text-muted">
        Сервіс тимчасово недоступний
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-white">Аналітика</h1>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrendSection />
        </div>
        <RiskDistribution data={stats.risk_distribution} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TendersByRegion data={stats.by_region} />

        {/* По типу процедури */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium text-muted">По типу процедури</h3>
          <div className="space-y-2">
            {stats.by_procedure_type.map(p => (
              <div key={p.procedure_type} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white">{PROCEDURE_LABELS[p.procedure_type] ?? p.procedure_type}</span>
                    <span className="text-muted">{p.count.toLocaleString('uk-UA')}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${(p.count / stats.total_tenders * 100).toFixed(1)}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-muted w-28 text-right shrink-0">
                  {fmtAmount(p.total_amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Топ таблиці */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Топ замовники */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-medium text-white">Топ замовники</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left text-xs text-muted">#</th>
                <th className="px-4 py-2 text-left text-xs text-muted">Компанія</th>
                <th className="px-4 py-2 text-right text-xs text-muted">Сума</th>
              </tr>
            </thead>
            <tbody>
              {stats.top_buyers.map((b, i) => (
                <tr key={b.edrpou} className="border-t border-border hover:bg-white/5">
                  <td className="px-4 py-2.5 text-muted text-xs">{i + 1}</td>
                  <td className="px-4 py-2.5">
                    <Link href={`/companies/${b.edrpou}`} className="text-white hover:text-accent truncate block max-w-[200px]">
                      {b.name}
                    </Link>
                    <span className="text-xs text-muted">{b.tenders_count} тендерів</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm">
                    {fmtAmount(b.total_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Топ постачальники */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-medium text-white">Топ постачальники</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left text-xs text-muted">#</th>
                <th className="px-4 py-2 text-left text-xs text-muted">Компанія</th>
                <th className="px-4 py-2 text-right text-xs text-muted">Сума / Win</th>
              </tr>
            </thead>
            <tbody>
              {stats.top_suppliers.map((s, i) => (
                <tr key={s.edrpou} className="border-t border-border hover:bg-white/5">
                  <td className="px-4 py-2.5 text-muted text-xs">{i + 1}</td>
                  <td className="px-4 py-2.5">
                    <Link href={`/companies/${s.edrpou}`} className="text-white hover:text-accent truncate block max-w-[200px]">
                      {s.name}
                    </Link>
                    <span className="text-xs text-muted">{s.tenders_count} перемог</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="font-mono text-sm">{fmtAmount(s.total_amount)}</div>
                    <div className="text-xs text-risk-low">{s.win_rate_pct}% win rate</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
