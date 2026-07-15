import jsPDF, { GState } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { entryAmount, entryHours, sumAmount, sumHours } from './calculations'
import { formatDateShort } from './date'
import type { EnrichedEntry, Project, TimeEntry } from '../models'
import { CIPKA_B_BASE64 } from './watermarkAsset'

export interface ExportOptions {
  title: string
  subtitle: string
  entries: (TimeEntry | EnrichedEntry)[]
  projects: Project[]
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

export function exportActivityReport({ title, subtitle, entries, projects }: ExportOptions): void {
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? 'Unbekannt'
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const sage: [number, number, number] = [139, 155, 122]
  const ink: [number, number, number] = [58, 53, 46]

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...ink)
  doc.text('Tätigkeitsnachweis', 40, 48)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(100, 94, 84)
  doc.text(title, 40, 68)
  doc.text(subtitle, 40, 84)

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))

  autoTable(doc, {
    startY: 104,
    head: [['Datum', 'Projekt', 'Kategorie', 'Notizen', 'Stunden', 'Betrag']],
    body: sorted.map((e) => [
      formatDateShort(e.date),
      projectName(e.projectId),
      e.category,
      e.notes ?? '',
      entryHours(e).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 }),
      entryAmount(e).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }),
    ]),
    styles: { font: 'helvetica', fontSize: 9, textColor: ink, cellPadding: 6 },
    headStyles: { fillColor: sage, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 238, 230] },
    columnStyles: {
      3: { cellWidth: 160 },
      4: { halign: 'right', cellWidth: 55 },
      5: { halign: 'right', cellWidth: 70 },
    },
    margin: { left: 40, right: 40 },
  })

  const finalY = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 104) + 24
  const totalHours = sumHours(sorted)
  const totalAmount = sumAmount(sorted)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...ink)
  doc.text(
    `Gesamt: ${totalHours.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} h · ${totalAmount.toLocaleString(
      'de-DE',
      { style: 'currency', currency: 'EUR' },
    )}`,
    40,
    finalY,
  )

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(140, 132, 118)
  doc.text('Dies ist ein Tätigkeitsnachweis, keine Rechnung.', 40, doc.internal.pageSize.getHeight() - 30)

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    drawWatermark(doc)
  }

  const filenameSafe = title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
  doc.save(`taetigkeitsnachweis-${filenameSafe}.pdf`)
}
