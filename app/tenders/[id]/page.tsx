import { api, fmtAmount, fmtDate, PROCEDURE_LABELS, STATUS_LABELS } from '@/lib/api'
import RiskBadge from '@/components/RiskBadge'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, Users, Award, Calendar, Building2 } from 'lucide-react'

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

export default async function TenderPage({ params }: Props) {
  let tender
  try {
    tender = await api.tenders.get(params.id)
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
