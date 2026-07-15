import type { TimeEntry } from './types'
import { endOfMonth, endOfWeek, fromISODate, startOfMonth, startOfWeek, todayISO } from './date'

export function entryHours(entry: TimeEntry): number {
  if (typeof entry.manualHours === 'number' && entry.manualHours > 0) {
    return entry.manualHours
  }
  if (entry.startTime && entry.endTime) {
    const [sh, sm] = entry.startTime.split(':').map(Number)
    const [eh, em] = entry.endTime.split(':').map(Number)
    const start = sh * 60 + sm
    let end = eh * 60 + em
    if (end < start) end += 24 * 60 // crosses midnight
    return Math.round(((end - start) / 60) * 100) / 100
  }
  return 0
}

export function entryAmount(entry: TimeEntry): number {
  return Math.round(entryHours(entry) * entry.hourlyRate * 100) / 100
}

export function sumHours(entries: TimeEntry[]): number {
  return Math.round(entries.reduce((sum, e) => sum + entryHours(e), 0) * 100) / 100
}

export function sumAmount(entries: TimeEntry[]): number {
  return Math.round(entries.reduce((sum, e) => sum + entryAmount(e), 0) * 100) / 100
}

export function entriesForDay(entries: TimeEntry[], iso: string): TimeEntry[] {
  return entries.filter((e) => e.date === iso)
}

export function entriesInRange(entries: TimeEntry[], start: Date, end: Date): TimeEntry[] {
  return entries.filter((e) => {
    const d = fromISODate(e.date)
    return d >= start && d <= end
  })
}

export function entriesThisWeek(entries: TimeEntry[], reference = new Date()): TimeEntry[] {
  return entriesInRange(entries, startOfWeek(reference), endOfWeek(reference))
}

export function entriesThisMonth(entries: TimeEntry[], reference = new Date()): TimeEntry[] {
  return entriesInRange(entries, startOfMonth(reference), endOfMonth(reference))
}

export function entriesToday(entries: TimeEntry[]): TimeEntry[] {
  return entriesForDay(entries, todayISO())
}

export function openAmount(entries: TimeEntry[]): number {
  return sumAmount(entries.filter((e) => e.status === 'offen'))
}

export function partialAmount(entries: TimeEntry[]): number {
  return sumAmount(entries.filter((e) => e.status === 'teilweise_bezahlt'))
}

export function paidAmount(entries: TimeEntry[]): number {
  return sumAmount(entries.filter((e) => e.status === 'bezahlt'))
}

export function outstandingAmount(entries: TimeEntry[]): number {
  return openAmount(entries) + partialAmount(entries)
}

export interface ProjectSummary {
  projectId: string
  hours: number
  amount: number
}

export function summarizeByProject(entries: TimeEntry[]): ProjectSummary[] {
  const map = new Map<string, ProjectSummary>()
  for (const e of entries) {
    const current = map.get(e.projectId) ?? { projectId: e.projectId, hours: 0, amount: 0 }
    current.hours = Math.round((current.hours + entryHours(e)) * 100) / 100
    current.amount = Math.round((current.amount + entryAmount(e)) * 100) / 100
    map.set(e.projectId, current)
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount)
}
