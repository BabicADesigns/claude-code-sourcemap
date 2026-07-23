import { useEffect, useMemo, useState } from 'react'
import { FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/services/utils'
import { todayISO } from '@/services/date'
import { logDebug } from '@/services/debugLog'
import { openIOSPlaceholderWindow } from '@/services/platform'
import type { Client, EnrichedEntry, Project } from '@/models'
import {
  REPORT_PERIOD_TYPE_LABELS,
  REPORT_PERIOD_TYPE_ORDER,
  REPORT_TYPE_LABELS,
  resolveReportPeriod,
} from '../models'
import type { ReportConfig, ReportPeriodType, ReportType } from '../models'

export function ReportBuilderSheet({
  clients,
  projects,
  entries,
  initialProjectId,
  onClose,
  onOpenClientActivityReport,
}: {
  clients: Client[]
  projects: Project[]
  entries: EnrichedEntry[]
  initialProjectId?: string | null
  onClose: () => void
  /** Client Activity Report's primary format is now an in-app HTML page
   * (see ClientActivityReportPage), not an immediate PDF — this hands the
   * resolved config up to App.tsx to open it. Business Report is
   * unaffected: it still generates a PDF immediately, exactly as before. */
  onOpenClientActivityReport: (config: ReportConfig) => void
}) {
  const [reportType, setReportType] = useState<ReportType>(initialProjectId ? 'client_activity' : 'business')
  const [projectId, setProjectId] = useState(initialProjectId ?? '')
  const [periodType, setPeriodType] = useState<ReportPeriodType>('week')
  const [customStart, setCustomStart] = useState(todayISO())
  const [customEnd, setCustomEnd] = useState(todayISO())
  const [generating, setGenerating] = useState(false)

  // Warm the jsPDF chunk as soon as the builder opens — by the time the user
  // finishes picking type/project/period, it's already cached. See
  // WeekView.tsx for why this matters on iOS Safari.
  useEffect(() => {
    void import('../services/pdf')
  }, [])

  useEffect(() => {
    if (initialProjectId) {
      setReportType('client_activity')
      setProjectId(initialProjectId)
    }
  }, [initialProjectId])

  const projectsByClient = useMemo(() => {
    const map = new Map<string, Project[]>()
    for (const p of projects) {
      const list = map.get(p.clientId) ?? []
      list.push(p)
      map.set(p.clientId, list)
    }
    return map
  }, [projects])

  const clientsById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients])

  const canGenerate = reportType === 'business' || Boolean(projectId)

  async function handleGenerate() {
    logDebug('reports', 'Bericht erstellen clicked', { reportType, projectId, periodType })
    if (!canGenerate) {
      logDebug('reports', 'canGenerate is false, aborting (missing project for client_activity report)')
      return
    }
    const period = resolveReportPeriod(periodType, new Date(), { start: customStart, end: customEnd })
    logDebug('reports', 'resolved period', period)

    if (reportType === 'client_activity') {
      // No PDF generation here anymore — this now just opens the in-app
      // HTML report page (the new primary format). No async work, no
      // Safari gesture-timing concerns, nothing that can leave the user
      // staring at a stuck blank tab.
      onOpenClientActivityReport({ type: 'client_activity', projectId, period })
      return
    }

    // Business Report: unchanged — still an immediate PDF.
    // Must happen synchronously, before any await — see platform.ts.
    const preOpenedWindow = openIOSPlaceholderWindow()
    setGenerating(true)
    try {
      const { generateBusinessReport } = await import('../services/pdf')
      logDebug('reports', 'pdf module loaded')
      logDebug('reports', 'calling generateBusinessReport', { entriesAvailable: entries.length })
      await generateBusinessReport({ type: 'business', period }, { entries, projects }, preOpenedWindow)
      logDebug('reports', 'report generation resolved')
      onClose()
    } catch (err) {
      // Without this, a failure here (e.g. the dynamic import above 404ing
      // because this tab has been open since before the latest deploy, and
      // is still holding an old build's hashed chunk filename that no
      // longer exists) was a silent, unhandled rejection: the pre-opened
      // placeholder tab was never closed or navigated, so it just sat at
      // about:blank forever with no error and no explanation.
      logDebug('reports', 'report generation failed', { error: String(err) })
      preOpenedWindow?.close()
      window.alert(
        'PDF konnte nicht erstellt werden. Das passiert meist, wenn diese Seite schon länger geöffnet ist und zwischenzeitlich eine neue Version veröffentlicht wurde. Bitte lade die Seite komplett neu und versuche es erneut.',
      )
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-5 pb-6">
      <div>
        <Label>Berichtstyp</Label>
        <div className="inline-flex rounded-xl bg-cream-dark p-1">
          {(['business', 'client_activity'] as ReportType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setReportType(t)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                reportType === t ? 'bg-white text-ink shadow-soft' : 'text-muted-foreground',
              )}
            >
              {REPORT_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {reportType === 'business'
            ? 'Alle Projekte mit Einträgen im gewählten Zeitraum, inklusive Finanzangaben — für dich.'
            : 'Nur ein Projekt, als übersichtlicher Bericht direkt in der App — ohne Finanzangaben, PDF optional.'}
        </p>
      </div>

      {reportType === 'client_activity' && (
        <div>
          <Label htmlFor="report-project">Projekt</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger id="report-project">
              <SelectValue placeholder="Projekt wählen" />
            </SelectTrigger>
            <SelectContent>
              {[...projectsByClient.entries()].map(([clientId, clientProjects]) => (
                <SelectGroup key={clientId}>
                  <SelectLabel>{clientsById.get(clientId)?.name ?? 'Ohne Kunde'}</SelectLabel>
                  {clientProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: p.color }} />
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label>Zeitraum</Label>
        <div className="inline-flex rounded-xl bg-cream-dark p-1">
          {REPORT_PERIOD_TYPE_ORDER.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPeriodType(t)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                periodType === t ? 'bg-white text-ink shadow-soft' : 'text-muted-foreground',
              )}
            >
              {REPORT_PERIOD_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        {periodType === 'custom' && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="report-start">Von</Label>
              <Input id="report-start" type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="report-end">Bis</Label>
              <Input id="report-end" type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      <Button className="w-full" size="lg" disabled={!canGenerate || generating} onClick={handleGenerate}>
        <FileDown className="h-4 w-4" />
        {generating ? 'Erstelle PDF …' : reportType === 'client_activity' ? 'Bericht öffnen' : 'PDF erstellen'}
      </Button>
    </div>
  )
}
