import { useState } from 'react'
import { WeekView } from '@/components/WeekView'
import { MonthView } from '@/components/MonthView'
import { CalendarView } from '@/components/CalendarView'
import { cn } from '@/services/utils'
import type { EnrichedEntry, Project, TimeEntry } from '@/models'

type SubView = 'week' | 'month' | 'calendar'

export function PeriodsView({
  entries,
  projects,
  onSelectEntry,
}: {
  entries: EnrichedEntry[]
  projects: Project[]
  onSelectEntry: (entry: TimeEntry) => void
}) {
  const [view, setView] = useState<SubView>('week')

  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-6">
      <div className="mb-4 inline-flex rounded-xl bg-cream-dark p-1">
        {(
          [
            ['week', 'Woche'],
            ['month', 'Monat'],
            ['calendar', 'Kalender'],
          ] as [SubView, string][]
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={cn(
              'rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors',
              view === v ? 'bg-white text-ink shadow-soft' : 'text-muted-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'week' && <WeekView entries={entries} projects={projects} onSelectEntry={onSelectEntry} />}
      {view === 'month' && <MonthView entries={entries} projects={projects} />}
      {view === 'calendar' && <CalendarView entries={entries} projects={projects} onSelectEntry={onSelectEntry} />}
    </div>
  )
}
