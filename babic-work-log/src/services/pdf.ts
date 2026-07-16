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

/** iOS (incl. iPadOS, which reports as "MacIntel" but has touch support) —
 * anchor-click-based downloads (what jsPDF's doc.save() uses under the
 * hood) are unreliable there regardless of how synchronous the call is, so
 * every report generator routes through `savePdf` below instead of calling
 * doc.save() directly. */
function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isIPhoneOrIPod = /iP(hone|od)/.test(ua)
  const isIPad = /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return isIPhoneOrIPod || isIPad
}

type ShareNavigator = Navigator & {
  canShare?: (data?: ShareData) => boolean
  share?: (data: ShareData) => Promise<void>
}

/** Cross-platform "give the user this PDF" step, logged at every branch so
 * a stuck export can be diagnosed from the browser console.
 * - Desktop/Android: doc.save() (anchor-click download), unchanged.
 * - iOS: builds a Blob and opens the native Share Sheet via the Web Share
 *   API (lets the user save to Files, AirDrop, etc.); if the Share API
 *   isn't available, falls back to opening the PDF in a new tab, where
 *   Safari's own toolbar offers Share/Save to Files. */
export async function savePdf(doc: jsPDF, filename: string): Promise<void> {
  console.log('[pdf] savePdf called', { filename, isIOS: isIOS(), userAgent: navigator.userAgent })

  if (!isIOS()) {
    console.log('[pdf] non-iOS path: calling doc.save()')
    doc.save(filename)
    console.log('[pdf] doc.save() returned')
    return
  }

  console.log('[pdf] iOS path: building Blob via doc.output("blob")')
  const blob = doc.output('blob')
  console.log('[pdf] blob created, size =', blob.size, 'bytes')

  const nav = navigator as ShareNavigator
  if (nav.share && nav.canShare) {
    try {
      const file = new File([blob], filename, { type: 'application/pdf' })
      const canShareFile = nav.canShare({ files: [file] })
      console.log('[pdf] navigator.canShare({ files }) =', canShareFile)
      if (canShareFile) {
        console.log('[pdf] calling navigator.share() — Share Sheet should open now')
        await nav.share({ files: [file], title: filename })
        console.log('[pdf] navigator.share() resolved (share sheet closed)')
        return
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('[pdf] navigator.share() aborted by user — this is a normal cancel, not an error')
        return
      }
      console.log('[pdf] navigator.share() threw, falling back to new-tab', err)
    }
  } else {
    console.log('[pdf] Web Share API (files) not available on this browser, falling back to new-tab')
  }

  console.log('[pdf] opening Blob URL in a new tab as fallback')
  const url = URL.createObjectURL(blob)
  const opened = window.open(url, '_blank')
  console.log('[pdf] window.open returned', opened ? 'a window/tab reference' : 'null (likely popup-blocked)')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export async function exportActivityReport({ title, subtitle, entries, projects }: ExportOptions): Promise<void> {
  console.log('[pdf] exportActivityReport entered', { title, subtitle, entryCount: entries.length, projectCount: projects.length })
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? 'Unbekannt'
  const doc = createReportDocument()
  console.log('[pdf] jsPDF document instantiated')

  drawReportHeader(doc, 'Tätigkeitsnachweis', [title, subtitle])

  const finalY = drawEntriesTable(doc, entries, projectName, 104)
  drawTotalsLine(doc, sumHours(entries), sumAmount(entries), finalY)
  drawFooterNote(doc, 'Dies ist ein Tätigkeitsnachweis, keine Rechnung.')
  applyWatermarkToAllPages(doc)
  console.log('[pdf] PDF content finished (table, totals, footer, watermark drawn)')

  const filenameSafe = title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
  await savePdf(doc, `taetigkeitsnachweis-${filenameSafe}.pdf`)
}
