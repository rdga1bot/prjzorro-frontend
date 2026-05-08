export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface RiskFlag {
  flag_type:   string
  severity:    RiskLevel
  description: string
  evidence?:   Record<string, unknown>
}

export interface Bid {
  id:            string
  bidder_edrpou?: string
  bidder_name?:   string
  value_amount?:  number
  status?:        string
  date?:          string
}

export interface Award {
  id:               string
  supplier_edrpou?: string
  supplier_name?:   string
  value_amount?:    number
  status?:          string
  date?:            string
}

export interface TenderListItem {
  id:                       string
  tender_id:                string
  title:                    string
  status:                   string
  procedure_type?:          string
  value_amount?:            number
  value_currency:           string
  procuring_entity_edrpou?: string
  procuring_entity_name?:   string
  procuring_entity_region?: string
  bids_count:               number
  awards_count:             number
  risk_score:               number
  risk_level?:              RiskLevel
  date_created?:            string
  date_modified?:           string
}

export interface TenderDetail extends TenderListItem {
  procuring_entity_kind?:  string
  tender_period_start?:    string
  tender_period_end?:      string
  award_period_end?:       string
  value_vat_included:      boolean
  bids:                    Bid[]
  awards:                  Award[]
  risk_flags:              RiskFlag[]
}

export interface PaginatedResponse<T> {
  items:    T[]
  total:    number
  page:     number
  per_page: number
  pages:    number
}

export interface CompanyProfile {
  edrpou:                    string
  name:                      string
  name_short?:               string
  region?:                   string
  legal_form?:               string
  registration_date?:        string
  status?:                   string
  director_name?:            string
  founders?:                 Array<{ name: string; edrpou?: string; share?: number }>
  beneficiaries?:            Array<{ name: string; edrpou?: string; share?: number }>
  as_buyer_tenders_count:    number
  as_buyer_total_amount:     number
  as_supplier_tenders_count: number
  as_supplier_bids_count:    number
  as_supplier_total_amount:  number
  as_supplier_win_rate:      number
  risk_score:                number
  risk_level?:               RiskLevel
  active_flags_count:        number
  last_enriched_at?:         string
}

export interface NetworkNode {
  id:          string
  label:       string
  type:        'buyer' | 'supplier' | 'both'
  amount:      number
  risk_level?: RiskLevel
}

export interface NetworkEdge {
  source:       string
  target:       string
  relation:     string
  description?: string
  weight:       number
}

export interface NetworkData {
  nodes:       NetworkNode[]
  edges:       NetworkEdge[]
  total_nodes: number
}

export interface DashboardStats {
  total_tenders:     number
  total_amount_uah:  number
  avg_competition:   number
  high_risk_count:   number
  high_risk_pct:     number
  active_count:      number
  top_buyers:        Array<{ edrpou: string; name: string; tenders_count: number; total_amount: number }>
  top_suppliers:     Array<{ edrpou: string; name: string; tenders_count: number; total_amount: number; win_rate_pct: number }>
  by_region:         Array<{ region: string; count: number; total_amount: number }>
  by_procedure_type: Array<{ procedure_type: string; count: number; total_amount: number }>
  trend_30d:         Array<{ date: string; count: number; total_amount: number }>
  risk_distribution: Array<{ risk_level: string; count: number }>
}
