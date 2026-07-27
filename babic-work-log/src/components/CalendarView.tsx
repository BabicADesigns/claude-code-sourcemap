import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { EntryList } from '@/components/EntryList'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Watermark } from '@/components/Watermark'
import { cn } from '@/services/utils'
import { addMonths, formatDateDisplay, formatMonthLabel, getMonthGrid, toISODate, WEEKDAY_SHORT_MONDAY_FIRST } from '@/services/date'
import type { EnrichedEntry, Project, TimeEntry } from '@/models'

export function CalendarView({
  entries,
  projects,
  onSelectEntry,
}: {
  entries: EnrichedEntry[]
  projects: Project[]
  onSelectEntry: (entry: TimeEntry) => void
}) {
  const [reference, setReference] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const grid = useMemo(() => getMonthGrid(reference), [reference])
  const projectById = new Map(projects.map((p) => [p.id, p]))

  const entriesByDay = useMemo(() => {
    const map = new Map<string, EnrichedEntry[]>()
    for (const e of entries) {
      const list = map.get(e.date) ?? []
      list.push(e)
      map.set(e.date, list)
    }
    return map
  }, [entries])

  const todayIso = toISODate(new Date())
  const dayEntries = selectedDay ? (entriesByDay.get(selectedDay) ?? []) : []

  return (
    <div className="relative">
      <Watermark size="sm" position="bottom-right" />
      <div className="relative z-10 space-y-4">
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

        <div className="grid grid-cols-7 gap-1 rounded-2xl bg-card p-3 shadow-soft">
          {WEEKDAY_SHORT_MONDAY_FIRST.map((d) => (
            <div key={d} className="pb-1 text-center text-[11px] font-medium text-muted-foreground">
              {d}
            </div>
          ))}
          {grid.map((day) => {
            const iso = toISODate(day)
            const inMonth = day.getMonth() === reference.getMonth()
            const dayList = entriesByDay.get(iso) ?? []
            const colors = [...new Set(dayList.map((e) => projectById.get(e.projectId)?.color ?? '#8B9B7A'))].slice(0, 4)
            return (
              <button
                key={iso}
                onClick={() => dayList.length > 0 && setSelectedDay(iso)}
                disabled={dayList.length === 0}
                className={cn(
                  'flex aspect-square flex-col items-center justify-center gap-1 rounded-lg text-sm transition-colors',
                  inMonth ? 'text-ink' : 'text-muted-foreground/40',
                  iso === todayIso && 'ring-1 ring-sage',
                  dayList.length > 0 && 'hover:bg-cream-dark',
                )}
              >
                <span>{day.getDate()}</span>
                <span className="flex h-1.5 gap-0.5">
                  {colors.map((c) => (
                    <span key={c} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c }} />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <Sheet open={selectedDay !== null} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <SheetContent open={selectedDay !== null} title={selectedDay ? formatDateDisplay(selectedDay) : ''}>
          <EntryList
            entries={dayEntries}
            projects={projects}
            onSelect={(entry) => {
              setSelectedDay(null)
              onSelectEntry(entry)
            }}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
