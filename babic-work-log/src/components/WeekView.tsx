import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EntryList } from '@/components/EntryList'
import { entriesInRange, sumAmount, sumHours } from '@/services/calculations'
import { addWeeks, endOfWeek, formatWeekLabel, startOfWeek } from '@/services/date'
import { formatCurrency, formatHours } from '@/services/date'
import type { EnrichedEntry, Project, TimeEntry } from '@/models'

export function WeekView({
  entries,
  projects,
  onSelectEntry,
}: {
  entries: EnrichedEntry[]
  projects: Project[]
  onSelectEntry: (entry: TimeEntry) => void
}) {
  // Warm the PDF chunk ahead of time so the export click handler's `await
  // import(...)` resolves from cache (a microtask) instead of a network
  // fetch (a macrotask) — iOS Safari drops user-activation across a
  // macrotask, which otherwise silently blocks doc.save()'s download.
  useEffect(() => {
    void import('@/services/pdf')
  }, [])

  const [reference, setReference] = useState(new Date())
  const start = startOfWeek(reference)
  const end = endOfWeek(reference)
  const weekEntries = entriesInRange(entries, start, end)

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <button
          onClick={() => setReference((d) => addWeeks(d, -1))}
          className="rounded-full p-2 text-muted-foreground hover:bg-cream-dark"
          aria-label="Vorherige Woche"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg text-ink">{formatWeekLabel(reference)}</h1>
        <button
          onClick={() => setReference((d) => addWeeks(d, 1))}
          className="rounded-full p-2 text-muted-foreground hover:bg-cream-dark"
          aria-label="Nächste Woche"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 rounded-2xl bg-card p-4 shadow-soft">
        <div>
          <p className="text-xs text-muted-foreground">Stunden</p>
          <p className="font-display text-xl text-ink">{formatHours(sumHours(weekEntries))}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Betrag</p>
          <p className="font-display text-xl text-ink">{formatCurrency(sumAmount(weekEntries))}</p>
        </div>
      </div>

      {weekEntries.length > 0 && (
        <Button
          variant="secondary"
          className="w-full"
          onClick={async () => {
            console.log('[pdf] PDF button clicked (WeekView)', { entryCount: weekEntries.length })
            const { exportActivityReport } = await import('@/services/pdf')
            console.log('[pdf] module loaded, calling exportActivityReport')
            await exportActivityReport({
              title: 'Wochenübersicht',
              subtitle: formatWeekLabel(reference),
              entries: weekEntries,
              projects,
            })
            console.log('[pdf] exportActivityReport resolved')
          }}
        >
          <FileDown className="h-4 w-4" />
          Als PDF exportieren
        </Button>
      )}

      <EntryList entries={weekEntries} projects={projects} onSelect={onSelectEntry} showDate />
    </div>
  )
}
