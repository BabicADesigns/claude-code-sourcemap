import { Plus, Clock, CalendarDays, CalendarRange, CircleDollarSign, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/StatCard'
import { EntryList } from '@/components/EntryList'
import {
  entriesThisMonth,
  entriesThisWeek,
  entriesToday,
  outstandingAmount,
  paidAmount,
  sumHours,
} from '@/lib/calculations'
import { formatCurrency, formatHours } from '@/lib/date'
import type { Project, TimeEntry } from '@/lib/types'

export function Dashboard({
  entries,
  projects,
  onNewEntry,
  onSelectEntry,
}: {
  entries: TimeEntry[]
  projects: Project[]
  onNewEntry: () => void
  onSelectEntry: (entry: TimeEntry) => void
}) {
  const today = entriesToday(entries)
  const week = entriesThisWeek(entries)
  const month = entriesThisMonth(entries)

  const recent = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    .slice(0, 8)

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 pb-28 pt-6">
      <header>
        <p className="text-sm text-muted-foreground">Willkommen zurück</p>
        <h1 className="font-display text-2xl text-ink">Babic Work Log</h1>
      </header>

      <Button size="lg" className="w-full" onClick={onNewEntry}>
        <Plus className="h-5 w-5" />
        Neuer Eintrag
      </Button>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Heute gearbeitet"
          value={formatHours(sumHours(today))}
          accent="sage"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          label="Diese Woche"
          value={formatHours(sumHours(week))}
          accent="adriatic"
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <StatCard
          label="Dieser Monat"
          value={formatHours(sumHours(month))}
          accent="gold"
          icon={<CalendarRange className="h-4 w-4" />}
        />
        <StatCard
          label="Offene Beträge"
          value={formatCurrency(outstandingAmount(entries))}
          accent="rose"
          icon={<CircleDollarSign className="h-4 w-4" />}
        />
      </div>

      <StatCard
        label="Bereits bezahlt"
        value={formatCurrency(paidAmount(entries))}
        sub="Gesamt seit Beginn"
        accent="sage"
        icon={<CheckCircle2 className="h-4 w-4" />}
      />

      <section>
        <h2 className="mb-2 font-display text-lg text-ink">Letzte Einträge</h2>
        <EntryList entries={recent} projects={projects} onSelect={onSelectEntry} showDate emptyLabel="Noch keine Einträge – leg los!" />
      </section>
    </div>
  )
}
