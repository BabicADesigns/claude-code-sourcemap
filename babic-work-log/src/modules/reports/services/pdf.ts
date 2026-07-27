import {
  applyWatermarkToAllPages,
  createReportDocument,
  drawEntriesTable,
  drawFooterNote,
  drawReportHeader,
  drawTotalsLine,
  savePdf,
} from '@/services/pdf'
import { entriesInRange, sumAmount, sumHours } from '@/services/calculations'
import { fromISODate } from '@/services/date'
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

// --- Client Activity Report ---
// Same table technique as the Business Report (jspdf-autotable: automatic
// row heights, automatic page breaks, alternating row colors) so both
// reports share one proven, well-tested layout engine — just without the
// Projekt column (redundant; already named once in the header, since this
// report is always scoped to a single project) and without the Betrag
// column or a monetary total, since this document goes to the client.

export async function generateClientActivityReport(
  config: ReportConfig,
  data: { entries: EnrichedEntry[]; projects: Project[]; clients: Client[] },
  preOpenedWindow: Window | null = null,
): Promise<void> {
  logDebug('reports', 'generateClientActivityReport entered', { projectId: config.projectId, period: config.period })
  const { period, projectId } = config
  const project = data.projects.find((p) => p.id === projectId)
  const client = project ? data.clients.find((c) => c.id === project.clientId) : undefined
  logDebug('reports', 'resolved project/client', { project: project?.name ?? 'NOT FOUND', client: client?.name ?? 'NOT FOUND' })

  const projectEntries = data.entries.filter((e) => e.projectId === projectId)
  const periodEntries = entriesInRange(projectEntries, fromISODate(period.start), fromISODate(period.end))
  logDebug('reports', 'entries for this project in period', { inPeriod: periodEntries.length, forProject: projectEntries.length })

  const doc = createReportDocument()
  logDebug('reports', 'jsPDF document instantiated')
  drawReportHeader(doc, 'Kundenbericht', [
    `Projekt: ${project?.name ?? 'Unbekannt'}`,
    `Kunde: ${client?.name ?? 'Unbekannt'}`,
    `Zeitraum: ${period.label} · Gesamt: ${sumHours(periodEntries).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} h`,
  ])

  const finalY = drawEntriesTable(doc, periodEntries, () => project?.name ?? 'Unbekannt', 104, {
    includeProjectColumn: false,
    includeAmountColumn: false,
  })
  drawTotalsLine(doc, sumHours(periodEntries), undefined, finalY)
  drawFooterNote(doc, 'Dies ist ein Tätigkeitsnachweis, keine Rechnung.')
  applyWatermarkToAllPages(doc)
  logDebug('reports', 'Client Activity Report content finished')

  const projectSlug = (project?.name ?? 'projekt').replace(/[^a-z0-9]+/gi, '-').toLowerCase()
  await savePdf(doc, `kundenbericht-${projectSlug}-${period.start}-${period.end}.pdf`, preOpenedWindow)
}
