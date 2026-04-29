import type {
  TenderListItem, TenderDetail, PaginatedResponse,
  CompanyProfile, NetworkData, DashboardStats,
} from './types'

export interface AlertCreate {
  email: string; name?: string
  buyer_edrpou?: string; supplier_edrpou?: string
  cpv_code?: string; region?: string
  amount_min?: number; risk_level?: string
  telegram_chat_id?: string
  notify_email?: boolean; notify_telegram?: boolean
}

export interface AlertOut {
  id: string; email: string; name?: string
  buyer_edrpou?: string; supplier_edrpou?: string
  cpv_code?: string; region?: string
  amount_min?: number; risk_level?: string
  telegram_chat_id?: string
  notify_email: boolean; notify_telegram: boolean
  is_active: boolean; created_at: string
}

const BASE = typeof window === 'undefined'
  ? (process.env.API_URL ?? 'http://api:8000')
  : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000')

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

// ── Tenders ───────────────────────────────────────────────────
export interface TenderFilters {
  status?:         string
  procedure_type?: string
  region?:         string
  cpv_code?:       string
  buyer_edrpou?:   string
  risk_level?:     string
  amount_min?:     number
  amount_max?:     number
  date_from?:      string
  date_to?:        string
  page?:           number
  per_page?:       number
  sort_by?:        string
  sort_order?:     'asc' | 'desc'
}

export function buildQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

export function exportUrl(fmt: 'csv' | 'xlsx', filters: TenderFilters = {}): string {
  const base = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000')
    : 'http://localhost:8000'
  return `${base}/api/v1/export/tenders${buildQuery({ format: fmt, ...filters })}`
}

export const api = {
  tenders: {
    list: (f: TenderFilters = {}) =>
      apiFetch<PaginatedResponse<TenderListItem>>(`/api/v1/tenders/${buildQuery(f)}`),

    get: (id: string) =>
      apiFetch<TenderDetail>(`/api/v1/tenders/${id}`),

    similar: (id: string, limit = 5) =>
      apiFetch<PaginatedResponse<TenderListItem>>(`/api/v1/tenders/${id}/similar?limit=${limit}`),
  },

  companies: {
    get: (edrpou: string) =>
      apiFetch<CompanyProfile>(`/api/v1/companies/${edrpou}`),

    network: (edrpou: string, depth = 1) =>
      apiFetch<NetworkData>(`/api/v1/companies/${edrpou}/network?depth=${depth}`),

    tenders: (edrpou: string, role = 'both', page = 1, perPage = 20) =>
      apiFetch<PaginatedResponse<TenderListItem>>(
        `/api/v1/companies/${edrpou}/tenders?role=${role}&page=${page}&per_page=${perPage}`
      ),
  },

  stats: {
    dashboard: () => apiFetch<DashboardStats>('/api/v1/stats/dashboard'),
    trend: (days = 30, region?: string, procedureType?: string) =>
      apiFetch<{
        source: 'clickhouse' | 'postgres'
        rows: Array<{ date: string; count: number; total_amount: number; avg_bids: number; high_risk_count: number }>
      }>(`/api/v1/stats/trend${buildQuery({ days, region, procedure_type: procedureType })}`),
  },

  search: {
    query: (q: string, type = 'all', page = 1) =>
      apiFetch<{ tenders: TenderListItem[]; companies: CompanyProfile[]; total: number }>(
        `/api/v1/search/${buildQuery({ q, type, page })}`
      ),
    autocomplete: (q: string) =>
      apiFetch<Array<{ id: string; name?: string; title?: string; type: string }>>(
        `/api/v1/search/autocomplete?q=${encodeURIComponent(q)}`
      ),
  },

  alerts: {
    list: (email: string) =>
      apiFetch<AlertOut[]>(`/api/v1/alerts/${buildQuery({ email })}`),
    create: (data: AlertCreate) =>
      apiFetch<AlertOut>('/api/v1/alerts/', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      apiFetch<void>(`/api/v1/alerts/${id}`, { method: 'DELETE' }),
  },
}

// ── Форматування ──────────────────────────────────────────────
export function fmtAmount(amount?: number | null, currency = 'UAH'): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('uk-UA', {
    style:    'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function fmtDate(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('uk-UA', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export function fmtNumber(n?: number | null): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('uk-UA').format(n)
}

export const PROCEDURE_LABELS: Record<string, string> = {
  aboveThresholdUA:    'Відкриті торги',
  aboveThresholdEU:    'Відкриті торги (EU)',
  belowThreshold:      'Спрощена закупівля',
  reporting:           'Звіт про договір',
  negotiation:         'Переговорна',
  'negotiation.quick': 'Переговорна (скорочена)',
  closeFrameworkAgreementUA: 'Рамкова угода',
}

export const STATUS_LABELS: Record<string, string> = {
  active:       'Активний',
  complete:     'Завершено',
  cancelled:    'Скасовано',
  unsuccessful: 'Не відбувся',
  draft:        'Чернетка',
}
