import { useMemo, useRef, useState } from 'react'
import { Download, Printer, Share2, FileDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logDebug } from '@/services/debugLog'
import { openIOSPlaceholderWindow } from '@/services/platform'
import type { Client, EnrichedEntry, Project } from '@/models'
import type { ReportConfig } from '../models'
import { buildClientActivityReportData } from '../services/reportData'

type ShareNavigator = Navigator & {
  canShare?: (data?: ShareData) => boolean
  share?: (data: ShareData) => Promise<void>
}

const REPORT_DOM_ID = 'client-activity-report-print'

function slugify(text: string): string {
  return text.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
}

/**
 * The primary Client Activity Report format: a beautiful HTML page rendered
 * directly in the app — no PDF viewer, no Safari PDF rendering, no Share
 * API dependency to just *view* the report. PDF export is kept, but moved
 * to an optional secondary button (see handleExportPdf below), reusing the
 * existing, already-hardened generator unchanged.
 */
export function ClientActivityReportPage({
  config,
  entries,
  projects,
  clients,
  onClose,
}: {
  config: ReportConfig
  entries: EnrichedEntry[]
  projects: Project[]
  clients: Client[]
  onClose: () => void
}) {
  const data = useMemo(() => buildClientActivityReportData(config, { entries, projects, clients }), [config, entries, projects, clients])
  const reportRef = useRef<HTMLDivElement>(null)
  const [capturing, setCapturing] = useState<'image' | 'share' | null>(null)
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const baseFilename = `kundenbericht-${slugify(data.projectName)}-${config.period.start}-${config.period.end}`

  async function captureCanvas(): Promise<HTMLCanvasElement> {
    logDebug('reports', 'capturing report as image via html2canvas')
    const { default: html2canvas } = await import('html2canvas')
    if (!reportRef.current) throw new Error('report node not mounted')
    const canvas = await html2canvas(reportRef.current, {
      scale: Math.max(2, window.devicePixelRatio || 1),
      backgroundColor: '#ffffff',
      useCORS: true,
    })
    logDebug('reports', 'html2canvas capture done', { width: canvas.width, height: canvas.height })
    return canvas
  }

  function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob returned null'))), 'image/png')
    })
  }

  async function handleSaveImage() {
    logDebug('reports', 'Bild speichern clicked')
    setCapturing('image')
    try {
      const canvas = await captureCanvas()
      const blob = await canvasToBlob(canvas)
      const filename = `${baseFilename}.png`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 30_000)
      logDebug('reports', 'image download triggered', { filename })
      // Always also show the preview — the download above is reliable on
      // desktop/Android, but iOS Safari doesn't consistently surface an
      // anchor download as a visible "saved" moment, so the preview (with
      // a long-press-to-save image) is the dependable path there.
      setPreviewImage(canvas.toDataURL('image/png'))
    } catch (err) {
      logDebug('reports', 'image capture failed', { error: String(err) })
      window.alert('Bild konnte nicht erstellt werden. Bitte versuche es erneut.')
    } finally {
      setCapturing(null)
    }
  }

  async function handleShare() {
    logDebug('reports', 'Teilen clicked')
    setCapturing('share')
    try {
      const canvas = await captureCanvas()
      const blob = await canvasToBlob(canvas)
      const filename = `${baseFilename}.png`
      const file = new File([blob], filename, { type: 'image/png' })
      const nav = navigator as ShareNavigator
      if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
        try {
          logDebug('reports', 'calling navigator.share() with image file')
          await nav.share({ files: [file], title: filename })
          logDebug('reports', 'navigator.share() resolved')
          return
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            logDebug('reports', 'share aborted by user — normal cancel')
            return
          }
          logDebug('reports', 'navigator.share() threw, falling back to preview', { error: String(err) })
        }
      } else {
        logDebug('reports', 'Web Share API (files) not available, falling back to preview')
      }
      setPreviewImage(canvas.toDataURL('image/png'))
    } catch (err) {
      logDebug('reports', 'share failed', { error: String(err) })
      window.alert('Teilen ist fehlgeschlagen. Bitte versuche es erneut.')
    } finally {
      setCapturing(null)
    }
  }

  function handlePrint() {
    logDebug('reports', 'print requested')
    window.print()
  }

  async function handleExportPdf() {
    logDebug('reports', 'optional PDF export clicked')
    const preOpenedWindow = openIOSPlaceholderWindow()
    setPdfGenerating(true)
    try {
      const { generateClientActivityReport } = await import('../services/pdf')
      logDebug('reports', 'pdf module loaded')
      await generateClientActivityReport(config, { entries, projects, clients }, preOpenedWindow)
      logDebug('reports', 'optional PDF export resolved')
    } catch (err) {
      logDebug('reports', 'optional PDF export failed', { error: String(err) })
      preOpenedWindow?.close()
      window.alert(
        'PDF konnte nicht erstellt werden. Das passiert meist, wenn diese Seite schon länger geöffnet ist und zwischenzeitlich eine neue Version veröffentlicht wurde. Bitte lade die Seite komplett neu und versuche es erneut.',
      )
    } finally {
      setPdfGenerating(false)
    }
  }

  const busy = capturing !== null

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={handleSaveImage} disabled={busy}>
          <Download className="h-3.5 w-3.5" />
          {capturing === 'image' ? 'Erstelle Bild …' : '📸 Bild speichern'}
        </Button>
        <Button variant="secondary" size="sm" onClick={handleShare} disabled={busy}>
          <Share2 className="h-3.5 w-3.5" />
          {capturing === 'share' ? 'Erstelle Bild …' : '📤 Teilen'}
        </Button>
        <Button variant="secondary" size="sm" onClick={handlePrint} disabled={busy}>
          <Printer className="h-3.5 w-3.5" />
          🖨 Drucken
        </Button>
        <Button variant="ghost" size="sm" onClick={handleExportPdf} disabled={pdfGenerating}>
          <FileDown className="h-3.5 w-3.5" />
          {pdfGenerating ? 'Erstelle PDF …' : '📄 PDF exportieren (optional)'}
        </Button>
      </div>

      <div
        id={REPORT_DOM_ID}
        ref={reportRef}
        className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-border bg-white text-ink shadow-soft"
      >
        <div className="bg-sage px-6 py-4 text-white sm:px-8">
          <p className="text-xs uppercase tracking-wide text-white/80">Babic Work Log</p>
          <h1 className="font-display text-2xl">Aktivitätsbericht</h1>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-6 py-5 text-sm sm:px-8">
          <ReportField label="Kunde" value={data.clientName} />
          <ReportField label="Projekt" value={data.projectName} />
          <ReportField label="Zeitraum" value={data.periodLabel} />
          <ReportField label="Erstellt am" value={data.generatedOnLabel} />
        </div>

        <div className="overflow-x-auto px-6 sm:px-8">
          <table className="w-full min-w-[480px] border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-sage text-white">
                <th className="whitespace-nowrap rounded-tl-lg px-2.5 py-2 font-medium sm:px-3">Datum</th>
                <th className="whitespace-nowrap px-2.5 py-2 font-medium sm:px-3">Start</th>
                <th className="whitespace-nowrap px-2.5 py-2 font-medium sm:px-3">Ende</th>
                <th className="whitespace-nowrap px-2.5 py-2 font-medium sm:px-3">Dauer</th>
                <th className="w-full rounded-tr-lg px-2.5 py-2 font-medium sm:px-3">Aktivität</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2.5 py-4 text-center text-muted-foreground sm:px-3">
                    Keine Einträge in diesem Zeitraum.
                  </td>
                </tr>
              ) : (
                data.rows.map((row, i) => (
                  <tr key={row.entryId} className={i % 2 === 1 ? 'bg-cream-dark' : undefined}>
                    <td className="whitespace-nowrap px-2.5 py-2 align-top sm:px-3">{row.dateLabel}</td>
                    <td className="whitespace-nowrap px-2.5 py-2 align-top sm:px-3">{row.start}</td>
                    <td className="whitespace-nowrap px-2.5 py-2 align-top sm:px-3">{row.end}</td>
                    <td className="whitespace-nowrap px-2.5 py-2 align-top sm:px-3">{row.durationLabel}</td>
                    <td className="px-2.5 py-2 align-top sm:px-3">{row.activity}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 pb-2 pt-4 text-right text-sm font-bold sm:px-8">Gesamt: {data.totalHoursLabel}</div>

        <div className="space-y-4 px-6 py-5 sm:px-8">
          <h2 className="font-display text-lg">Zusammenfassung</h2>

          {data.topics.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Themen in diesem Zeitraum
              </p>
              <div className="flex flex-wrap gap-1.5">
                {data.topics.map((topic) => (
                  <span key={topic} className="rounded-full bg-cream-dark px-2.5 py-1 text-xs text-ink">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.notes.length > 0 ? (
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Notizen</p>
              <ul className="space-y-1 text-sm">
                {data.notes.map((note) => (
                  <li key={note.entryId}>
                    <span className="text-muted-foreground">{note.dateLabel}:</span> {note.text}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            data.topics.length === 0 && (
              <p className="text-sm text-muted-foreground">Keine zusätzlichen Notizen für diesen Zeitraum.</p>
            )
          )}
        </div>

        <div className="border-t border-border px-6 py-4 text-[11px] text-muted-foreground sm:px-8">
          <p>Dies ist ein Tätigkeitsnachweis, keine Rechnung.</p>
          <p className="mt-1">© {new Date().getFullYear()} BabicADesigns</p>
        </div>
      </div>

      <div className="no-print flex justify-center">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Schließen
        </Button>
      </div>

      {previewImage && <ImagePreviewModal src={previewImage} filename={`${baseFilename}.png`} onClose={() => setPreviewImage(null)} />}
    </div>
  )
}

function ReportField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium text-ink">{value}</p>
    </div>
  )
}

/** Shown after image capture so the user always has a way to actually get
 * the picture even when neither the anchor download nor navigator.share
 * panned out — long-pressing an <img> to save it is a native gesture every
 * mobile browser supports, with nothing left for us to get wrong. */
function ImagePreviewModal({ src, filename, onClose }: { src: string; filename: string; onClose: () => void }) {
  return (
    <div className="no-print fixed inset-0 z-[60] flex flex-col bg-ink/90 p-4">
      <div className="flex items-center justify-between text-white">
        <p className="text-sm">Bild halten, um es zu speichern</p>
        <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/10" aria-label="Schließen">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-4 flex flex-1 items-center justify-center overflow-auto">
        <img src={src} alt={filename} className="max-h-full max-w-full rounded-lg shadow-card" />
      </div>
      <a
        href={src}
        download={filename}
        className="mt-4 self-center rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-ink"
      >
        Herunterladen
      </a>
    </div>
  )
}
