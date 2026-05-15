'use client'
import { memo } from 'react'
import Link from 'next/link'
import { fmtAmount, fmtDate, PROCEDURE_LABELS } from '@/lib/api'
import { abbreviateUaName } from '@/lib/uaName'
import type { TenderListItem } from '@/lib/types'
import RiskBadge from './RiskBadge'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface Props {
  items:        TenderListItem[]
  total:        number
  page:         number
  perPage:      number
  pages:        number
  sortBy?:      string
  sortOrder?:   'asc' | 'desc'
  onPageChange:  (p: number) => void
  onSort:        (col: string) => void
  loading?:      boolean
}

const COLS = [
  { key: 'title',         label: 'Тендер',    sortable: false, width: '' },
  { key: 'value_amount',  label: 'Сума',       sortable: true,  width: 'w-36 shrink-0' },
  { key: 'procedure',     label: 'Процедура',  sortable: false, width: 'w-48 shrink-0' },
  { key: 'bids_count',    label: 'Учасн.',     sortable: false, width: 'w-20 shrink-0' },
  { key: 'risk_level',    label: 'Ризик',      sortable: false, width: 'w-32 shrink-0' },
  { key: 'date_created',  label: 'Дата',       sortable: true,  width: 'w-28 shrink-0' },
]

function SkeletonRow() {
  return (
    <tr className="border-t border-border animate-pulse">
      {COLS.map(c => (
        <td key={c.key} className={`px-4 py-3 ${c.width}`}>
          <div className="h-4 rounded bg-border" />
        </td>
      ))}
    </tr>
  )
}

// Прозорий Link який заповнює клітинку — кожна td клікабельна як anchor.
// Це гарантує SPA-навігацію (не повне перезавантаження) і роботу Ctrl+клік.
function CellLink({ href, children, className = '' }: {
  href: string; children: React.ReactNode; className?: string
}) {
  return (
    <Link href={href} className={`block h-full w-full ${className}`} tabIndex={-1} prefetch={false}>
      {children}
    </Link>
  )
}

function TenderTable({
  items, total, page, perPage, pages,
  sortBy, sortOrder, onPageChange, onSort, loading,
}: Props) {
  const SortIcon = ({ col }: { col: string }) => {
    if (col !== sortBy) return <ChevronUp size={14} className="opacity-20" />
    return sortOrder === 'asc'
      ? <ChevronUp size={14} className="text-accent" />
      : <ChevronDown size={14} className="text-accent" />
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] table-fixed text-sm text-white">
          <colgroup>
            <col />
            <col className="w-36" />
            <col className="w-48" />
            <col className="w-20" />
            <col className="w-32" />
            <col className="w-28" />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-bg/40">
              {COLS.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left font-medium text-muted
                    ${col.sortable ? 'cursor-pointer hover:text-white select-none' : ''}`}
                  onClick={() => col.sortable && onSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && <SortIcon col={col.key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: perPage }).map((_, i) => <SkeletonRow key={i} />)
              : items.map(t => {
                const href = `/tenders/${t.tender_id}`
                return (
                  <tr
                    key={t.id}
                    className="border-t border-border hover:bg-white/5 transition-colors"
                  >
                    {/* Перша клітинка — назва + замовник, основний Link з prefetch */}
                    <td className="px-4 py-3 min-w-0">
                      <Link href={href} className="block">
                        <p className="line-clamp-2 font-medium hover:text-accent transition-colors">
                          {t.title}
                        </p>
                        {t.procuring_entity_name && (
                          <p className="mt-0.5 text-xs text-muted truncate">
                            {abbreviateUaName(t.procuring_entity_name)}
                            {t.procuring_entity_region && ` · ${t.procuring_entity_region}`}
                          </p>
                        )}
                      </Link>
                    </td>

                    {/* Решта клітинок — CellLink без prefetch */}
                    <td className="px-4 py-3 font-mono text-sm">
                      <CellLink href={href}>
                        {fmtAmount(t.value_amount, t.value_currency)}
                      </CellLink>
                    </td>
                    <td className="px-4 py-3 text-muted text-xs">
                      <CellLink href={href}>
                        <span className="line-clamp-2">
                          {PROCEDURE_LABELS[t.procedure_type ?? ''] ?? t.procedure_type ?? '—'}
                        </span>
                      </CellLink>
                    </td>
                    <td className="px-4 py-3">
                      <CellLink href={href}>
                        <span className={t.bids_count === 1 ? 'text-risk-high font-bold' : ''}>
                          {t.bids_count}
                        </span>
                      </CellLink>
                    </td>
                    <td className="px-4 py-3 overflow-hidden">
                      <CellLink href={href}>
                        <RiskBadge level={t.risk_level} size="sm" />
                      </CellLink>
                    </td>
                    <td className="px-4 py-3 text-muted text-xs">
                      <CellLink href={href}>
                        {fmtDate(t.date_created)}
                      </CellLink>
                    </td>
                  </tr>
                )
              })}

            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={COLS.length} className="px-4 py-12 text-center text-muted">
                  Нічого не знайдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Пагінація */}
      {pages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
          <span className="text-muted">
            {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} з {total}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="rounded px-3 py-1.5 text-muted hover:bg-white/10 disabled:opacity-30"
            >
              ←
            </button>
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
              const p = page <= 4 ? i + 1
                : page >= pages - 3 ? pages - 6 + i
                : page - 3 + i
              return p > 0 && p <= pages ? (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`rounded px-3 py-1.5 ${p === page
                    ? 'bg-accent text-white'
                    : 'text-muted hover:bg-white/10'}`}
                >
                  {p}
                </button>
              ) : null
            })}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pages}
              className="rounded px-3 py-1.5 text-muted hover:bg-white/10 disabled:opacity-30"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(TenderTable)
