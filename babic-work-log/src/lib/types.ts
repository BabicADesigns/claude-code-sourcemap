export type EntryStatus = 'offen' | 'teilweise_bezahlt' | 'bezahlt'

export const STATUS_LABELS: Record<EntryStatus, string> = {
  offen: 'Offen',
  teilweise_bezahlt: 'Teilweise bezahlt',
  bezahlt: 'Bezahlt',
}

export const STATUS_ORDER: EntryStatus[] = ['offen', 'teilweise_bezahlt', 'bezahlt']

export const CATEGORIES = [
  'Entwicklung',
  'Design',
  'Beratung',
  'Meeting',
  'Administration',
  'Sonstiges',
] as const

export type Category = (typeof CATEGORIES)[number]

/** Fixed, CVD-validated categorical set for project color-coding (see dataviz skill). */
export const PROJECT_COLORS = [
  '#3E7CD6', // blue
  '#B8862E', // ochre
  '#8B4F8C', // plum
  '#2E9E8A', // teal
  '#C2453C', // terracotta
  '#5C9E3A', // green
] as const

export type ProjectColor = (typeof PROJECT_COLORS)[number]

export type PricingType = 'hourly' | 'fixed'

export interface Client {
  id: string
  name: string
  phone?: string
  email?: string
  notes?: string
  createdAt: number
  archived?: boolean
}

export interface Project {
  id: string
  name: string
  clientId: string
  color: string
  defaultRate: number
  pricingType: PricingType
  fixedPrice?: number
  createdAt: number
  archived?: boolean
}

export interface Payment {
  id: string
  amount: number
  date: string // ISO yyyy-mm-dd
  note?: string
}

export type EntrySource = 'manual' | 'range' | 'timer'

export interface TimeEntry {
  id: string
  projectId: string
  date: string // ISO yyyy-mm-dd
  category: string
  startTime?: string // HH:mm
  endTime?: string // HH:mm
  manualHours?: number
  hourlyRate: number
  notes?: string
  photo?: string // base64 data URL
  status: EntryStatus
  payments?: Payment[]
  source?: EntrySource
  createdAt: number
  updatedAt: number
}

/** TimeEntry enriched with project-aware, payment-aware computed values. Always
 * derived — never persisted — so it stays in sync with project/payment edits. */
export interface EnrichedEntry extends TimeEntry {
  hours: number
  amount: number
  paidAmount: number
  outstandingAmount: number
  displayStatus: EntryStatus
}

export interface ProjectDocument {
  id: string
  projectId: string
  name: string
  label: string
  dataUrl: string
  mimeType: string
  addedAt: number
}

export interface EntryDraft {
  id?: string
  projectId: string
  date: string
  category: string
  timeMode: 'range' | 'manual' | 'timer'
  startTime: string
  endTime: string
  manualHours: string
  hourlyRate: string
  notes: string
  photo?: string
  status: EntryStatus
  payments: Payment[]
}
