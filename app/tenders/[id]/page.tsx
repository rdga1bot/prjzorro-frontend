import { api, fmtAmount, fmtDate, PROCEDURE_LABELS, STATUS_LABELS, type SpendingData } from '@/lib/api'
import type { BenchmarkData } from '@/lib/types'
import RiskBadge from '@/components/RiskBadge'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, Users, Building2, TrendingUp } from 'lucide-react'

export const revalidate = 300

interface Props { params: { id: string } }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 text-sm font-semibold text-muted uppercase tracking-wide">{title}</h2>
      {children}
    </section>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-white">{value ?? '—'}</dd>
    </div>
  )
}

function BenchmarkSection({ b }: { b: BenchmarkData }) {
  if (b.count === 0 || !b.avg_amount) return null

  const current = b.current_amount
  const min     = b.min_amount ?? 0
  const max     = b.max_amount ?? current
  const range   = max - min || 1
  const pct     = Math.min(100, Math.max(0, ((current - min) / range) * 100))
  const dev     = b.deviation_pct
  const devText = dev === null ? null : dev > 0 ? `+${dev}%` : `${dev}%`
  const devColor = dev === null ? 'text-muted'
    : dev > 20  ? 'text-risk-high'
    : dev > 0   ? 'text-risk-medium'
    : 'text-risk-low'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Мінімальна', value: fmtAmount(b.min_amount) },
          { label: 'Медіана',    value: fmtAmount(b.median) },
          { label: 'Середня',   value: fmtAmount(b.avg_amount) },
          { label: 'Максимальна', value: fmtAmount(b.max_amount) },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-border bg-bg p-3">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="mt-1 text-sm font-semibold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Position bar */}
      <div>
        <div className="flex justify-between text-xs text-muted mb-1">
          <span>Поточна ціна: <b className="text-white">{fmtAmount(current)}</b></span>
          {devText && <span className={`font-semibold ${devColor}`}>{devText} від середньої</span>}
        </div>
        <div className="relative h-2 rounded-full bg-border">
          <div className="h-full rounded-full bg-accent/30"
               style={{ width: `${Math.min(100, ((b.p75 ?? max) - min) / range * 100)}%`,
                        marginLeft: `${Math.max(0, ((b.p25 ?? min) - min) / range * 100)}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-accent border-2 border-bg"
               style={{ left: `calc(${pct}% - 6px)` }} />
        </div>
        <div className="flex justify-between text-xs text-muted mt-1">
          <span>{fmtAmount(min)}</span>
          <span className="text-muted">На основі {b.count} схожих тендерів</span>
          <span>{fmtAmount(max)}</span>
        </div>
      </div>
    </div>
  )
}

function SpendingSection({ s }: { s: SpendingData }) {
  if (s.data_status === 'not_fetched') {
    return (
      <p className="text-xs text-muted">
        Дані Spending.gov.ua ще не завантажені для цього тендера.
      </p>
    )
  }

  const pct = s.execution_rate != null ? Math.min(s.execution_rate * 100, 100) : 0
  const barColor =
    pct >= 100 ? 'bg-risk-low' :
    pct >= 50  ? 'bg-yellow-500' :
                 'bg-risk-high'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <div>
          <span className="text-muted text-xs">Заплановано</span>
          <p className="font-mono font-semibold text-white">{fmtAmount(s.planned_amount)}</p>
        </div>
        <div className="text-right">
          <span className="text-muted text-xs">Сплачено</span>
          <p className="font-mono font-semibold text-white">{fmtAmount(s.paid_amount)}</p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted">
          <span>Виконання договору</span>
          <span>{s.execution_rate != null ? `${(s.execution_rate * 100).toFixed(1)}%` : '—'}</span>
        </div>
        <div className="h-2 rounded-full bg-border overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {s.transactions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="pb-2 text-left font-medium">Дата</th>
                <th className="pb-2 text-left font-medium">Документ</th>
                <th className="pb-2 text-right font-medium">Сума</th>
                <th className="pb-2 text-left font-medium">Постачальник</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {s.transactions.map((tx, i) => (
                <tr key={i} className="text-white">
                  <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(tx.date)}</td>
                  <td className="py-2 pr-3 font-mono text-muted">{tx.doc_number}</td>
                  <td className="py-2 pr-3 text-right font-mono">{fmtAmount(tx.amount, tx.currency)}</td>
                  <td className="py-2">
                    {tx.supplier_edrpou
                      ? <Link href={`/companies/${tx.supplier_edrpou}`} className="text-accent hover:underline">{tx.supplier_edrpou}</Link>
                      : <span className="text-muted">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {s.last_fetched && (
        <p className="text-xs text-muted">Дані оновлено: {fmtDate(s.last_fetched)}</p>
      )}
    </div>
  )
}

export default async function TenderPage({ params }: Props) {
  let tender
  let spending: SpendingData | null = null
  let benchmark: BenchmarkData | null = null
  try {
    ;[tender, spending, benchmark] = await Promise.all([
      api.tenders.get(params.id),
      api.tenders.spending(params.id).catch(() => null),
      api.tenders.benchmark(params.id).catch(() => null),
    ])
  } catch {
    notFound()
  }

  return (
    <div className="space-y-5">

      {/* Breadcrumb */}
      <nav className="text-xs text-muted flex gap-2">
        <Link href="/" className="hover:text-white">Головна</Link>
        <span>/</span>
        <Link href="/tenders" className="hover:text-white">Тендери</Link>
        <span>/</span>
        <span className="text-white">{tender.tender_id}</span>
      </nav>

      {/* Заголовок */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted mb-1">{tender.tender_id}</p>
            <h1 className="text-xl font-bold text-white leading-snug">{tender.title}</h1>
          </div>
          <RiskBadge level={tender.risk_level} score={tender.risk_score} flags={tender.risk_flags} />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-4 lg:grid-cols-4">
          <Field label="Сума" value={
            <span className="text-lg font-bold font-mono">
              {fmtAmount(tender.value_amount, tender.value_currency)}
              {tender.value_vat_included && <span className="ml-1 text-xs text-muted font-normal">з ПДВ</span>}
            </span>
          } />
          <Field label="Статус"    value={STATUS_LABELS[tender.status] ?? tender.status} />
          <Field label="Процедура" value={PROCEDURE_LABELS[tender.procedure_type ?? ''] ?? tender.procedure_type} />
          <Field label="Учасників" value={tender.bids_count} />
          <Field label="Прийом заявок" value={
            tender.tender_period_start
              ? `${fmtDate(tender.tender_period_start)} — ${fmtDate(tender.tender_period_end)}`
              : null
          } />
          <Field label="Дата публікації" value={fmtDate(tender.date_created)} />
          <Field label="Оновлено"        value={fmtDate(tender.date_modified)} />
        </dl>
      </div>

      {/* Замовник */}
      {tender.procuring_entity_name && (
        <Section title="Замовник">
          <div className="flex items-center gap-3">
            <Building2 size={32} className="text-muted shrink-0" />
            <div>
              <Link
                href={`/companies/${tender.procuring_entity_edrpou}`}
                className="text-base font-semibold text-white hover:text-accent transition-colors"
              >
                {tender.procuring_entity_name}
              </Link>
              {tender.procuring_entity_edrpou && (
                <p className="text-xs text-muted mt-0.5">
                  ЄДРПОУ: {tender.procuring_entity_edrpou}
                  {tender.procuring_entity_region && ` · ${tender.procuring_entity_region}`}
                  {tender.procuring_entity_kind && ` · ${tender.procuring_entity_kind}`}
                </p>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* Red flags */}
      {tender.risk_flags.length > 0 && (
        <Section title="Red flags">
          <div className="space-y-3">
            {tender.risk_flags.map((flag, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
                <AlertTriangle size={16} className={
                  flag.severity === 'critical' ? 'text-risk-critical' :
                  flag.severity === 'high'     ? 'text-risk-high' :
                  flag.severity === 'medium'   ? 'text-risk-medium' : 'text-risk-low'
                } />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{flag.description}</span>
                    <RiskBadge level={flag.severity} size="sm" />
                  </div>
                  {flag.evidence && Object.keys(flag.evidence).length > 0 && (
                    <pre className="mt-1 text-xs text-muted">
                      {JSON.stringify(flag.evidence, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Ціновий бенчмарк */}
      {benchmark && benchmark.count > 0 && (
        <Section title="Ціновий бенчмарк">
          <BenchmarkSection b={benchmark} />
        </Section>
      )}

      {/* Виконання договору */}
      {spending && (
        <Section title="Виконання договору (Spending.gov.ua)">
          <SpendingSection s={spending} />
        </Section>
      )}

      {/* Учасники */}
      {tender.bids.length > 0 && (
        <Section title={`Учасники (${tender.bids.length})`}>
          <div className="space-y-2">
            {tender.bids.map(bid => {
              const isWinner = tender.awards.some(
                a => a.supplier_edrpou === bid.bidder_edrpou && a.status === 'active'
              )
              return (
                <div key={bid.id} className={`flex items-center justify-between rounded-lg p-3 border
                  ${isWinner ? 'border-risk-low/40 bg-risk-low/5' : 'border-border'}`}>
                  <div className="flex items-center gap-3">
                    <Users size={16} className="text-muted" />
                    <div>
                      {bid.bidder_edrpou
                        ? <Link href={`/companies/${bid.bidder_edrpou}`} className="text-sm text-white hover:text-accent">
                            {bid.bidder_name ?? bid.bidder_edrpou}
                          </Link>
                        : <span className="text-sm text-white">{bid.bidder_name ?? '—'}</span>
                      }
                      <p className="text-xs text-muted">
                        {bid.status} · {fmtDate(bid.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-white">{fmtAmount(bid.value_amount)}</p>
                    {isWinner && <span className="text-xs text-risk-low">Переможець</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      )}
    </div>
  )
}
