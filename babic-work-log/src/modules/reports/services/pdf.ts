import {
  applyWatermarkToAllPages,
  createReportDocument,
  drawEntriesTable,
  drawFooterNote,
  drawReportHeader,
  drawTotalsLine,
  PDF_COLORS,
} from '@/services/pdf'
import { entriesInRange, entryAmount, entryHours, sumAmount, sumHours } from '@/services/calculations'
import { formatDateDisplay, fromISODate } from '@/services/date'
import type { Client, EnrichedEntry, Project } from '@/models'
import type { ReportConfig } from '../models'

export function generateBusinessReport(config: ReportConfig, data: { entries: EnrichedEntry[]; projects: Project[] }): void {
  const { period } = config
  const projectName = (id: string) => data.projects.find((p) => p.id === id)?.name ?? 'Unbekannt'
  const periodEntries = entriesInRange(data.entries, fromISODate(period.start), fromISODate(period.end))

  const doc = createReportDocument()
  drawReportHeader(doc, 'Business Report', ['Alle Projekte', period.label])

  const finalY = drawEntriesTable(doc, periodEntries, projectName, 104)
  drawTotalsLine(doc, sumHours(periodEntries), sumAmount(periodEntries), finalY)
  drawFooterNote(doc, 'Dies ist ein Tätigkeitsnachweis, keine Rechnung.')
  applyWatermarkToAllPages(doc)

  doc.save(`business-report-${period.start}-${period.end}.pdf`)
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

export function generateClientActivityReport(
  config: ReportConfig,
  data: { entries: EnrichedEntry[]; projects: Project[]; clients: Client[] },
): void {
  const { period, projectId, includeFinancials } = config
  const project = data.projects.find((p) => p.id === projectId)
  const client = project ? data.clients.find((c) => c.id === project.clientId) : undefined
  const projectEntries = data.entries.filter((e) => e.projectId === projectId)
  const periodEntries = entriesInRange(projectEntries, fromISODate(period.start), fromISODate(period.end))
  const days = groupEntriesByDay(periodEntries)

  const doc = createReportDocument()
  drawReportHeader(doc, 'Kundenbericht', [
    `Projekt: ${project?.name ?? 'Unbekannt'}`,
    `Kunde: ${client?.name ?? 'Unbekannt'}`,
    `Zeitraum: ${period.label} · Gesamt: ${sumHours(periodEntries).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} h`,
  ])

  let y = 128
  const pageBottom = doc.internal.pageSize.getHeight() - 50
  const left = 40

  for (const day of days) {
    if (y > pageBottom - 40) {
      doc.addPage()
      y = 60
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...PDF_COLORS.ink)
    doc.text(formatDateDisplay(day.date), left, y)
    y += 16

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...PDF_COLORS.mutedInk)
    for (const e of day.entries) {
      if (y > pageBottom) {
        doc.addPage()
        y = 60
      }
      const activity = e.notes?.trim() ? `${e.category} — ${e.notes.trim()}` : e.category
      const financialSuffix = includeFinancials
        ? ` · ${entryHours(e).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} h · ${entryAmount(e).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`
        : ''
      doc.text(`• ${activity}${financialSuffix}`, left + 12, y)
      y += 15
    }
    y += 10
  }

  if (days.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...PDF_COLORS.mutedInk)
    doc.text('Keine Einträge in diesem Zeitraum.', left, y)
    y += 20
  }

  if (includeFinancials) {
    if (y > pageBottom - 20) {
      doc.addPage()
      y = 60
    }
    drawTotalsLine(doc, sumHours(periodEntries), sumAmount(periodEntries), y + 10)
  }

  drawFooterNote(doc, 'Dies ist ein Tätigkeitsnachweis, keine Rechnung.')
  applyWatermarkToAllPages(doc)

  const projectSlug = (project?.name ?? 'projekt').replace(/[^a-z0-9]+/gi, '-').toLowerCase()
  doc.save(`kundenbericht-${projectSlug}-${period.start}-${period.end}.pdf`)
}
