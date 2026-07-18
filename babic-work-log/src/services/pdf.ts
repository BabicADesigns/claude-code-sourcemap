import jsPDF, { GState } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { entryAmount, entryHours, sumAmount, sumHours } from './calculations'
import { formatDateShort } from './date'
import type { EnrichedEntry, Project, TimeEntry } from '../models'
import { CIPKA_B_BASE64 } from './watermarkAsset'
import { COLORS, hexToRgb } from '../theme/tokens'
import { logDebug } from './debugLog'
import { isIOS } from './platform'

export interface ExportOptions {
  title: string
  subtitle: string
  entries: (TimeEntry | EnrichedEntry)[]
  projects: Project[]
  /** From openIOSPlaceholderWindow(), called synchronously in the click
   * handler — see platform.ts for why. Undefined/null on non-iOS. */
  preOpenedWindow?: Window | null
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

export interface EntriesTableOptions {
  /** Show a 'Projekt' column. The Business Report (multi-project) needs it;
   * the Client Activity Report doesn't — it's already scoped to one project,
   * named once in the header. Defaults to true. */
  includeProjectColumn?: boolean
  /** Show a 'Betrag' column with the entry's amount. Defaults to true. The
   * Client Activity Report never shows monetary figures. */
  includeAmountColumn?: boolean
}

/** Draws the standard entries table (Datum/[Projekt]/Kategorie/Notizen/Stunden/[Betrag])
 * starting at `startY` and returns the Y position just below it, for placing a
 * totals line. Shared by the legacy week/month export, the Business Report,
 * and the Client Activity Report (via the options above). Row height and
 * page breaks are handled automatically by jspdf-autotable. */
export function drawEntriesTable(
  doc: jsPDF,
  entries: (TimeEntry | EnrichedEntry)[],
  projectName: (id: string) => string,
  startY: number,
  options: EntriesTableOptions = {},
): number {
  const { includeProjectColumn = true, includeAmountColumn = true } = options
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))

  const head = ['Datum']
  if (includeProjectColumn) head.push('Projekt')
  head.push('Kategorie', 'Notizen', 'Stunden')
  if (includeAmountColumn) head.push('Betrag')

  const notesColumnIndex = head.indexOf('Notizen')
  const hoursColumnIndex = head.indexOf('Stunden')
  const amountColumnIndex = includeAmountColumn ? head.length - 1 : -1

  autoTable(doc, {
    startY,
    head: [head],
    body: sorted.map((e) => {
      const row = [formatDateShort(e.date)]
      if (includeProjectColumn) row.push(projectName(e.projectId))
      row.push(
        e.category,
        e.notes ?? '',
        entryHours(e).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 }),
      )
      if (includeAmountColumn) row.push(entryAmount(e).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }))
      return row
    }),
    styles: { font: 'helvetica', fontSize: 9, textColor: PDF_COLORS.ink, cellPadding: 6 },
    headStyles: { fillColor: PDF_COLORS.sage, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: PDF_COLORS.rowAlt },
    columnStyles: {
      [notesColumnIndex]: { cellWidth: 160 },
      [hoursColumnIndex]: { halign: 'right', cellWidth: 55 },
      ...(includeAmountColumn ? { [amountColumnIndex]: { halign: 'right', cellWidth: 70 } } : {}),
    },
    margin: { left: 40, right: 40 },
  })

  return ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY) + 24
}

/** `totalAmount` is optional — omit it (Client Activity Report) to show only
 * "Gesamt: X h" with no monetary figure. */
export function drawTotalsLine(doc: jsPDF, totalHours: number, totalAmount: number | undefined, y: number): void {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...PDF_COLORS.ink)
  const hoursText = `${totalHours.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} h`
  const text =
    totalAmount === undefined
      ? `Gesamt: ${hoursText}`
      : `Gesamt: ${hoursText} · ${totalAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`
  doc.text(text, 40, y)
}

/** iOS (incl. iPadOS, which reports as "MacIntel" but has touch support) —
 * anchor-click-based downloads (what jsPDF's doc.save() uses under the
 * hood) are unreliable there regardless of how synchronous the call is, so
 * every report generator routes through `savePdf` below instead of calling
 * doc.save() directly. */

type ShareNavigator = Navigator & {
  canShare?: (data?: ShareData) => boolean
  share?: (data: ShareData) => Promise<void>
}

/** Cross-platform "give the user this PDF" step, logged at every branch so
 * a stuck export can be diagnosed on-device (see DebugOverlay) or via the
 * console.
 * - Desktop/Android: doc.save() (anchor-click download), unchanged.
 * - iOS: builds a Blob and opens the native Share Sheet via the Web Share
 *   API (lets the user save to Files, AirDrop, etc.); if that's not
 *   available, navigates `preOpenedWindow` (opened synchronously in the
 *   click handler — see platform.ts) to the blob URL instead of calling
 *   window.open() here, which Safari would silently block this deep into
 *   async work. */
export async function savePdf(doc: jsPDF, filename: string, preOpenedWindow: Window | null = null): Promise<void> {
  logDebug('pdf', 'savePdf called', { filename, isIOS: isIOS(), userAgent: navigator.userAgent })

  if (!isIOS()) {
    preOpenedWindow?.close()
    logDebug('pdf', 'non-iOS path: calling doc.save()')
    doc.save(filename)
    logDebug('pdf', 'doc.save() returned')
    return
  }

  logDebug('pdf', 'iOS path: building Blob via doc.output("blob")')
  const blob = doc.output('blob')
  logDebug('pdf', 'blob created', { bytes: blob.size })

  const nav = navigator as ShareNavigator
  if (nav.share && nav.canShare) {
    try {
      const file = new File([blob], filename, { type: 'application/pdf' })
      const canShareFile = nav.canShare({ files: [file] })
      logDebug('pdf', 'navigator.canShare({ files }) =', canShareFile)
      if (canShareFile) {
        preOpenedWindow?.close()
        logDebug('pdf', 'calling navigator.share() — Share Sheet should open now')
        await nav.share({ files: [file], title: filename })
        logDebug('pdf', 'navigator.share() resolved (share sheet closed)')
        return
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        logDebug('pdf', 'navigator.share() aborted by user — normal cancel, not an error')
        preOpenedWindow?.close()
        return
      }
      logDebug('pdf', 'navigator.share() threw, falling back', { error: String(err) })
    }
  } else {
    logDebug('pdf', 'Web Share API (files) not available on this browser, falling back')
  }

  const url = URL.createObjectURL(blob)
  if (preOpenedWindow) {
    logDebug('pdf', 'navigating the pre-opened tab to the blob URL')
    preOpenedWindow.location.href = url
  } else {
    logDebug('pdf', 'no pre-opened window available — calling window.open() now (Safari may block this)')
    const opened = window.open(url, '_blank')
    logDebug('pdf', 'window.open returned', { opened: Boolean(opened) })
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export async function exportActivityReport({
  title,
  subtitle,
  entries,
  projects,
  preOpenedWindow,
}: ExportOptions): Promise<void> {
  logDebug('pdf', 'exportActivityReport entered', { title, subtitle, entryCount: entries.length, projectCount: projects.length })
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? 'Unbekannt'
  const doc = createReportDocument()
  logDebug('pdf', 'jsPDF document instantiated')

  drawReportHeader(doc, 'Tätigkeitsnachweis', [title, subtitle])

  const finalY = drawEntriesTable(doc, entries, projectName, 104)
  drawTotalsLine(doc, sumHours(entries), sumAmount(entries), finalY)
  drawFooterNote(doc, 'Dies ist ein Tätigkeitsnachweis, keine Rechnung.')
  applyWatermarkToAllPages(doc)
  logDebug('pdf', 'PDF content finished (table, totals, footer, watermark drawn)')

  const filenameSafe = title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
  await savePdf(doc, `taetigkeitsnachweis-${filenameSafe}.pdf`, preOpenedWindow)
}
