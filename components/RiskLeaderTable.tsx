'use client'
import { memo } from 'react'
import Link from 'next/link'
import { fmtAmount, fmtNumber } from '@/lib/api'
import { abbreviateUaName } from '@/lib/uaName'

export interface RiskLeaderRow {
  edrpou:          string
  name?:           string
  tender_count:    number
  high_risk_count: number
  avg_risk_score:  string | number
  total_amount?:   number
}

interface Props {
  rows: RiskLeaderRow[]
  role: 'buyer' | 'supplier'
}

const ROW_HEIGHT = 52
const MAX_VISIBLE = 10

function ScoreBar({ score }: { score: number }) {
  const pct   = Math.round(score * 100)
  const color = pct >= 70 ? 'bg-risk-critical'
              : pct >= 50 ? 'bg-risk-high'
              : pct >= 30 ? 'bg-risk-medium'
              : 'bg-risk-low'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-border">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-xs text-muted">{pct}%</span>
    </div>
  )
}

function RiskLeaderTable({ rows, role }: Props) {
  const visible = rows.slice(0, MAX_VISIBLE)
  const listHeight = Math.min(rows.length, MAX_VISIBLE) * ROW_HEIGHT

  return (
    <div className="relative overflow-x-auto">
      {/* Scroll hint gradient — mobile only */}
      <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent z-10 sm:hidden" />
      <div className="min-w-[400px]">
        {/* Header */}
        <div className="flex border-b border-border text-left text-xs font-medium text-muted">
          <div className="w-8 shrink-0 px-3 py-2">#</div>
          <div className="flex-1 px-2 py-2 min-w-[120px]">Назва</div>
          <div className="w-14 shrink-0 px-2 py-2 text-right">Тенд.</div>
          <div className="w-14 shrink-0 px-2 py-2 text-right">Вис.</div>
          <div className="w-32 shrink-0 px-2 py-2">Ризик</div>
          <div className="w-28 shrink-0 px-2 py-2 text-right hidden sm:block">Сума</div>
        </div>
        {/* Rows */}
        <div style={{ maxHeight: listHeight, overflowY: rows.length > MAX_VISIBLE ? 'auto' : 'visible' }}>
          {visible.map((r, index) => (
            <div
              key={r.edrpou}
              style={{ height: ROW_HEIGHT }}
              className="flex items-center border-t border-border hover:bg-white/5 transition-colors text-sm"
            >
              <div className="w-8 shrink-0 px-3 text-xs text-muted">{index + 1}</div>
              <div className="flex-1 min-w-[120px] overflow-hidden px-2 py-2">
                <Link
                  href={`/companies/${r.edrpou}`}
                  title={r.name ?? r.edrpou}
                  className="block truncate font-medium text-white hover:text-accent transition-colors"
                >
                  {r.name ? abbreviateUaName(r.name) : r.edrpou}
                </Link>
                <span className="block truncate text-xs text-muted">{r.edrpou}</span>
              </div>
              <div className="w-14 shrink-0 px-2 text-right text-muted">{fmtNumber(r.tender_count)}</div>
              <div className="w-14 shrink-0 px-2 text-right font-medium text-risk-high">
                {fmtNumber(r.high_risk_count)}
              </div>
              <div className="w-32 shrink-0 px-2">
                <ScoreBar score={parseFloat(String(r.avg_risk_score))} />
              </div>
              <div className="w-28 shrink-0 px-2 text-right text-xs text-muted hidden sm:block">
                {fmtAmount(r.total_amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default memo(RiskLeaderTable)
