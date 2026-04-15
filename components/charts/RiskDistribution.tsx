'use client'
import ReactECharts from 'echarts-for-react'
import type { DashboardStats } from '@/lib/types'

interface Props {
  data: DashboardStats['risk_distribution']
}

const COLORS: Record<string, string> = {
  low:      '#22c55e',
  medium:   '#f59e0b',
  high:     '#ef4444',
  critical: '#7c3aed',
  unknown:  '#475569',
}

const LABELS: Record<string, string> = {
  low: 'Низький', medium: 'Середній',
  high: 'Високий', critical: 'Критичний', unknown: 'Не визначено',
}

export default function RiskDistribution({ data }: Props) {
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      textStyle: { color: '#fff' },
      formatter: ({ name, value, percent }: { name: string; value: number; percent: number }) =>
        `<div class="text-xs">
          <div class="font-medium">${LABELS[name] ?? name}</div>
          <div>${value} тендерів (${percent.toFixed(1)}%)</div>
        </div>`,
    },
    legend: {
      orient: 'vertical',
      right: 0,
      top: 'center',
      textStyle: { color: '#64748b', fontSize: 11 },
      formatter: (name: string) => LABELS[name] ?? name,
    },
    series: [{
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['38%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#fff' },
      },
      data: data.map(d => ({
        name:       d.risk_level,
        value:      d.count,
        itemStyle:  { color: COLORS[d.risk_level] ?? '#475569' },
      })),
    }],
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-medium text-muted">Розподіл за ризиком</h3>
      <ReactECharts option={option} style={{ height: 200 }} />
    </div>
  )
}
