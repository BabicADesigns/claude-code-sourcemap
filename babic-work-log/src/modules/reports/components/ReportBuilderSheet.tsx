import { useEffect, useMemo, useState } from 'react'
import { FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/services/utils'
import { todayISO } from '@/services/date'
import type { Client, EnrichedEntry, Project } from '@/models'
import {
  REPORT_PERIOD_TYPE_LABELS,
  REPORT_PERIOD_TYPE_ORDER,
  REPORT_TYPE_LABELS,
  resolveReportPeriod,
} from '../models'
import type { ReportPeriodType, ReportType } from '../models'

export function ReportBuilderSheet({
  clients,
  projects,
  entries,
  initialProjectId,
  onClose,
}: {
  clients: Client[]
  projects: Project[]
  entries: EnrichedEntry[]
  initialProjectId?: string | null
  onClose: () => void
}) {
  const [reportType, setReportType] = useState<ReportType>(initialProjectId ? 'client_activity' : 'business')
  const [projectId, setProjectId] = useState(initialProjectId ?? '')
  const [periodType, setPeriodType] = useState<ReportPeriodType>('week')
  const [customStart, setCustomStart] = useState(todayISO())
  const [customEnd, setCustomEnd] = useState(todayISO())
  const [includeFinancials, setIncludeFinancials] = useState(false)
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
    console.log('[reports] PDF erstellen clicked', { reportType, projectId, periodType, includeFinancials })
    if (!canGenerate) {
      console.log('[reports] canGenerate is false, aborting (missing project for client_activity report)')
      return
    }
    setGenerating(true)
    try {
      const period = resolveReportPeriod(periodType, new Date(), { start: customStart, end: customEnd })
      console.log('[reports] resolved period', period)
      const { generateBusinessReport, generateClientActivityReport } = await import('../services/pdf')
      console.log('[reports] pdf module loaded')

      if (reportType === 'business') {
        console.log('[reports] calling generateBusinessReport, entries available:', entries.length)
        await generateBusinessReport({ type: 'business', period, includeFinancials: true }, { entries, projects })
      } else {
        console.log(
          '[reports] calling generateClientActivityReport, entries available for project:',
          entries.filter((e) => e.projectId === projectId).length,
        )
        await generateClientActivityReport(
          { type: 'client_activity', projectId, period, includeFinancials },
          { entries, projects, clients },
        )
      }
      console.log('[reports] report generation resolved')
      onClose()
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
            : 'Nur ein Projekt, chronologische Timeline, ohne Finanzangaben (optional zuschaltbar) — für deinen Kunden.'}
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

      {reportType === 'client_activity' && (
        <div>
          <Label>Finanzielle Informationen</Label>
          <div className="inline-flex rounded-xl bg-cream-dark p-1">
            {([false, true] as const).map((on) => (
              <button
                key={String(on)}
                type="button"
                onClick={() => setIncludeFinancials(on)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  includeFinancials === on ? 'bg-white text-ink shadow-soft' : 'text-muted-foreground',
                )}
              >
                {on ? 'Ein' : 'Aus'}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {includeFinancials
              ? 'Stundensatz, Beträge und Gesamtsumme werden angezeigt.'
              : 'Standard — keine Stundensätze, Beträge oder Summen sichtbar.'}
          </p>
        </div>
      )}

      <Button className="w-full" size="lg" disabled={!canGenerate || generating} onClick={handleGenerate}>
        <FileDown className="h-4 w-4" />
        {generating ? 'Erstelle PDF …' : 'PDF erstellen'}
      </Button>
    </div>
  )
}
