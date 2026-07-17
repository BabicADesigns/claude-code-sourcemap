import {
  applyWatermarkToAllPages,
  createReportDocument,
  drawEntriesTable,
  drawFooterNote,
  drawReportHeader,
  drawTotalsLine,
  PDF_COLORS,
  savePdf,
} from '@/services/pdf'
import { entriesInRange, entryAmount, entryHours, sumAmount, sumHours } from '@/services/calculations'
import { formatDateDisplay, fromISODate } from '@/services/date'
import { logDebug } from '@/services/debugLog'
import type { Client, EnrichedEntry, Project } from '@/models'
import type { ReportConfig } from '../models'

export async function generateBusinessReport(
  config: ReportConfig,
  data: { entries: EnrichedEntry[]; projects: Project[] },
  preOpenedWindow: Window | null = null,
): Promise<void> {
  logDebug('reports', 'generateBusinessReport entered', { period: config.period })
  const { period } = config
  const projectName = (id: string) => data.projects.find((p) => p.id === id)?.name ?? 'Unbekannt'
  const periodEntries = entriesInRange(data.entries, fromISODate(period.start), fromISODate(period.end))
  logDebug('reports', 'entries in period', { inPeriod: periodEntries.length, total: data.entries.length })

  const doc = createReportDocument()
  logDebug('reports', 'jsPDF document instantiated')
  drawReportHeader(doc, 'Business Report', ['Alle Projekte', period.label])

  const finalY = drawEntriesTable(doc, periodEntries, projectName, 104)
  drawTotalsLine(doc, sumHours(periodEntries), sumAmount(periodEntries), finalY)
  drawFooterNote(doc, 'Dies ist ein Tätigkeitsnachweis, keine Rechnung.')
  applyWatermarkToAllPages(doc)
  logDebug('reports', 'Business Report content finished')

  await savePdf(doc, `business-report-${period.start}-${period.end}.pdf`, preOpenedWindow)
}

/** Groups entries by ISO date, sorted chronologically, for the Client
 * Activity Report's day-by-day timeline layout. */
function groupEntriesByDay(entries: EnrichedEntry[]): { date: string; entries: EnrichedEntry[] }[] {
  const map = new Map<string, EnrichedEntry[]>()
  for (const e of entries) {
    const list = map.get(e.date) ?? []
    list.push(e)
    map.set(e.date, list)
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, dayEntries]) => ({ date, entries: dayEntries }))
}

function buildActivityText(e: EnrichedEntry, includeFinancials: boolean): string {
  const activity = e.notes?.trim() ? `${e.category} — ${e.notes.trim()}` : e.category
  if (!includeFinancials) return activity
  const hours = entryHours(e).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
  const amount = entryAmount(e).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
  return `${activity} · ${hours} h · ${amount}`
}

/** Timeline layout constants (pt). `lineHeight` is deliberately generous for
 * the 9.5pt body font so wrapped lines never touch — every Y advance below
 * is driven by an actually-measured line count, never a guess, which is
 * what makes overlap impossible regardless of how long a note runs. */
const TOP_MARGIN = 60
const BOTTOM_MARGIN = 50
const LEFT = 40
const RIGHT_MARGIN = 40
const BULLET_INDENT = 12
const BULLET_TEXT_GAP = 10
const LINE_HEIGHT = 14
const DATE_HEADING_GAP = 20
const ENTRY_SPACING = 6
const DAY_SPACING = 16

export async function generateClientActivityReport(
  config: ReportConfig,
  data: { entries: EnrichedEntry[]; projects: Project[]; clients: Client[] },
  preOpenedWindow: Window | null = null,
): Promise<void> {
  logDebug('reports', 'generateClientActivityReport entered', {
    projectId: config.projectId,
    period: config.period,
    includeFinancials: config.includeFinancials,
  })
  const { period, projectId, includeFinancials } = config
  const project = data.projects.find((p) => p.id === projectId)
  const client = project ? data.clients.find((c) => c.id === project.clientId) : undefined
  logDebug('reports', 'resolved project/client', { project: project?.name ?? 'NOT FOUND', client: client?.name ?? 'NOT FOUND' })

  const projectEntries = data.entries.filter((e) => e.projectId === projectId)
  const periodEntries = entriesInRange(projectEntries, fromISODate(period.start), fromISODate(period.end))
  logDebug('reports', 'entries for this project in period', { inPeriod: periodEntries.length, forProject: projectEntries.length })
  const days = groupEntriesByDay(periodEntries)

  const doc = createReportDocument()
  logDebug('reports', 'jsPDF document instantiated')
  drawReportHeader(doc, 'Kundenbericht', [
    `Projekt: ${project?.name ?? 'Unbekannt'}`,
    `Kunde: ${client?.name ?? 'Unbekannt'}`,
    `Zeitraum: ${period.label} · Gesamt: ${sumHours(periodEntries).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} h`,
  ])

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageBottom = doc.internal.pageSize.getHeight() - BOTTOM_MARGIN
  const bulletX = LEFT + BULLET_INDENT
  const textX = bulletX + BULLET_TEXT_GAP
  const wrapWidth = pageWidth - textX - RIGHT_MARGIN

  let y = 128

  function ensureSpace(needed: number) {
    if (y + needed > pageBottom) {
      doc.addPage()
      y = TOP_MARGIN
    }
  }

  function measure(text: string): string[] {
    return doc.splitTextToSize(text, wrapWidth)
  }

  for (const day of days) {
    // Measure the heading + its first entry together so a date heading never
    // ends up orphaned alone at the bottom of a page.
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    const firstEntryLines = day.entries[0] ? measure(buildActivityText(day.entries[0], includeFinancials)) : ['']
    ensureSpace(DATE_HEADING_GAP + firstEntryLines.length * LINE_HEIGHT)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...PDF_COLORS.ink)
    doc.text(formatDateDisplay(day.date), LEFT, y)
    y += DATE_HEADING_GAP

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...PDF_COLORS.mutedInk)

    for (const e of day.entries) {
      const lines = measure(buildActivityText(e, includeFinancials))
      const entryHeight = lines.length * LINE_HEIGHT
      ensureSpace(entryHeight)

      doc.text('•', bulletX, y)
      for (let i = 0; i < lines.length; i++) {
        doc.text(lines[i], textX, y + i * LINE_HEIGHT)
      }
      y += entryHeight + ENTRY_SPACING
    }

    y += DAY_SPACING - ENTRY_SPACING
  }

  if (days.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...PDF_COLORS.mutedInk)
    ensureSpace(LINE_HEIGHT)
    doc.text('Keine Einträge in diesem Zeitraum.', LEFT, y)
    y += LINE_HEIGHT + DAY_SPACING
  }

  if (includeFinancials) {
    ensureSpace(LINE_HEIGHT + 10)
    drawTotalsLine(doc, sumHours(periodEntries), sumAmount(periodEntries), y + 10)
  }

  drawFooterNote(doc, 'Dies ist ein Tätigkeitsnachweis, keine Rechnung.')
  applyWatermarkToAllPages(doc)
  logDebug('reports', 'Client Activity Report content finished')

  const projectSlug = (project?.name ?? 'projekt').replace(/[^a-z0-9]+/gi, '-').toLowerCase()
  await savePdf(doc, `kundenbericht-${projectSlug}-${period.start}-${period.end}.pdf`, preOpenedWindow)
}
