'use client'
import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { api, fmtAmount, fmtNumber, fmtDate } from '@/lib/api'
import RiskBadge from '@/components/RiskBadge'
import TenderTable from '@/components/TenderTable'
import CompanyNetwork from '@/components/CompanyNetwork'
import { useRouter } from 'next/navigation'
import { Building2, TrendingUp, ShoppingCart, Network, Landmark, ArrowLeftRight } from 'lucide-react'
import Link from 'next/link'

interface Props { params: { edrpou: string } }

type Tab = 'buyer' | 'participant' | 'supplier' | 'network'

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  )
}

export default function CompanyPage({ params }: Props) {
  const [tab, setTab] = useState<Tab>('participant')
  const [page, setPage] = useState(1)
  const router          = useRouter()

  const { data: company, isLoading: loadingCompany } = useSWR(
    `company-${params.edrpou}`,
    () => api.companies.get(params.edrpou),
  )

  const { data: tenders, isLoading: loadingTenders } = useSWR(
    tab !== 'network' ? ['company-tenders', params.edrpou, tab, page] : null,
    () => api.companies.tenders(params.edrpou, tab, page, 20),
  )

  const { data: network, isLoading: loadingNetwork } = useSWR(
    tab === 'network' ? `network-${params.edrpou}` : null,
    () => api.companies.network(params.edrpou, 2),
  )

  // Автоматично відкрити вкладку "Як замовник" для держорганів без ролі постачальника
  useEffect(() => {
    if (company && company.as_buyer_tenders_count > 0 && !company.as_supplier_bids_count) {
      setTab('buyer')
    }
  }, [company])

  if (loadingCompany) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-64 rounded bg-border" />
        <div className="h-40 rounded-xl bg-card" />
      </div>
    )
  }

  if (!company) {
    return (
      <div className="py-20 text-center text-muted">
        Компанію не знайдено
      </div>
    )
  }

  const isBuyer = company.as_buyer_tenders_count > 0

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    ...(isBuyer ? [{ key: 'buyer' as Tab, label: 'Як Замовник', icon: <Landmark size={15} /> }] : []),
    { key: 'participant', label: 'Як Учасник',    icon: <ShoppingCart size={15} /> },
    { key: 'supplier', label: 'Як Постачальник',  icon: <TrendingUp size={15} /> },
    { key: 'network',  label: 'Граф зв\'язків',  icon: <Network size={15} /> },
  ]

  return (
    <div className="space-y-5">

      {/* Breadcrumb */}
      <nav className="text-xs text-muted flex gap-2">
        <span className="hover:text-white cursor-pointer" onClick={() => router.push('/')}>Головна</span>
        <span>/</span>
        <span>Компанії</span>
        <span>/</span>
        <span className="text-white">{params.edrpou}</span>
      </nav>

      {/* Profile header */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-accent/10 p-3">
              <Building2 size={24} className="text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{company.name}</h1>
              <p className="text-sm text-muted mt-0.5">
                ЄДРПОУ: {company.edrpou}
                {company.region      && ` · ${company.region}`}
                {company.legal_form  && ` · ${company.legal_form}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/compare?a=${company.edrpou}`}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:text-white hover:border-white/30 transition-colors"
            >
              <ArrowLeftRight size={13} /> Порівняти
            </Link>
            <RiskBadge level={company.risk_level} score={company.risk_score} />
          </div>
        </div>

        {/* Деталі */}
        {(company.director_name || company.status || company.registration_date) && (
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
            {company.status           && <span>Статус: <b className="text-white">{company.status}</b></span>}
            {company.director_name    && <span>Директор: <b className="text-white">{company.director_name}</b></span>}
            {company.registration_date && <span>Реєстрація: <b className="text-white">{fmtDate(company.registration_date)}</b></span>}
            {company.last_enriched_at  && <span>Оновлено: <b className="text-white">{fmtDate(company.last_enriched_at)}</b></span>}
          </div>
        )}

        {/* Засновники */}
        {company.founders && company.founders.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-muted mb-1.5">Засновники</p>
            <div className="flex flex-wrap gap-2">
              {company.founders.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2.5 py-1 text-xs text-white">
                  {f.edrpou
                    ? <span
                        className="cursor-pointer hover:text-accent"
                        onClick={() => router.push(`/companies/${f.edrpou}`)}
                      >{f.name}</span>
                    : f.name}
                  {f.share != null && <span className="text-muted ml-1">{f.share}%</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {company.as_buyer_tenders_count > 0 ? (
            <StatBox
              label="Закупівель (замовник)"
              value={fmtNumber(company.as_buyer_tenders_count)}
              sub={fmtAmount(company.as_buyer_total_amount)}
            />
          ) : (
            <StatBox
              label="Участь у тендерах"
              value={fmtNumber(company.as_supplier_bids_count)}
              sub="подано заявок"
            />
          )}
          <StatBox
            label="Перемог (постачальник)"
            value={fmtNumber(company.as_supplier_tenders_count)}
            sub={fmtAmount(company.as_supplier_total_amount)}
          />
          {company.as_buyer_tenders_count > 0 && company.as_buyer_avg_bids > 0 ? (
            <StatBox
              label="Конкуренція"
              value={`${company.as_buyer_avg_bids.toFixed(1)} уч./тендер`}
              sub="середня кількість учасників"
            />
          ) : (
            <StatBox
              label="Win rate"
              value={company.as_supplier_bids_count > 0
                ? `${((company.as_supplier_tenders_count / company.as_supplier_bids_count) * 100).toFixed(1)}%`
                : '—'}
              sub="від поданих заявок"
            />
          )}
          <StatBox
            label="Red flags"
            value={String(company.active_flags_count)}
            sub={company.risk_level ?? '—'}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1) }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px
              ${tab === t.key
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-white'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab !== 'network' ? (
        <TenderTable
          items={tenders?.items ?? []}
          total={tenders?.total ?? 0}
          page={page}
          perPage={20}
          pages={tenders?.pages ?? 0}
          onPageChange={setPage}
          onSort={() => {}}
          loading={loadingTenders}
        />
      ) : (
        <div>
          {loadingNetwork
            ? <div className="h-[420px] rounded-xl bg-card animate-pulse" />
            : <CompanyNetwork
                data={network ?? { nodes: [], edges: [], total_nodes: 0 }}
                onSelect={edrpou => router.push(`/companies/${edrpou}`)}
              />
          }
        </div>
      )}
    </div>
  )
}
