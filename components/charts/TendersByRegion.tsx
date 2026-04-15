'use client'
import ReactECharts from 'echarts-for-react'
import type { DashboardStats } from '@/lib/types'
import { fmtAmount } from '@/lib/api'

interface Props {
  data: DashboardStats['by_region']
}

export default function TendersByRegion({ data }: Props) {
  const top = data.slice(0, 10)

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      textStyle: { color: '#fff' },
      formatter: (params: Array<{ name: string; value: number }>) =>
        `<div class="text-xs">
          <div class="font-medium mb-1">${params[0]?.name}</div>
          <div>Сума: <b>${fmtAmount(params[0]?.value)}</b></div>
        </div>`,
    },
    grid: { left: 10, right: 20, top: 5, bottom: 0, containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#64748b', fontSize: 10, formatter: (v: number) => `${(v / 1e6).toFixed(0)}M` },
      splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: top.map(r => r.region).reverse(),
      axisLabel: { color: '#94a3b8', fontSize: 11, width: 130, overflow: 'truncate' },
      axisLine: { lineStyle: { color: '#334155' } },
    },
    series: [{
      type: 'bar',
      data: top.map(r => r.total_amount).reverse(),
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#1d4ed8' },
            { offset: 1, color: '#3b82f6' },
          ],
        },
        borderRadius: [0, 4, 4, 0],
      },
      barMaxWidth: 18,
    }],
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-medium text-muted">Топ регіонів за обсягом</h3>
      <ReactECharts option={option} style={{ height: 260 }} />
    </div>
  )
}
