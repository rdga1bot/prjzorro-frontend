import { api } from '@/lib/api'
import StatsCards from '@/components/StatsCards'
import SearchBar from '@/components/SearchBar'
import SpendingTrend from '@/components/charts/SpendingTrend'
import TendersByRegion from '@/components/charts/TendersByRegion'
import RiskDistribution from '@/components/charts/RiskDistribution'
import Link from 'next/link'
import { fmtAmount, fmtDate } from '@/lib/api'
import RiskBadge from '@/components/RiskBadge'

// Server Component — дані завантажуються на сервері
export const dynamic = 'force-dynamic'

async function getDashboard() {
  try {
    return await api.stats.dashboard()
  } catch {
    return null
  }
}

async function getRecentTenders() {
  try {
    const r = await api.tenders.list({ per_page: 10, sort_by: 'date_created', sort_order: 'desc' })
    return r.items
  } catch {
    return []
  }
}

export default async function HomePage() {
  const [stats, recentTenders] = await Promise.all([getDashboard(), getRecentTenders()])

  return (
    <div className="space-y-8">

      {/* Hero + Search */}
      <section className="text-center py-10">
        <h1 className="text-3xl font-bold text-white mb-2">
          Аналітика державних тендерів України
        </h1>
        <p className="text-muted mb-8">
          Моніторинг Prozorro · Red flags · Графи зв&apos;язків компаній
        </p>
        <div className="flex justify-center">
          <SearchBar />
        </div>
      </section>

      {/* KPI Cards */}
      {stats && <StatsCards stats={stats} />}

      {/* Charts row */}
      {stats && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SpendingTrend data={stats.trend_30d} />
          </div>
          <RiskDistribution data={stats.risk_distribution} />
        </div>
      )}

      {stats && (
        <div className="grid gap-4 lg:grid-cols-2">
          <TendersByRegion data={stats.by_region} />

          {/* Топ постачальники */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-medium text-muted">Топ постачальники</h3>
            <div className="space-y-2">
              {stats.top_suppliers.slice(0, 5).map((s, i) => (
                <Link
                  key={s.edrpou}
                  href={`/companies/${s.edrpou}`}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/5 transition-colors"
                >
                  <span className="w-5 text-xs text-muted text-right">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{s.name}</p>
                    <p className="text-xs text-muted">{s.tenders_count} перемог · {s.win_rate_pct}%</p>
                  </div>
                  <span className="text-sm font-mono text-accent shrink-0">
                    {fmtAmount(s.total_amount)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Останні тендери */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">Останні тендери</h2>
          <Link href="/tenders" className="text-sm text-accent hover:underline">
            Всі тендери →
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted">Тендер</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted w-36 hidden sm:table-cell">Сума</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted w-28">Ризик</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted w-28 hidden sm:table-cell">Дата</th>
                </tr>
              </thead>
              <tbody>
                {recentTenders.map(t => (
                  <tr key={t.id} className="border-t border-border hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/tenders/${t.tender_id}`}>
                        <p className="text-white hover:text-accent line-clamp-2">{t.title}</p>
                        <p className="text-xs text-muted mt-0.5">{t.procuring_entity_name}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm hidden sm:table-cell">{fmtAmount(t.value_amount)}</td>
                    <td className="px-4 py-3"><RiskBadge level={t.risk_level} size="sm" /></td>
                    <td className="px-4 py-3 text-xs text-muted hidden sm:table-cell">{fmtDate(t.date_created)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
