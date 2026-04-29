'use client'
import ReactECharts from 'echarts-for-react'
import type { DashboardStats } from '@/lib/types'
import { fmtAmount } from '@/lib/api'

interface Props {
  data: DashboardStats['trend_30d']
}

export default function SpendingTrend({ data }: Props) {
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      textStyle: { color: '#fff' },
      formatter: (params: Array<{ name: string; value: number; seriesName: string }>) => {
        const d = params[0]
        const a = params[1]
        return `<div class="text-xs">
          <div class="font-medium mb-1">${d?.name}</div>
          <div>Тендерів: <b>${d?.value}</b></div>
          <div>Сума: <b>${fmtAmount(a?.value)}</b></div>
        </div>`
      },
    },
    legend: {
      data: ['Тендерів', 'Сума (млн ₴)'],
      textStyle: { color: '#64748b' },
      right: 10,
    },
    grid: { left: 10, right: 70, bottom: 0, top: 30, containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(d => d.date.slice(5)),   // MM-DD
      axisLabel: { color: '#64748b', fontSize: 11 },
      axisLine:  { lineStyle: { color: '#334155' } },
    },
    yAxis: [
      {
        type: 'value',
        axisLabel: { color: '#64748b', fontSize: 11 },
        splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
      },
      {
        type: 'value',
        axisLabel: { color: '#64748b', fontSize: 11, formatter: (v: number) => `${(v / 1e6).toFixed(0)}M` },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: 'Тендерів',
        type: 'bar',
        data: data.map(d => d.count),
        itemStyle: { color: '#3b82f6', borderRadius: [3, 3, 0, 0] },
        barMaxWidth: 20,
      },
      {
        name: 'Сума (млн ₴)',
        type: 'line',
        yAxisIndex: 1,
        data: data.map(d => d.total_amount),
        smooth: true,
        lineStyle: { color: '#22c55e', width: 2 },
        itemStyle: { color: '#22c55e' },
        areaStyle: { color: 'rgba(34,197,94,0.08)' },
        symbol: 'none',
      },
    ],
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-medium text-muted">Тренд за 30 днів</h3>
      <ReactECharts option={option} style={{ height: 220 }} />
    </div>
  )
}
