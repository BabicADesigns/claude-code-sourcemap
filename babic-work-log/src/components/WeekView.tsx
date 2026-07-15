import { useState } from 'react'
import { ChevronLeft, ChevronRight, FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EntryList } from '@/components/EntryList'
import { entriesInRange, sumAmount, sumHours } from '@/lib/calculations'
import { addWeeks, endOfWeek, formatWeekLabel, startOfWeek } from '@/lib/date'
import { formatCurrency, formatHours } from '@/lib/date'
import type { Project, TimeEntry } from '@/lib/types'

export function WeekView({
  entries,
  projects,
  onSelectEntry,
}: {
  entries: TimeEntry[]
  projects: Project[]
  onSelectEntry: (entry: TimeEntry) => void
}) {
  const [reference, setReference] = useState(new Date())
  const start = startOfWeek(reference)
  const end = endOfWeek(reference)
  const weekEntries = entriesInRange(entries, start, end)

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 pb-28 pt-6">
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
            const { exportActivityReport } = await import('@/lib/pdf')
            exportActivityReport({
              title: 'Wochenübersicht',
              subtitle: formatWeekLabel(reference),
              entries: weekEntries,
              projects,
            })
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
