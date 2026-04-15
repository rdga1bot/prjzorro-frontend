'use client'
import { useState, useCallback } from 'react'
import useSWR from 'swr'
import { api, fmtAmount } from '@/lib/api'
import type { TenderFilters } from '@/lib/api'
import TenderTable from '@/components/TenderTable'
import SearchBar from '@/components/SearchBar'
import { Filter, X } from 'lucide-react'

const RISK_OPTIONS = ['low', 'medium', 'high', 'critical']
const STATUS_OPTIONS = ['active', 'complete', 'cancelled', 'unsuccessful']

function Select({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-white focus:border-accent outline-none"
      >
        <option value="">Всі</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

export default function TendersPage() {
  const [filters, setFilters] = useState<TenderFilters>({
    page: 1, per_page: 20, sort_by: 'date_created', sort_order: 'desc',
  })
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading } = useSWR(
    ['tenders', filters],
    () => api.tenders.list(filters),
    { keepPreviousData: true },
  )

  const set = useCallback((patch: Partial<TenderFilters>) => {
    setFilters(prev => ({ ...prev, ...patch, page: 1 }))
  }, [])

  const handleSort = (col: string) => {
    setFilters(prev => ({
      ...prev,
      sort_by:    col,
      sort_order: prev.sort_by === col && prev.sort_order === 'desc' ? 'asc' : 'desc',
    }))
  }

  const activeFilterCount = [
    filters.status, filters.risk_level, filters.region,
    filters.amount_min, filters.amount_max, filters.cpv_code,
  ].filter(Boolean).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Тендери</h1>
        {data && <span className="text-sm text-muted">{data.total.toLocaleString('uk-UA')} знайдено</span>}
      </div>

      {/* Search + Filter toggle */}
      <div className="flex gap-3 items-center">
        <div className="flex-1">
          <SearchBar placeholder="Пошук по назві, ЄДРПОУ..." />
        </div>
        <button
          onClick={() => setShowFilters(s => !s)}
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-colors
            ${showFilters ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-card text-muted hover:text-white'}`}
        >
          <Filter size={16} />
          Фільтри
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-accent px-1.5 py-0.5 text-xs text-white">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-card p-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Select label="Статус"     value={filters.status ?? ''}     options={STATUS_OPTIONS} onChange={v => set({ status: v || undefined })} />
          <Select label="Рівень ризику" value={filters.risk_level ?? ''} options={RISK_OPTIONS}  onChange={v => set({ risk_level: v || undefined })} />

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">Регіон</label>
            <input
              value={filters.region ?? ''}
              onChange={e => set({ region: e.target.value || undefined })}
              placeholder="Київ"
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:border-accent outline-none placeholder:text-muted"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">CPV код</label>
            <input
              value={filters.cpv_code ?? ''}
              onChange={e => set({ cpv_code: e.target.value || undefined })}
              placeholder="45000000"
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:border-accent outline-none placeholder:text-muted"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">Сума від (UAH)</label>
            <input
              type="number"
              value={filters.amount_min ?? ''}
              onChange={e => set({ amount_min: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="0"
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:border-accent outline-none placeholder:text-muted"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">Сума до (UAH)</label>
            <input
              type="number"
              value={filters.amount_max ?? ''}
              onChange={e => set({ amount_max: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="∞"
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:border-accent outline-none placeholder:text-muted"
            />
          </div>

          {activeFilterCount > 0 && (
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ page: 1, per_page: 20, sort_by: 'date_created', sort_order: 'desc' })}
                className="flex items-center gap-1.5 text-sm text-muted hover:text-white"
              >
                <X size={14} /> Скинути фільтри
              </button>
            </div>
          )}
        </div>
      )}

      <TenderTable
        items={data?.items ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        perPage={filters.per_page ?? 20}
        pages={data?.pages ?? 0}
        sortBy={filters.sort_by}
        sortOrder={filters.sort_order}
        onPageChange={p => setFilters(f => ({ ...f, page: p }))}
        onSort={handleSort}
        loading={isLoading}
      />
    </div>
  )
}
