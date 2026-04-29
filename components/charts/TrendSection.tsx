'use client'
import { useState } from 'react'
import useSWR from 'swr'
import ReactECharts from 'echarts-for-react'
import { api, fmtAmount } from '@/lib/api'
import { Database, Zap } from 'lucide-react'

const DAY_OPTIONS = [
  { label: '7 днів',  value: 7  },
  { label: '30 днів', value: 30 },
  { label: '90 днів', value: 90 },
  { label: '1 рік',   value: 365 },
]

export default function TrendSection() {
  const [days,   setDays]   = useState(30)
  const [region, setRegion] = useState('')
  const [regionInput, setRegionInput] = useState('')

  const { data, isLoading } = useSWR(
    ['trend', days, region],
    () => api.stats.trend(days, region || undefined),
    { keepPreviousData: true },
  )

  const rows = data?.rows ?? []

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      textStyle: { color: '#fff' },
      formatter: (params: Array<{ name: string; value: number }>) => {
        const [d, a] = params
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
      data: rows.map(r => r.date.slice(5)),
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
        data: rows.map(r => r.count),
        itemStyle: { color: '#3b82f6', borderRadius: [3, 3, 0, 0] },
        barMaxWidth: 20,
      },
      {
        name: 'Сума (млн ₴)',
        type: 'line',
        yAxisIndex: 1,
        data: rows.map(r => r.total_amount),
        smooth: true,
        lineStyle: { color: '#22c55e', width: 2 },
        itemStyle: { color: '#22c55e' },
        areaStyle: { color: 'rgba(34,197,94,0.08)' },
        symbol: 'none',
      },
    ],
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      {/* Header + controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-white">Тренд</h3>
          {data && (
            <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs
              ${data.source === 'clickhouse'
                ? 'bg-green-500/10 text-green-400'
                : 'bg-border text-muted'}`}>
              {data.source === 'clickhouse'
                ? <><Zap size={10} /> ClickHouse</>
                : <><Database size={10} /> PostgreSQL</>}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Region filter */}
          <form onSubmit={e => { e.preventDefault(); setRegion(regionInput.trim()) }}
                className="flex gap-1">
            <input
              value={regionInput}
              onChange={e => { setRegionInput(e.target.value); if (!e.target.value) setRegion('') }}
              placeholder="Регіон..."
              className="w-28 rounded-lg border border-border bg-bg px-2 py-1 text-xs text-white focus:border-accent outline-none placeholder:text-muted"
            />
          </form>
          {/* Days selector */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            {DAY_OPTIONS.map(o => (
              <button
                key={o.value}
                onClick={() => setDays(o.value)}
                className={`px-2.5 py-1 text-xs transition-colors
                  ${days === o.value
                    ? 'bg-accent text-white'
                    : 'text-muted hover:text-white hover:bg-white/5'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className={isLoading ? 'opacity-50' : ''}>
        {rows.length > 0
          ? <ReactECharts option={option} style={{ height: 220 }} />
          : <div className="h-[220px] flex items-center justify-center text-muted text-sm">
              {isLoading ? 'Завантаження...' : 'Немає даних'}
            </div>
        }
      </div>
    </div>
  )
}
