import { PROJECT_COLOR_PALETTE } from '@/theme/tokens'

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
export const PROJECT_COLORS = PROJECT_COLOR_PALETTE

export type ProjectColor = (typeof PROJECT_COLORS)[number]

export type PricingType = 'hourly' | 'fixed'

export type ProjectStatus = 'active' | 'paused' | 'completed'

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Aktiv',
  paused: 'Pausiert',
  completed: 'Abgeschlossen',
}

export const PROJECT_STATUS_ORDER: ProjectStatus[] = ['active', 'paused', 'completed']

export type ClientRelationship = 'client' | 'partner' | 'supplier' | 'affiliate_partner' | 'business_contact' | 'internal'

export const CLIENT_RELATIONSHIP_LABELS: Record<ClientRelationship, string> = {
  client: 'Kunde',
  partner: 'Partner',
  supplier: 'Lieferant',
  affiliate_partner: 'Affiliate-Partner',
  business_contact: 'Freund / Geschäftskontakt',
  internal: 'Intern',
}

export const CLIENT_RELATIONSHIP_ORDER: ClientRelationship[] = [
  'client',
  'partner',
  'supplier',
  'affiliate_partner',
  'business_contact',
  'internal',
]

/** Richer lifecycle state than the legacy `archived` boolean — "archived" is
 * one of these values. Kept in sync with `archived` wherever either is set
 * (see normalizeClient) so existing archive/restore UI keeps working. */
export type ClientStatus = 'active' | 'paused' | 'completed' | 'archived'

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Aktiv',
  paused: 'Pausiert',
  completed: 'Abgeschlossen',
  archived: 'Archiviert',
}

export const CLIENT_STATUS_ORDER: ClientStatus[] = ['active', 'paused', 'completed', 'archived']

export type ClientPriority = 'high' | 'medium' | 'low'

export const CLIENT_PRIORITY_LABELS: Record<ClientPriority, string> = {
  high: 'Hoch',
  medium: 'Mittel',
  low: 'Niedrig',
}

export const CLIENT_PRIORITY_ORDER: ClientPriority[] = ['high', 'medium', 'low']

export type PreferredCommunication = 'email' | 'phone' | 'whatsapp' | 'telegram' | 'other'

export const PREFERRED_COMMUNICATION_LABELS: Record<PreferredCommunication, string> = {
  email: 'E-Mail',
  phone: 'Telefon',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  other: 'Sonstiges',
}

export const PREFERRED_COMMUNICATION_ORDER: PreferredCommunication[] = ['email', 'phone', 'whatsapp', 'telegram', 'other']

/** The central object every future module (Finance, Invoices, Documents,
 * CRM, Tasks, Travel, Meetings, Content Projects, ...) references by
 * `clientId` instead of duplicating client data. Billing defaults (rate,
 * retainer, currency, income model) intentionally live in a separate
 * finance-module record keyed by clientId, not here — this type stays
 * finance-agnostic so any module can depend on it. */
export interface Client {
  id: string
  name: string
  company?: string
  contactPerson?: string
  phone?: string
  email?: string
  website?: string
  address?: string
  country?: string
  vatId?: string
  relationship?: ClientRelationship
  status: ClientStatus
  priority?: ClientPriority
  /** Suggested starting hourly rate when creating a new project for this
   * client — a convenience default, not enforced on existing projects. */
  defaultRate?: number
  color?: string
  tags?: string[]
  /** General notes — the original single notes field, kept as-is. */
  notes?: string
  /** Private/operational notes, distinct from relationship-facing notes. */
  internalNotes?: string
  /** Notes about the relationship itself (history, preferences, context). */
  relationshipNotes?: string
  preferredCommunication?: PreferredCommunication
  createdAt: number
  /** @deprecated kept in sync with `status === 'archived'` for backward
   * compatibility with existing archive/restore UI and stored data. */
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
  status: ProjectStatus
  notes?: string
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

  // --- Memory Architecture (Sprint 2) ---
  // Not read or written by any UI today. These exist so a work entry is
  // already shaped for the future "Anita Memory" AI layer (see
  // src/future-ai/) without requiring a breaking migration later. All
  // optional, all safe to leave undefined indefinitely.
  /** Future: AI summary generation — short auto-generated recap of this entry. */
  summary?: string
  /** Future: speech-to-text — raw dictated/transcribed text this entry was derived from. */
  transcript?: string
  /** Future: semantic search — freeform labels for cross-entry retrieval. */
  tags?: string[]
  /** Future: automatic client detection — named entities extracted from notes/transcript. */
  entities?: string[]
  /** Future: denormalized client reference for entries not cleanly tied to one project. */
  customerId?: string
  /** Future: multi-user / AI-authored entries — who or what created this entry. */
  createdBy?: string
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
