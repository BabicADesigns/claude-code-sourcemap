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
import { entriesInRange, entryHours, sumAmount, sumHours } from '@/services/calculations'
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

// --- Client Activity Report: one bordered "session card" per entry. ---
// Never shows rates, amounts, or a monetary total — this document goes to
// the client, hours (Duration) are the only quantity shown. Every card's
// height is measured (via doc.splitTextToSize) before anything is drawn,
// so wrapped activity notes can never overlap the next card — same
// discipline as the Business Report's table, just laid out as cards.

const CARD_PADDING_X = 14
const CARD_PADDING_Y = 12
const CARD_GAP = 14
const LABEL_FONT_SIZE = 7.5
const VALUE_FONT_SIZE = 10
const DATE_FONT_SIZE = 12
const BODY_FONT_SIZE = 9.5
const LINE_HEIGHT = 13
const DATE_HEADING_HEIGHT = 20
const META_LABEL_HEIGHT = 11
const META_VALUE_HEIGHT = 16
const ACTIVITIES_LABEL_HEIGHT = 16
const BULLET_GAP = 5
const TOP_MARGIN = 60
const BOTTOM_MARGIN = 50
const LEFT = 40
const RIGHT_MARGIN = 40

interface SessionCard {
  entry: EnrichedEntry
  activityLines: string[][]
  height: number
}

function buildActivities(entry: EnrichedEntry): string[] {
  return (entry.notes ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function measureSessionCard(
  doc: ReturnType<typeof createReportDocument>,
  entry: EnrichedEntry,
  innerWidth: number,
): SessionCard {
  const activities = buildActivities(entry)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(BODY_FONT_SIZE)
  const activityLines = activities.length > 0 ? activities.map((a) => doc.splitTextToSize(`• ${a}`, innerWidth - 10)) : [['Keine weiteren Notizen.']]

  let height = CARD_PADDING_Y * 2
  height += DATE_HEADING_HEIGHT
  height += META_LABEL_HEIGHT + META_VALUE_HEIGHT
  height += ACTIVITIES_LABEL_HEIGHT
  for (const lines of activityLines) height += lines.length * LINE_HEIGHT + BULLET_GAP

  return { entry, activityLines, height }
}

function drawSessionCard(
  doc: ReturnType<typeof createReportDocument>,
  card: SessionCard,
  x: number,
  yTop: number,
  width: number,
): void {
  doc.setDrawColor(...PDF_COLORS.border)
  doc.setFillColor(...PDF_COLORS.cardBg)
  doc.setLineWidth(0.75)
  doc.roundedRect(x, yTop, width, card.height, 4, 4, 'FD')

  const innerLeft = x + CARD_PADDING_X
  const colWidth = (width - CARD_PADDING_X * 2) / 2
  const rightColX = innerLeft + colWidth
  let cy = yTop + CARD_PADDING_Y + 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(DATE_FONT_SIZE)
  doc.setTextColor(...PDF_COLORS.ink)
  doc.text(formatDateDisplay(card.entry.date), innerLeft, cy)
  cy += DATE_HEADING_HEIGHT

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(LABEL_FONT_SIZE)
  doc.setTextColor(...PDF_COLORS.mutedInk)
  doc.text('KATEGORIE', innerLeft, cy)
  doc.text('DAUER', rightColX, cy)
  cy += META_LABEL_HEIGHT

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(VALUE_FONT_SIZE)
  doc.setTextColor(...PDF_COLORS.ink)
  doc.text(card.entry.category, innerLeft, cy)
  doc.text(
    `${entryHours(card.entry).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} h`,
    rightColX,
    cy,
  )
  cy += META_VALUE_HEIGHT

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(LABEL_FONT_SIZE)
  doc.setTextColor(...PDF_COLORS.mutedInk)
  doc.text('AKTIVITÄTEN', innerLeft, cy)
  cy += ACTIVITIES_LABEL_HEIGHT

  doc.setFontSize(BODY_FONT_SIZE)
  doc.setTextColor(...PDF_COLORS.ink)
  for (const lines of card.activityLines) {
    for (let i = 0; i < lines.length; i++) {
      doc.text(lines[i], innerLeft, cy + i * LINE_HEIGHT)
    }
    cy += lines.length * LINE_HEIGHT + BULLET_GAP
  }
}

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
  const periodEntries = entriesInRange(projectEntries, fromISODate(period.start), fromISODate(period.end)).sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt,
  )
  logDebug('reports', 'entries for this project in period', { inPeriod: periodEntries.length, forProject: projectEntries.length })

  const doc = createReportDocument()
  logDebug('reports', 'jsPDF document instantiated')
  drawReportHeader(doc, 'Kundenbericht', [
    `Projekt: ${project?.name ?? 'Unbekannt'}`,
    `Kunde: ${client?.name ?? 'Unbekannt'}`,
    `Zeitraum: ${period.label} · Gesamt: ${sumHours(periodEntries).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} h`,
  ])

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageBottom = doc.internal.pageSize.getHeight() - BOTTOM_MARGIN
  const cardWidth = pageWidth - LEFT - RIGHT_MARGIN
  let y = 128

  if (periodEntries.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...PDF_COLORS.mutedInk)
    doc.text('Keine Einträge in diesem Zeitraum.', LEFT, y)
  }

  for (const entry of periodEntries) {
    const card = measureSessionCard(doc, entry, cardWidth - CARD_PADDING_X * 2)
    if (y + card.height > pageBottom) {
      doc.addPage()
      y = TOP_MARGIN
    }
    drawSessionCard(doc, card, LEFT, y, cardWidth)
    y += card.height + CARD_GAP
  }

  drawFooterNote(doc, 'Dies ist ein Tätigkeitsnachweis, keine Rechnung.')
  applyWatermarkToAllPages(doc)
  logDebug('reports', 'Client Activity Report content finished')

  const projectSlug = (project?.name ?? 'projekt').replace(/[^a-z0-9]+/gi, '-').toLowerCase()
  await savePdf(doc, `kundenbericht-${projectSlug}-${period.start}-${period.end}.pdf`, preOpenedWindow)
}
