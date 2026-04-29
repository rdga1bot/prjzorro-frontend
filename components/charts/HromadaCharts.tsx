'use client'
import ReactECharts from 'echarts-for-react'

interface RegionSummary {
  region: string
  total_amount: number
  tender_count: number
  buyer_count: number
}

interface MonthRow {
  month: string
  tender_count: number
  total_amount: number
}

export function RegionBarChart({
  data,
  onSelect,
}: {
  data: RegionSummary[]
  onSelect: (region: string) => void
}) {
  const regions = data.map(r => r.region)
  const amounts = data.map(r => +(r.total_amount / 1_000_000).toFixed(1))

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (p: any[]) => {
        const d = p[0]
        return `${d.name}<br/><b>${d.value.toLocaleString('uk-UA')} млн ₴</b>`
      },
    },
    grid: { left: 16, right: 16, top: 8, bottom: 60, containLabel: true },
    xAxis: {
      type: 'category',
      data: regions,
      axisLabel: {
        color: '#6b7280',
        fontSize: 10,
        rotate: 35,
        interval: 0,
        formatter: (v: string) => v.replace(' область', '').replace('м. ', ''),
      },
      axisLine: { lineStyle: { color: '#2d3748' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#6b7280', fontSize: 10, formatter: (v: number) => `${v}M` },
      splitLine: { lineStyle: { color: '#1a2035' } },
    },
    series: [{
      type: 'bar',
      data: amounts,
      itemStyle: { color: '#3b82f6', borderRadius: [3, 3, 0, 0] },
      emphasis: { itemStyle: { color: '#60a5fa' } },
    }],
  }

  return (
    <ReactECharts
      option={option}
      style={{ height: 240 }}
      onEvents={{ click: (p: any) => onSelect(p.name) }}
    />
  )
}

export function RegionTrendChart({ data }: { data: MonthRow[] }) {
  const months  = data.map(r => r.month)
  const amounts = data.map(r => +(r.total_amount / 1_000_000).toFixed(1))
  const counts  = data.map(r => r.tender_count)

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (p: any[]) => {
        const [bar, line] = p
        return `${bar.name}<br/>Сума: <b>${bar.value} млн ₴</b><br/>Тендери: <b>${line.value}</b>`
      },
    },
    legend: {
      data: ['Сума (млн ₴)', 'Тендери'],
      textStyle: { color: '#6b7280', fontSize: 11 },
      bottom: 0,
    },
    grid: { left: 16, right: 16, top: 8, bottom: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: { color: '#6b7280', fontSize: 10 },
      axisLine: { lineStyle: { color: '#2d3748' } },
    },
    yAxis: [
      {
        type: 'value',
        name: 'млн ₴',
        nameTextStyle: { color: '#6b7280', fontSize: 10 },
        axisLabel: { color: '#6b7280', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1a2035' } },
      },
      {
        type: 'value',
        name: 'шт.',
        nameTextStyle: { color: '#6b7280', fontSize: 10 },
        axisLabel: { color: '#6b7280', fontSize: 10 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: 'Сума (млн ₴)',
        type: 'bar',
        data: amounts,
        itemStyle: { color: '#3b82f6', borderRadius: [3, 3, 0, 0] },
      },
      {
        name: 'Тендери',
        type: 'line',
        yAxisIndex: 1,
        data: counts,
        smooth: true,
        lineStyle: { color: '#22c55e', width: 2 },
        itemStyle: { color: '#22c55e' },
        symbol: 'circle',
        symbolSize: 5,
      },
    ],
  }

  return <ReactECharts option={option} style={{ height: 220 }} />
}
