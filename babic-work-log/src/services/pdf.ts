import jsPDF, { GState } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { entryAmount, entryHours, sumAmount, sumHours } from './calculations'
import { formatDateShort } from './date'
import type { EnrichedEntry, Project, TimeEntry } from '../models'
import { CIPKA_B_BASE64 } from './watermarkAsset'
import { COLORS, hexToRgb } from '../theme/tokens'

export interface ExportOptions {
  title: string
  subtitle: string
  entries: (TimeEntry | EnrichedEntry)[]
  projects: Project[]
}

/** Shared PDF palette, derived from the brand tokens so every report (this
 * file, and modules/reports/services/pdf.ts) stays visually consistent. */
export const PDF_COLORS = {
  sage: hexToRgb(COLORS.sage),
  ink: hexToRgb(COLORS.ink),
  mutedInk: [100, 94, 84] as [number, number, number],
  footerGray: [140, 132, 118] as [number, number, number],
  rowAlt: [245, 238, 230] as [number, number, number],
}

export function createReportDocument(): jsPDF {
  return new jsPDF({ unit: 'pt', format: 'a4' })
}

export function drawReportHeader(doc: jsPDF, mainTitle: string, lines: string[]): void {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...PDF_COLORS.ink)
  doc.text(mainTitle, 40, 48)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...PDF_COLORS.mutedInk)
  lines.forEach((line, i) => doc.text(line, 40, 68 + i * 16))
}

export function drawFooterNote(doc: jsPDF, text: string): void {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...PDF_COLORS.footerGray)
  doc.text(text, 40, doc.internal.pageSize.getHeight() - 30)
}

function drawWatermark(doc: jsPDF): void {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const size = 64
  doc.saveGraphicsState()
  doc.setGState(new GState({ opacity: 0.06 }))
  doc.addImage(CIPKA_B_BASE64, 'PNG', pageWidth - size - 24, pageHeight - size - 24, size, size)
  doc.restoreGraphicsState()
}

export function applyWatermarkToAllPages(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    drawWatermark(doc)
  }
}

/** Draws the standard entries table (Datum/Projekt/Kategorie/Notizen/Stunden/Betrag)
 * starting at `startY` and returns the Y position just below it, for placing a
 * totals line. Shared by the legacy week/month export and the Business Report. */
export function drawEntriesTable(
  doc: jsPDF,
  entries: (TimeEntry | EnrichedEntry)[],
  projectName: (id: string) => string,
  startY: number,
): number {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))

  autoTable(doc, {
    startY,
    head: [['Datum', 'Projekt', 'Kategorie', 'Notizen', 'Stunden', 'Betrag']],
    body: sorted.map((e) => [
      formatDateShort(e.date),
      projectName(e.projectId),
      e.category,
      e.notes ?? '',
      entryHours(e).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 }),
      entryAmount(e).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }),
    ]),
    styles: { font: 'helvetica', fontSize: 9, textColor: PDF_COLORS.ink, cellPadding: 6 },
    headStyles: { fillColor: PDF_COLORS.sage, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: PDF_COLORS.rowAlt },
    columnStyles: {
      3: { cellWidth: 160 },
      4: { halign: 'right', cellWidth: 55 },
      5: { halign: 'right', cellWidth: 70 },
    },
    margin: { left: 40, right: 40 },
  })

  return ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY) + 24
}

export function drawTotalsLine(doc: jsPDF, totalHours: number, totalAmount: number, y: number): void {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...PDF_COLORS.ink)
  doc.text(
    `Gesamt: ${totalHours.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} h · ${totalAmount.toLocaleString(
      'de-DE',
      { style: 'currency', currency: 'EUR' },
    )}`,
    40,
    y,
  )
}

export function exportActivityReport({ title, subtitle, entries, projects }: ExportOptions): void {
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? 'Unbekannt'
  const doc = createReportDocument()

  drawReportHeader(doc, 'Tätigkeitsnachweis', [title, subtitle])

  const finalY = drawEntriesTable(doc, entries, projectName, 104)
  drawTotalsLine(doc, sumHours(entries), sumAmount(entries), finalY)
  drawFooterNote(doc, 'Dies ist ein Tätigkeitsnachweis, keine Rechnung.')
  applyWatermarkToAllPages(doc)

  const filenameSafe = title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
  doc.save(`taetigkeitsnachweis-${filenameSafe}.pdf`)
}
