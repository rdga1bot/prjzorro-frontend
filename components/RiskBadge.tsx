import type { RiskLevel, RiskFlag } from '@/lib/types'
import { clsx } from 'clsx'

interface Props {
  level?:    RiskLevel | null
  score?:    number
  flags?:    RiskFlag[]
  size?:     'sm' | 'md'
}

const LABELS: Record<RiskLevel, string> = {
  low:      'Низький',
  medium:   'Середній',
  high:     'Високий',
  critical: 'Критичний',
}

const STYLES: Record<RiskLevel, string> = {
  low:      'bg-risk-low/10 text-risk-low border-risk-low/30',
  medium:   'bg-risk-medium/10 text-risk-medium border-risk-medium/30',
  high:     'bg-risk-high/10 text-risk-high border-risk-high/30',
  critical: 'bg-risk-critical/10 text-risk-critical border-risk-critical/30',
}

export default function RiskBadge({ level, score, flags, size = 'md' }: Props) {
  if (!level) return <span className="text-muted text-sm">—</span>

  const tooltip = flags?.length
    ? flags.map(f => `• ${f.description}`).join('\n')
    : undefined

  return (
    <span
      title={tooltip}
      className={clsx(
        'inline-flex items-center gap-1 rounded border px-2 font-medium',
        size === 'sm' ? 'py-0.5 text-xs' : 'py-1 text-sm',
        STYLES[level],
      )}
    >
      <span className={clsx(
        'h-1.5 w-1.5 rounded-full',
        level === 'low'      && 'bg-risk-low',
        level === 'medium'   && 'bg-risk-medium',
        level === 'high'     && 'bg-risk-high',
        level === 'critical' && 'bg-risk-critical',
      )} />
      {LABELS[level]}
      {score != null && (
        <span className="opacity-60 text-xs">({(score * 100).toFixed(0)}%)</span>
      )}
    </span>
  )
}
