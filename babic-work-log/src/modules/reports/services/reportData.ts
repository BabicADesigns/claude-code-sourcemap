import { entriesInRange, sumHours } from '@/services/calculations'
import { formatDateShort, formatDateTimeDisplay, formatHours, fromISODate } from '@/services/date'
import type { Client, EnrichedEntry, Project } from '@/models'
import type { ReportConfig } from '../models'

export interface ClientActivityReportRow {
  entryId: string
  dateLabel: string
  start: string
  end: string
  durationLabel: string
  activity: string
}

export interface ClientActivityReportNote {
  entryId: string
  dateLabel: string
  text: string
}

export interface ClientActivityReportData {
  clientName: string
  projectName: string
  periodLabel: string
  generatedOnLabel: string
  rows: ClientActivityReportRow[]
  totalHoursLabel: string
  /** Short phrases extracted from entry notes (split on , / ; / newline,
   * deduped case-insensitively) — a quick tag-style summary of what was
   * covered, built from whatever the entries actually say rather than a
   * fixed, business-specific vocabulary. */
  topics: string[]
  /** Full, unmodified notes per entry that has one, chronological. */
  notes: ClientActivityReportNote[]
}

const MAX_TOPICS = 16

function splitTopics(notes: string): string[] {
  return notes
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/** Builds the data for the in-app HTML Client Activity Report — the primary
 * report format (see ClientActivityReportPage). Deliberately excludes any
 * price/rate/amount field; this document goes to the client. */
export function buildClientActivityReportData(
  config: ReportConfig,
  data: { entries: EnrichedEntry[]; projects: Project[]; clients: Client[] },
): ClientActivityReportData {
  const { period, projectId } = config
  const project = data.projects.find((p) => p.id === projectId)
  const client = project ? data.clients.find((c) => c.id === project.clientId) : undefined

  const projectEntries = data.entries.filter((e) => e.projectId === projectId)
  const periodEntries = entriesInRange(projectEntries, fromISODate(period.start), fromISODate(period.end))
  const sorted = [...periodEntries].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)

  const rows: ClientActivityReportRow[] = sorted.map((e) => ({
    entryId: e.id,
    dateLabel: formatDateShort(e.date),
    start: e.startTime ?? '–',
    end: e.endTime ?? '–',
    durationLabel: formatHours(e.hours),
    activity: e.notes?.trim() || e.category,
  }))

  const topicSeen = new Set<string>()
  const topics: string[] = []
  for (const e of sorted) {
    if (!e.notes) continue
    for (const topic of splitTopics(e.notes)) {
      const key = topic.toLowerCase()
      if (topicSeen.has(key)) continue
      topicSeen.add(key)
      topics.push(topic)
      if (topics.length >= MAX_TOPICS) break
    }
    if (topics.length >= MAX_TOPICS) break
  }

  const notes: ClientActivityReportNote[] = sorted
    .filter((e) => e.notes?.trim())
    .map((e) => ({ entryId: e.id, dateLabel: formatDateShort(e.date), text: e.notes!.trim() }))

  return {
    clientName: client?.name ?? 'Unbekannt',
    projectName: project?.name ?? 'Unbekannt',
    periodLabel: period.label,
    generatedOnLabel: formatDateTimeDisplay(new Date()),
    rows,
    totalHoursLabel: formatHours(sumHours(sorted)),
    topics,
    notes,
  }
}
