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

export interface Project {
  id: string
  name: string
  defaultRate: number
  createdAt: number
  archived?: boolean
}

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
  createdAt: number
  updatedAt: number
}

export interface EntryDraft {
  id?: string
  projectId: string
  date: string
  category: string
  timeMode: 'range' | 'manual'
  startTime: string
  endTime: string
  manualHours: string
  hourlyRate: string
  notes: string
  photo?: string
  status: EntryStatus
}
