import { useState } from 'react'
import {
  Plus,
  Clock,
  CalendarDays,
  CalendarRange,
  CircleDollarSign,
  CheckCircle2,
  Gauge,
  ClipboardCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/StatCard'
import { EntryList } from '@/components/EntryList'
import { TimerCard } from '@/components/TimerCard'
import { BusinessHealthCard } from '@/components/BusinessHealthCard'
import { BackupCard } from '@/components/BackupCard'
import { DayCloseContent } from '@/components/DayCloseSheet'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Watermark } from '@/components/Watermark'
import {
  averageHourlyRate,
  computeBusinessHealth,
  computeDayClose,
  entriesThisMonth,
  entriesThisWeek,
  entriesToday,
  outstandingAmount,
  paidAmount,
  sumHours,
} from '@/lib/calculations'
import { formatCurrency, formatHours } from '@/lib/date'
import type { EnrichedEntry, Project, TimeEntry } from '@/lib/types'
import type { UseTimerReturn, StoppedTimer } from '@/hooks/useTimer'

export function Dashboard({
  entries,
  projects,
  timer,
  lastBackupAt,
  onNewEntry,
  onSelectEntry,
  onTimerStopped,
  onOpenBackup,
}: {
  entries: EnrichedEntry[]
  projects: Project[]
  timer: UseTimerReturn
  lastBackupAt: number | null
  onNewEntry: () => void
  onSelectEntry: (entry: TimeEntry) => void
  onTimerStopped: (result: StoppedTimer) => void
  onOpenBackup: () => void
}) {
  const [dayCloseOpen, setDayCloseOpen] = useState(false)

  const today = entriesToday(entries)
  const week = entriesThisWeek(entries)
  const month = entriesThisMonth(entries)
  const health = computeBusinessHealth(entries)
  const dayClose = computeDayClose(entries)

  const recent = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    .slice(0, 8)

  return (
    <div className="relative">
      <Watermark size="lg" position="center" />
      <div className="relative z-10 mx-auto max-w-lg space-y-5 px-4 pb-28 pt-6">
        <header>
          <p className="text-sm text-muted-foreground">Willkommen zurück</p>
          <h1 className="font-display text-2xl text-ink">Babic Work Log</h1>
        </header>

        <Button size="lg" className="w-full" onClick={onNewEntry}>
          <Plus className="h-5 w-5" />
          Neuer Eintrag
        </Button>

        <TimerCard timer={timer} projects={projects} onStopped={onTimerStopped} />

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
            label="Offene Forderungen"
            value={formatCurrency(outstandingAmount(entries))}
            accent="rose"
            icon={<CircleDollarSign className="h-4 w-4" />}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Bereits bezahlt"
            value={formatCurrency(paidAmount(entries))}
            accent="sage"
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <StatCard
            label="Ø Stundenlohn"
            value={formatCurrency(averageHourlyRate(entries))}
            accent="adriatic"
            icon={<Gauge className="h-4 w-4" />}
          />
        </div>

        <BusinessHealthCard health={health} projects={projects} />

        <BackupCard lastBackupAt={lastBackupAt} onOpen={onOpenBackup} />

        <Button variant="secondary" size="lg" className="w-full" onClick={() => setDayCloseOpen(true)}>
          <ClipboardCheck className="h-5 w-5" />
          Tag abschließen
        </Button>

        <section>
          <h2 className="mb-2 font-display text-lg text-ink">Letzte Einträge</h2>
          <EntryList
            entries={recent}
            projects={projects}
            onSelect={onSelectEntry}
            showDate
            emptyLabel="Noch keine Einträge – leg los!"
          />
        </section>
      </div>

      <Sheet open={dayCloseOpen} onOpenChange={setDayCloseOpen}>
        <SheetContent open={dayCloseOpen} title="Tagesabschluss">
          <DayCloseContent summary={dayClose} projects={projects} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
