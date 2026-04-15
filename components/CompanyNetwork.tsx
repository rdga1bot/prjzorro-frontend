'use client'
import { useEffect, useRef } from 'react'
import type { NetworkData, NetworkNode, NetworkEdge } from '@/lib/types'

interface Props {
  data:     NetworkData
  onSelect?: (edrpou: string) => void
}

const NODE_COLORS = {
  buyer:    '#3b82f6',
  supplier: '#22c55e',
  both:     '#f59e0b',
}
const RISK_COLORS = {
  low:      '#22c55e',
  medium:   '#f59e0b',
  high:     '#ef4444',
  critical: '#7c3aed',
}

export default function CompanyNetwork({ data, onSelect }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || data.nodes.length === 0) return

    // Динамічний імпорт D3 щоб не ламати SSR
    import('d3').then(d3 => {
      const svg = d3.select(svgRef.current!)
      svg.selectAll('*').remove()

      const W = svgRef.current!.clientWidth  || 600
      const H = svgRef.current!.clientHeight || 400

      const g = svg.append('g')

      // Zoom
      svg.call(
        d3.zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.3, 4])
          .on('zoom', e => g.attr('transform', e.transform))
      )

      // Граф
      const simulation = d3.forceSimulation<NetworkNode>(data.nodes)
        .force('link', d3.forceLink<NetworkNode, NetworkEdge>(data.edges)
          .id(d => d.id)
          .distance(d => 80 / (d.weight || 1))
        )
        .force('charge', d3.forceManyBody().strength(-200))
        .force('center', d3.forceCenter(W / 2, H / 2))
        .force('collision', d3.forceCollide(30))

      // Ребра
      const link = g.append('g')
        .selectAll('line')
        .data(data.edges)
        .join('line')
        .attr('stroke', '#334155')
        .attr('stroke-width', d => Math.sqrt(d.weight))
        .attr('stroke-opacity', 0.6)

      // Вузли
      const node = g.append('g')
        .selectAll<SVGGElement, NetworkNode>('g')
        .data(data.nodes)
        .join('g')
        .style('cursor', 'pointer')
        .call(
          d3.drag<SVGGElement, NetworkNode>()
            .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
            .on('drag',  (e, d) => { d.fx = e.x; d.fy = e.y })
            .on('end',   (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null })
        )
        .on('click', (_, d) => onSelect?.(d.id))

      // Коло: розмір від суми
      const sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(data.nodes, n => n.amount) ?? 1])
        .range([8, 30])

      node.append('circle')
        .attr('r',    d => sizeScale(d.amount))
        .attr('fill', d => NODE_COLORS[d.type] ?? '#64748b')
        .attr('fill-opacity', 0.85)
        .attr('stroke', d => d.risk_level ? RISK_COLORS[d.risk_level] : '#475569')
        .attr('stroke-width', d => d.risk_level && d.risk_level !== 'low' ? 2.5 : 1)

      // Мітка
      node.append('text')
        .text(d => d.label.length > 18 ? d.label.slice(0, 16) + '…' : d.label)
        .attr('dy', d => sizeScale(d.amount) + 12)
        .attr('text-anchor', 'middle')
        .attr('font-size', 10)
        .attr('fill', '#94a3b8')

      // Tooltip (title)
      node.append('title').text(d => `${d.label}\nЄДРПОУ: ${d.id}`)

      simulation.on('tick', () => {
        link
          .attr('x1', d => (d.source as NetworkNode).x ?? 0)
          .attr('y1', d => (d.source as NetworkNode).y ?? 0)
          .attr('x2', d => (d.target as NetworkNode).x ?? 0)
          .attr('y2', d => (d.target as NetworkNode).y ?? 0)

        node.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`)
      })

      return () => simulation.stop()
    })
  }, [data, onSelect])

  if (data.nodes.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted text-sm">
        Зв&apos;язки відсутні
      </div>
    )
  }

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-xl border border-border bg-card">
      <div className="absolute top-3 right-3 z-10 flex gap-3 text-xs text-muted">
        {Object.entries(NODE_COLORS).map(([k, c]) => (
          <span key={k} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />
            {k === 'buyer' ? 'Замовник' : k === 'supplier' ? 'Постачальник' : 'Обидва'}
          </span>
        ))}
      </div>
      <svg ref={svgRef} className="h-full w-full" />
    </div>
  )
}
