import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Watermark } from '@/components/Watermark'
import { entriesInRange, summarizeByProject, sumAmount, sumHours } from '@/services/calculations'
import { addMonths, endOfMonth, formatCurrency, formatHours, formatMonthLabel, startOfMonth } from '@/services/date'
import type { EnrichedEntry, Project } from '@/models'

export function MonthView({ entries, projects }: { entries: EnrichedEntry[]; projects: Project[] }) {
  // See WeekView.tsx for why this prefetch matters on iOS Safari.
  useEffect(() => {
    void import('@/services/pdf')
  }, [])

  const [reference, setReference] = useState(new Date())
  const start = startOfMonth(reference)
  const end = endOfMonth(reference)
  const monthEntries = entriesInRange(entries, start, end)
  const byProject = summarizeByProject(monthEntries)
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? 'Unbekannt'
  const totalAmount = sumAmount(monthEntries)

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <button
          onClick={() => setReference((d) => addMonths(d, -1))}
          className="rounded-full p-2 text-muted-foreground hover:bg-cream-dark"
          aria-label="Vorheriger Monat"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg text-ink">{formatMonthLabel(reference)}</h1>
        <button
          onClick={() => setReference((d) => addMonths(d, 1))}
          className="rounded-full p-2 text-muted-foreground hover:bg-cream-dark"
          aria-label="Nächster Monat"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 rounded-2xl bg-card p-4 shadow-soft">
        <div>
          <p className="text-xs text-muted-foreground">Gesamtstunden</p>
          <p className="font-display text-xl text-ink">{formatHours(sumHours(monthEntries))}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Gesamtumsatz</p>
          <p className="font-display text-xl text-ink">{formatCurrency(totalAmount)}</p>
        </div>
      </div>

      {monthEntries.length > 0 && (
        <Button
          variant="secondary"
          className="w-full"
          onClick={async () => {
            console.log('[pdf] PDF button clicked (MonthView)', { entryCount: monthEntries.length })
            const { exportActivityReport } = await import('@/services/pdf')
            console.log('[pdf] module loaded, calling exportActivityReport')
            await exportActivityReport({
              title: 'Monatsübersicht',
              subtitle: formatMonthLabel(reference),
              entries: monthEntries,
              projects,
            })
            console.log('[pdf] exportActivityReport resolved')
          }}
        >
          <FileDown className="h-4 w-4" />
          Als PDF exportieren
        </Button>
      )}

      <section className="relative">
        <Watermark size="sm" position="top-right" />
        <div className="relative z-10">
          <h2 className="mb-2 font-display text-lg text-ink">Projektübersicht</h2>
          {byProject.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Keine Einträge in diesem Monat.</p>
          ) : (
            <ul className="space-y-2">
              {byProject.map((row) => (
                <li key={row.projectId} className="rounded-2xl bg-card p-4 shadow-soft">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-ink">{projectName(row.projectId)}</p>
                    <p className="font-medium text-ink">{formatCurrency(row.amount)}</p>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-cream-dark">
                    <div
                      className="h-full rounded-full bg-sage"
                      style={{ width: totalAmount > 0 ? `${Math.round((row.amount / totalAmount) * 100)}%` : '0%' }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">{formatHours(row.hours)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
