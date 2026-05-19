'use client'
import { useEffect, useRef } from 'react'
import type { NetworkData, NetworkNode, NetworkEdge } from '@/lib/types'
import { abbreviateUaName } from '@/lib/uaName'

interface Props {
  data:      NetworkData
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

// SVG → Canvas threshold. SVG handles <300 nodes well; Canvas for larger graphs.
const CANVAS_THRESHOLD = 300

// ── Canvas renderer (large graphs) ──────────────────────────────────────────

function useCanvasGraph(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  data: NetworkData,
  onSelect?: (edrpou: string) => void,
) {
  useEffect(() => {
    if (!canvasRef.current || data.nodes.length === 0) return

    import('d3').then(d3 => {
      const canvas  = canvasRef.current!
      const ctx     = canvas.getContext('2d')!
      const W       = canvas.clientWidth  || 700
      const H       = canvas.clientHeight || 420
      canvas.width  = W
      canvas.height = H

      // Pan/zoom state
      let tx = 0, ty = 0, scale = 1

      const sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(data.nodes, n => n.amount) ?? 1])
        .range([5, 22])

      const simulation = d3.forceSimulation<NetworkNode>(data.nodes)
        .alphaDecay(0.04)
        .velocityDecay(0.4)
        .force('link', d3.forceLink<NetworkNode, NetworkEdge>(data.edges)
          .id(d => d.id)
          .distance(d => 70 / (d.weight || 1))
        )
        .force('charge', d3.forceManyBody().strength(-100))
        .force('center', d3.forceCenter(W / 2, H / 2))
        .force('collision', d3.forceCollide(22))

      function draw() {
        ctx.clearRect(0, 0, W, H)
        ctx.save()
        ctx.translate(tx, ty)
        ctx.scale(scale, scale)

        // Edges
        ctx.lineWidth = 1
        ctx.globalAlpha = 0.45
        for (const e of data.edges) {
          const s = e.source as unknown as NetworkNode
          const t = e.target as unknown as NetworkNode
          if (s.x == null || t.x == null) continue
          ctx.strokeStyle = '#334155'
          ctx.lineWidth = Math.sqrt(e.weight || 1)
          ctx.beginPath()
          ctx.moveTo(s.x, s.y ?? 0)
          ctx.lineTo(t.x, t.y ?? 0)
          ctx.stroke()
        }

        // Nodes
        ctx.globalAlpha = 1
        for (const n of data.nodes) {
          if (n.x == null) continue
          const r = sizeScale(n.amount)
          const fill  = NODE_COLORS[n.type as keyof typeof NODE_COLORS] ?? '#64748b'
          const stroke = n.risk_level ? RISK_COLORS[n.risk_level as keyof typeof RISK_COLORS] : '#475569'
          const sw     = n.risk_level && n.risk_level !== 'low' ? 2.5 : 1

          ctx.beginPath()
          ctx.arc(n.x, n.y ?? 0, r, 0, 2 * Math.PI)
          ctx.fillStyle = fill
          ctx.globalAlpha = 0.85
          ctx.fill()
          ctx.globalAlpha = 1
          ctx.strokeStyle = stroke
          ctx.lineWidth = sw
          ctx.stroke()

          // Label
          if (scale > 0.6) {
            const label = abbreviateUaName(n.label)
            const short = label.length > 18 ? label.slice(0, 16) + '…' : label
            ctx.fillStyle = '#94a3b8'
            ctx.font = '9px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText(short, n.x, (n.y ?? 0) + r + 10)
          }
        }

        ctx.restore()
      }

      let rafId: number
      simulation.on('tick', () => {
        cancelAnimationFrame(rafId)
        rafId = requestAnimationFrame(draw)
      })
      simulation.on('end', draw)

      // Zoom / pan via wheel + pointer drag
      let dragging = false
      let dragStartX = 0, dragStartY = 0
      let dragNode: NetworkNode | null = null

      function hitTest(mx: number, my: number): NetworkNode | null {
        const wx = (mx - tx) / scale
        const wy = (my - ty) / scale
        for (const n of data.nodes) {
          if (n.x == null) continue
          const r = sizeScale(n.amount)
          if ((n.x - wx) ** 2 + ((n.y ?? 0) - wy) ** 2 < r * r) return n
        }
        return null
      }

      canvas.addEventListener('wheel', e => {
        e.preventDefault()
        const factor = e.deltaY < 0 ? 1.1 : 0.9
        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        tx = mx - (mx - tx) * factor
        ty = my - (my - ty) * factor
        scale *= factor
        draw()
      }, { passive: false })

      canvas.addEventListener('pointerdown', e => {
        const rect = canvas.getBoundingClientRect()
        dragStartX = e.clientX - rect.left
        dragStartY = e.clientY - rect.top
        dragNode = hitTest(dragStartX, dragStartY)
        dragging = true
        if (dragNode) {
          simulation.alphaTarget(0.3).restart()
          dragNode.fx = dragNode.x
          dragNode.fy = dragNode.y
        }
      })

      canvas.addEventListener('pointermove', e => {
        if (!dragging) return
        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        if (dragNode) {
          dragNode.fx = (mx - tx) / scale
          dragNode.fy = (my - ty) / scale
        } else {
          tx += mx - dragStartX
          ty += my - dragStartY
          dragStartX = mx
          dragStartY = my
          draw()
        }
      })

      canvas.addEventListener('pointerup', e => {
        if (dragging && !dragNode) {
          const rect = canvas.getBoundingClientRect()
          const mx = e.clientX - rect.left
          const my = e.clientY - rect.top
          const moved = Math.abs(mx - dragStartX) + Math.abs(my - dragStartY)
          if (moved < 5) {
            const hit = hitTest(mx, my)
            if (hit) onSelect?.(hit.id)
          }
        }
        if (dragNode) {
          simulation.alphaTarget(0)
          dragNode.fx = null
          dragNode.fy = null
          dragNode = null
        }
        dragging = false
      })

      return () => {
        simulation.stop()
        cancelAnimationFrame(rafId)
      }
    })
  }, [data, onSelect]) // eslint-disable-line react-hooks/exhaustive-deps
}

// ── SVG renderer (small graphs) ──────────────────────────────────────────────

function useSvgGraph(
  svgRef: React.RefObject<SVGSVGElement>,
  data: NetworkData,
  onSelect?: (edrpou: string) => void,
) {
  useEffect(() => {
    if (!svgRef.current || data.nodes.length === 0) return

    import('d3').then(d3 => {
      const svg = d3.select(svgRef.current!)
      svg.selectAll('*').remove()

      const W = svgRef.current!.clientWidth  || 600
      const H = svgRef.current!.clientHeight || 400
      const g = svg.append('g')

      svg.call(
        d3.zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.2, 5])
          .on('zoom', e => g.attr('transform', e.transform))
      )

      const simulation = d3.forceSimulation<NetworkNode>(data.nodes)
        .alphaDecay(0.04)
        .velocityDecay(0.4)
        .force('link', d3.forceLink<NetworkNode, NetworkEdge>(data.edges)
          .id(d => d.id)
          .distance(d => 70 / (d.weight || 1))
        )
        .force('charge', d3.forceManyBody().strength(
          data.nodes.length > 50 ? -120 : -200
        ))
        .force('center', d3.forceCenter(W / 2, H / 2))
        .force('collision', d3.forceCollide(28))

      const link = g.append('g')
        .selectAll('line')
        .data(data.edges)
        .join('line')
        .attr('stroke', '#334155')
        .attr('stroke-width', d => Math.sqrt(d.weight))
        .attr('stroke-opacity', 0.5)

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

      const sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(data.nodes, n => n.amount) ?? 1])
        .range([7, 28])

      node.append('circle')
        .attr('r',    d => sizeScale(d.amount))
        .attr('fill', d => NODE_COLORS[d.type as keyof typeof NODE_COLORS] ?? '#64748b')
        .attr('fill-opacity', 0.85)
        .attr('stroke', d => d.risk_level ? RISK_COLORS[d.risk_level as keyof typeof RISK_COLORS] : '#475569')
        .attr('stroke-width', d => d.risk_level && d.risk_level !== 'low' ? 2.5 : 1)

      node.append('text')
        .text(d => {
          const s = abbreviateUaName(d.label)
          return s.length > 22 ? s.slice(0, 20) + '…' : s
        })
        .attr('dy', d => sizeScale(d.amount) + 11)
        .attr('text-anchor', 'middle')
        .attr('font-size', data.nodes.length > 60 ? 9 : 10)
        .attr('fill', '#94a3b8')
        .style('pointer-events', 'none')

      node.append('title').text(d => `${abbreviateUaName(d.label)}\nЄДРПОУ: ${d.id}`)

      simulation.on('tick', () => {
        link
          .attr('x1', d => (d.source as unknown as NetworkNode).x ?? 0)
          .attr('y1', d => (d.source as unknown as NetworkNode).y ?? 0)
          .attr('x2', d => (d.target as unknown as NetworkNode).x ?? 0)
          .attr('y2', d => (d.target as unknown as NetworkNode).y ?? 0)
        node.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`)
      })

      return () => simulation.stop()
    })
  }, [data, onSelect]) // eslint-disable-line react-hooks/exhaustive-deps
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CompanyNetwork({ data, onSelect }: Props) {
  const svgRef    = useRef<SVGSVGElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const truncated = data.total_nodes > data.nodes.length
  const useCanvas = data.nodes.length >= CANVAS_THRESHOLD

  useSvgGraph(   useCanvas ? { current: null } as any : svgRef,    data, onSelect)
  useCanvasGraph(useCanvas ? canvasRef : { current: null } as any,  data, onSelect)

  if (data.nodes.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted text-sm">
        Зв&apos;язки відсутні
      </div>
    )
  }

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-xl border border-border bg-card">
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between">
        <div className="flex gap-3 text-xs text-muted">
          {Object.entries(NODE_COLORS).map(([k, c]) => (
            <span key={k} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />
              {k === 'buyer' ? 'Замовник' : k === 'supplier' ? 'Постачальник' : 'Обидва'}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {useCanvas && (
            <span className="text-xs text-muted/60 bg-bg/80 rounded px-2 py-0.5">canvas</span>
          )}
          {truncated && (
            <span className="text-xs text-muted bg-bg/80 rounded px-2 py-0.5">
              {data.nodes.length} з {data.total_nodes} вузлів
            </span>
          )}
        </div>
      </div>
      {useCanvas
        ? <canvas ref={canvasRef} className="h-full w-full" style={{ touchAction: 'none' }} />
        : <svg    ref={svgRef}    className="h-full w-full" />
      }
    </div>
  )
}
