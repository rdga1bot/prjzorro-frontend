import { fmtAmount, fmtNumber } from '@/lib/api'
import type { DashboardStats } from '@/lib/types'
import { TrendingUp, AlertTriangle, BarChart2, Activity } from 'lucide-react'

interface Props {
  stats: DashboardStats
}

interface CardProps {
  label:    string
  value:    string
  sub?:     string
  icon:     React.ReactNode
  accent?:  boolean
}

function Card({ label, value, sub, icon, accent }: CardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex items-start gap-4">
      <div className={`rounded-lg p-2.5 ${accent ? 'bg-risk-high/10 text-risk-high' : 'bg-accent/10 text-accent'}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-white truncate">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
      </div>
    </div>
  )
}

export default function StatsCards({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card
        label="Тендерів всього"
        value={fmtNumber(stats.total_tenders)}
        sub={`${fmtNumber(stats.active_count)} активних`}
        icon={<BarChart2 size={20} />}
      />
      <Card
        label="Загальна сума"
        value={fmtAmount(stats.total_amount_uah)}
        sub="за весь час"
        icon={<TrendingUp size={20} />}
      />
      <Card
        label="Середня конкуренція"
        value={`${stats.avg_competition.toFixed(1)} уч.`}
        sub="на один тендер"
        icon={<Activity size={20} />}
      />
      <Card
        label="Ризикових тендерів"
        value={`${stats.high_risk_pct.toFixed(1)}%`}
        sub={`${fmtNumber(stats.high_risk_count)} з high/critical`}
        icon={<AlertTriangle size={20} />}
        accent
      />
    </div>
  )
}
