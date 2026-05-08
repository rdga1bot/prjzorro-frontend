import { memo } from 'react'
import Link from 'next/link'
import { fmtAmount, fmtNumber } from '@/lib/api'

interface RiskLeaderRow {
  edrpou:         string
  name?:          string
  tender_count:   number
  high_risk_count: number
  avg_risk_score: string | number
  total_amount?:  number
}

interface Props {
  rows: RiskLeaderRow[]
  role: 'buyer' | 'supplier'
}

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
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="px-4 py-2 text-xs font-medium text-muted">Назва</th>
            <th className="w-20 px-4 py-2 text-right text-xs font-medium text-muted">Тендерів</th>
            <th className="w-20 px-4 py-2 text-right text-xs font-medium text-muted">Вис. ризик</th>
            <th className="w-36 px-4 py-2 text-xs font-medium text-muted">Серед. ризик</th>
            <th className="w-32 px-4 py-2 text-right text-xs font-medium text-muted">Сума</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.edrpou}
                className="border-t border-border transition-colors hover:bg-white/5">
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-xs text-muted">{i + 1}</span>
                  <div>
                    <Link
                      href={role === 'buyer'
                        ? `/tenders?buyer_edrpou=${r.edrpou}`
                        : `/companies/${r.edrpou}`}
                      className="line-clamp-1 text-white transition-colors hover:text-accent"
                    >
                      {r.name || r.edrpou}
                    </Link>
                    <span className="text-xs text-muted">{r.edrpou}</span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-2.5 text-right text-muted">
                {fmtNumber(r.tender_count)}
              </td>
              <td className="px-4 py-2.5 text-right">
                <span className="font-medium text-risk-high">
                  {fmtNumber(r.high_risk_count)}
                </span>
              </td>
              <td className="px-4 py-2.5">
                <ScoreBar score={parseFloat(String(r.avg_risk_score))} />
              </td>
              <td className="px-4 py-2.5 text-right text-xs text-muted">
                {fmtAmount(r.total_amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default memo(RiskLeaderTable)
