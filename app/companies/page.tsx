'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { api, fmtAmount, fmtNumber, buildQuery } from '@/lib/api'
import RiskBadge from '@/components/RiskBadge'
import Link from 'next/link'
import { Search } from 'lucide-react'

export default function CompaniesPage() {
  const [q, setQ] = useState('')

  const { data, isLoading } = useSWR(
    ['company-search', q],
    () => q.length >= 2
      ? api.search.query(q, 'company')
      : null,
    { keepPreviousData: true },
  )

  const companies = data?.companies ?? []

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-white">Компанії</h1>

      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 focus-within:border-accent transition-colors max-w-lg">
        <Search size={18} className="text-muted shrink-0" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Назва компанії або ЄДРПОУ..."
          className="flex-1 bg-transparent text-white placeholder:text-muted outline-none text-sm"
        />
      </div>

      {q.length < 2 && (
        <p className="text-sm text-muted">Введіть мінімум 2 символи для пошуку</p>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && companies.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted">Компанія</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted w-32">ЄДРПОУ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted w-36">Закупівлі</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted w-28">Ризик</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(c => (
                <tr key={c.edrpou} className="border-t border-border hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/companies/${c.edrpou}`} className="text-white hover:text-accent font-medium">
                      {c.name}
                    </Link>
                    {c.region && <p className="text-xs text-muted">{c.region}</p>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{c.edrpou}</td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {fmtNumber(c.as_buyer_tenders_count + c.as_supplier_tenders_count)} тендерів
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge level={c.risk_level} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && q.length >= 2 && companies.length === 0 && (
        <p className="text-sm text-muted">Нічого не знайдено</p>
      )}
    </div>
  )
}
