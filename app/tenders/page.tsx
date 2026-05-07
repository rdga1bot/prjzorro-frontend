'use client'
import { useState, useCallback } from 'react'
import useSWR from 'swr'
import { api, exportUrl, FLAG_LABELS, PROCEDURE_LABELS } from '@/lib/api'
import type { TenderFilters } from '@/lib/api'
import TenderTable from '@/components/TenderTable'
import SearchBar from '@/components/SearchBar'
import { Filter, X, Download } from 'lucide-react'

const RISK_OPTIONS      = ['low', 'medium', 'high', 'critical']
const RISK_LABELS: Record<string,string> = { low:'Низький', medium:'Середній', high:'Високий', critical:'Критичний' }
const STATUS_OPTIONS    = ['active', 'complete', 'cancelled', 'unsuccessful']
const STATUS_LABELS: Record<string,string> = { active:'Активний', complete:'Завершено', cancelled:'Скасовано', unsuccessful:'Не відбувся' }
const PROCEDURE_OPTIONS = Object.keys(PROCEDURE_LABELS)
const FLAG_OPTIONS      = Object.keys(FLAG_LABELS)

function TextInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:border-accent outline-none placeholder:text-muted"
      />
    </div>
  )
}

function SelectInput({ label, value, options, labels, onChange }: {
  label: string; value: string; options: string[]; labels?: Record<string,string>; onChange: (v: string) => void
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
        {options.map(o => <option key={o} value={o}>{labels?.[o] ?? o}</option>)}
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
    filters.status, filters.risk_level, filters.flag_type, filters.procedure_type,
    filters.region, filters.buyer_name, filters.buyer_edrpou, filters.participant_edrpou,
    filters.amount_min, filters.amount_max, filters.cpv_code, filters.date_from, filters.date_to,
  ].filter(Boolean).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Тендери</h1>
        <div className="flex items-center gap-3">
          {data && <span className="text-sm text-muted">{data.total.toLocaleString('uk-UA')} знайдено</span>}
          <div className="flex gap-1">
            <a
              href={exportUrl('csv', filters)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted hover:text-white hover:border-accent transition-colors"
              title="Завантажити CSV (до 50 000 рядків)"
            >
              <Download size={13} /> CSV
            </a>
            <a
              href={exportUrl('xlsx', filters)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted hover:text-white hover:border-accent transition-colors"
              title="Завантажити XLSX (до 50 000 рядків)"
            >
              <Download size={13} /> XLSX
            </a>
          </div>
        </div>
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
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          {/* Row 1: Замовник + Учасник + ЄДРПОУ замовника */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TextInput
              label="Замовник (назва)"
              value={filters.buyer_name ?? ''}
              onChange={v => set({ buyer_name: v || undefined })}
              placeholder="Міністерство..."
            />
            <TextInput
              label="ЄДРПОУ замовника"
              value={filters.buyer_edrpou ?? ''}
              onChange={v => set({ buyer_edrpou: v || undefined })}
              placeholder="12345678"
            />
            <TextInput
              label="ЄДРПОУ учасника"
              value={filters.participant_edrpou ?? ''}
              onChange={v => set({ participant_edrpou: v || undefined })}
              placeholder="ЄДРПОУ постачальника/учасника"
            />
          </div>

          {/* Row 2: Процедура + Статус + Регіон + CPV */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SelectInput label="Вид закупівлі"  value={filters.procedure_type ?? ''} options={PROCEDURE_OPTIONS} labels={PROCEDURE_LABELS} onChange={v => set({ procedure_type: v || undefined })} />
            <SelectInput label="Статус"          value={filters.status ?? ''}         options={STATUS_OPTIONS}    labels={STATUS_LABELS}    onChange={v => set({ status: v || undefined })} />
            <TextInput   label="Регіон"          value={filters.region ?? ''}         onChange={v => set({ region: v || undefined })}         placeholder="Київ" />
            <TextInput   label="ДК021:2015 (CPV)" value={filters.cpv_code ?? ''}      onChange={v => set({ cpv_code: v || undefined })}       placeholder="45000000" />
          </div>

          {/* Row 3: Ризик + Флаг + Сума + Дати */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            <SelectInput label="Рівень ризику" value={filters.risk_level ?? ''} options={RISK_OPTIONS} labels={RISK_LABELS} onChange={v => set({ risk_level: v || undefined })} />
            <SelectInput label="Тип порушення" value={filters.flag_type ?? ''}  options={FLAG_OPTIONS} labels={FLAG_LABELS} onChange={v => set({ flag_type: v || undefined })} />
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">Сума від (UAH)</label>
              <input type="number" value={filters.amount_min ?? ''} onChange={e => set({ amount_min: e.target.value ? Number(e.target.value) : undefined })} placeholder="0"
                className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:border-accent outline-none placeholder:text-muted" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">Сума до (UAH)</label>
              <input type="number" value={filters.amount_max ?? ''} onChange={e => set({ amount_max: e.target.value ? Number(e.target.value) : undefined })} placeholder="∞"
                className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:border-accent outline-none placeholder:text-muted" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">Дата від</label>
              <input type="date" value={filters.date_from ?? ''} onChange={e => set({ date_from: e.target.value || undefined })}
                className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:border-accent outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">Дата до</label>
              <input type="date" value={filters.date_to ?? ''} onChange={e => set({ date_to: e.target.value || undefined })}
                className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:border-accent outline-none" />
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={() => setFilters({ page: 1, per_page: 20, sort_by: 'date_created', sort_order: 'desc' })}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-white"
            >
              <X size={14} /> Скинути всі фільтри ({activeFilterCount})
            </button>
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
