import type { EnrichedEntry, EntryPayment, EntryStatus, Project, ProjectDocument, TimeEntry } from '../models'
import {
  addWeeks,
  endOfMonth,
  endOfWeek,
  formatWeekLabel,
  fromISODate,
  startOfMonth,
  startOfWeek,
  todayISO,
} from './date'

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function rawEntryHours(entry: TimeEntry): number {
  if (typeof entry.manualHours === 'number' && entry.manualHours > 0) {
    return entry.manualHours
  }
  if (entry.startTime && entry.endTime) {
    const [sh, sm] = entry.startTime.split(':').map(Number)
    const [eh, em] = entry.endTime.split(':').map(Number)
    const start = sh * 60 + sm
    let end = eh * 60 + em
    if (end < start) end += 24 * 60 // crosses midnight
    return round2((end - start) / 60)
  }
  return 0
}

function isEnriched(entry: TimeEntry | EnrichedEntry): entry is EnrichedEntry {
  return typeof (entry as EnrichedEntry).hours === 'number' && typeof (entry as EnrichedEntry).amount === 'number'
}

export function entryHours(entry: TimeEntry | EnrichedEntry): number {
  return isEnriched(entry) ? entry.hours : rawEntryHours(entry)
}

export function entryAmount(entry: TimeEntry | EnrichedEntry): number {
  return isEnriched(entry) ? entry.amount : round2(rawEntryHours(entry) * entry.hourlyRate)
}

export function paymentsSum(payments?: EntryPayment[]): number {
  if (!payments || payments.length === 0) return 0
  return round2(payments.reduce((sum, p) => sum + p.amount, 0))
}

function computePaidAmount(entry: TimeEntry, amount: number): number {
  if (entry.payments && entry.payments.length > 0) {
    return Math.min(paymentsSum(entry.payments), amount)
  }
  return entry.status === 'bezahlt' ? amount : 0
}

function computeDisplayStatus(entry: TimeEntry, amount: number, paid: number): EntryStatus {
  if (entry.payments && entry.payments.length > 0) {
    if (paid <= 0) return 'offen'
    if (paid >= amount - 0.005) return 'bezahlt'
    return 'teilweise_bezahlt'
  }
  return entry.status
}

/** Effective hourly rate for a project's entries. For hourly projects this is
 * just the entry's own rate; for fixed-price projects the project's fixed
 * price is distributed proportionally across all logged hours so per-entry
 * amounts always sum to exactly the fixed price. */
export function enrichEntries(entries: TimeEntry[], projects: Project[]): EnrichedEntry[] {
  const hoursByProject = new Map<string, number>()
  for (const e of entries) {
    hoursByProject.set(e.projectId, (hoursByProject.get(e.projectId) ?? 0) + rawEntryHours(e))
  }

  return entries.map((e) => {
    const project = projects.find((p) => p.id === e.projectId)
    const hours = rawEntryHours(e)
    let rate = e.hourlyRate
    if (project?.pricingType === 'fixed' && project.fixedPrice) {
      const totalHours = hoursByProject.get(e.projectId) ?? 0
      rate = totalHours > 0 ? project.fixedPrice / totalHours : 0
    }
    const amount = round2(hours * rate)
    const paidAmount = computePaidAmount(e, amount)
    const outstandingAmount = Math.max(0, round2(amount - paidAmount))
    const displayStatus = computeDisplayStatus(e, amount, paidAmount)
    return { ...e, hours, amount, paidAmount, outstandingAmount, displayStatus }
  })
}

export function effectiveRateForProject(project: Project, entries: TimeEntry[]): number {
  const projectEntries = entries.filter((e) => e.projectId === project.id)
  if (project.pricingType === 'fixed') {
    const totalHours = round2(projectEntries.reduce((sum, e) => sum + rawEntryHours(e), 0))
    return totalHours > 0 ? round2((project.fixedPrice ?? 0) / totalHours) : 0
  }
  return project.defaultRate
}

export function sumHours(entries: (TimeEntry | EnrichedEntry)[]): number {
  return round2(entries.reduce((sum, e) => sum + entryHours(e), 0))
}

export function sumAmount(entries: (TimeEntry | EnrichedEntry)[]): number {
  return round2(entries.reduce((sum, e) => sum + entryAmount(e), 0))
}

function entryPaid(entry: TimeEntry | EnrichedEntry): number {
  if (isEnriched(entry)) return entry.paidAmount
  return entry.status === 'bezahlt' ? entryAmount(entry) : 0
}

function entryOutstanding(entry: TimeEntry | EnrichedEntry): number {
  if (isEnriched(entry)) return entry.outstandingAmount
  return entry.status === 'bezahlt' ? 0 : entryAmount(entry)
}

export function paidAmount(entries: (TimeEntry | EnrichedEntry)[]): number {
  return round2(entries.reduce((sum, e) => sum + entryPaid(e), 0))
}

export function outstandingAmount(entries: (TimeEntry | EnrichedEntry)[]): number {
  return round2(entries.reduce((sum, e) => sum + entryOutstanding(e), 0))
}

export function averageHourlyRate(entries: (TimeEntry | EnrichedEntry)[]): number {
  const hours = sumHours(entries)
  if (hours <= 0) return 0
  return round2(sumAmount(entries) / hours)
}

export function entriesForDay(entries: (TimeEntry | EnrichedEntry)[], iso: string) {
  return entries.filter((e) => e.date === iso)
}

export function entriesInRange<T extends TimeEntry>(entries: T[], start: Date, end: Date): T[] {
  return entries.filter((e) => {
    const d = fromISODate(e.date)
    return d >= start && d <= end
  })
}

export function entriesThisWeek<T extends TimeEntry>(entries: T[], reference = new Date()): T[] {
  return entriesInRange(entries, startOfWeek(reference), endOfWeek(reference))
}

export function entriesThisMonth<T extends TimeEntry>(entries: T[], reference = new Date()): T[] {
  return entriesInRange(entries, startOfMonth(reference), endOfMonth(reference))
}

export function entriesToday<T extends TimeEntry>(entries: T[]): T[] {
  return entriesForDay(entries, todayISO()) as T[]
}

export interface ProjectSummary {
  projectId: string
  hours: number
  amount: number
}

export function summarizeByProject(entries: (TimeEntry | EnrichedEntry)[]): ProjectSummary[] {
  const map = new Map<string, ProjectSummary>()
  for (const e of entries) {
    const current = map.get(e.projectId) ?? { projectId: e.projectId, hours: 0, amount: 0 }
    current.hours = round2(current.hours + entryHours(e))
    current.amount = round2(current.amount + entryAmount(e))
    map.set(e.projectId, current)
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount)
}

export interface ClientSummary {
  clientId: string
  hours: number
  amount: number
}

export function summarizeByClient(entries: (TimeEntry | EnrichedEntry)[], projects: Project[]): ClientSummary[] {
  const map = new Map<string, ClientSummary>()
  for (const e of entries) {
    const project = projects.find((p) => p.id === e.projectId)
    if (!project) continue
    const current = map.get(project.clientId) ?? { clientId: project.clientId, hours: 0, amount: 0 }
    current.hours = round2(current.hours + entryHours(e))
    current.amount = round2(current.amount + entryAmount(e))
    map.set(project.clientId, current)
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount)
}

export interface BusinessHealth {
  weekLabel: string
  amount: number
  hours: number
  averageRate: number
  outstanding: number
  mostProductiveProjectId: string | null
}

/** Auto-computed weekly recap for the most recently completed Mon–Sun week. */
export function computeBusinessHealth(entries: EnrichedEntry[]): BusinessHealth {
  const lastWeekReference = addWeeks(new Date(), -1)
  const weekEntries = entriesThisWeek(entries, lastWeekReference)
  const byProject = summarizeByProject(weekEntries)
  return {
    weekLabel: formatWeekLabel(lastWeekReference),
    amount: sumAmount(weekEntries),
    hours: sumHours(weekEntries),
    averageRate: averageHourlyRate(weekEntries),
    outstanding: outstandingAmount(weekEntries),
    mostProductiveProjectId: byProject[0]?.projectId ?? null,
  }
}

export interface DayClose {
  hours: number
  amount: number
  outstanding: number
  byProject: ProjectSummary[]
  notes: string[]
}

export function computeDayClose(entries: EnrichedEntry[]): DayClose {
  const today = entriesToday(entries)
  return {
    hours: sumHours(today),
    amount: sumAmount(today),
    outstanding: outstandingAmount(today),
    byProject: summarizeByProject(today),
    notes: today.map((e) => e.notes).filter((n): n is string => Boolean(n && n.trim())),
  }
}

// --- Client Timeline (architecture only — see Client Profile spec) ---
//
// Not rendered by any screen yet. A client timeline is a read-only view
// composed from records that already live in their own stores (entries,
// documents today; payments once the finance module lands) rather than a
// new source of truth, so there's nothing to persist or migrate here — just
// a stable shape + a pure aggregator a future screen can call directly.
// `source` anticipates event kinds that don't exist yet (meetings, emails,
// voice notes) so the type won't need to change when those arrive.

export type ClientTimelineEventType =
  | 'work_session'
  | 'payment'
  | 'document'
  | 'note'
  | 'meeting'
  | 'email'
  | 'voice_note'

export interface ClientTimelineEvent {
  id: string
  type: ClientTimelineEventType
  date: string // ISO yyyy-mm-dd
  title: string
  amount?: number
  projectId?: string
  /** id of the underlying record this event was derived from (entry id, document id, ...) */
  sourceId: string
}

export function getClientTimeline(
  clientId: string,
  data: { entries: EnrichedEntry[] | TimeEntry[]; projects: Project[]; documents: ProjectDocument[] },
): ClientTimelineEvent[] {
  const projectIdsForClient = new Set(data.projects.filter((p) => p.clientId === clientId).map((p) => p.id))

  const workEvents: ClientTimelineEvent[] = data.entries
    .filter((e) => projectIdsForClient.has(e.projectId))
    .map((e) => ({
      id: `entry-${e.id}`,
      type: 'work_session',
      date: e.date,
      title: e.notes?.trim() || e.category,
      amount: entryAmount(e),
      projectId: e.projectId,
      sourceId: e.id,
    }))

  const documentEvents: ClientTimelineEvent[] = data.documents
    .filter((d) => projectIdsForClient.has(d.projectId))
    .map((d) => ({
      id: `doc-${d.id}`,
      type: 'document',
      date: fromMillisToISODate(d.addedAt),
      title: `${d.label}: ${d.name}`,
      projectId: d.projectId,
      sourceId: d.id,
    }))

  return [...workEvents, ...documentEvents].sort((a, b) => b.date.localeCompare(a.date))
}

function fromMillisToISODate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}
