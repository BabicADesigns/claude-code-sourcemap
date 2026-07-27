import { useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Plus,
  Clock,
  CalendarDays,
  CalendarRange,
  CircleDollarSign,
  CheckCircle2,
  Gauge,
  ClipboardCheck,
  Play,
  FolderPlus,
  ShieldCheck,
  Settings,
  FileDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/StatCard'
import { EntryList } from '@/components/EntryList'
import { TimerCard } from '@/components/TimerCard'
import { TimerStopDialog, type TimerStopConfirmation } from '@/components/TimerStopDialog'
import { BusinessHealthCard } from '@/components/BusinessHealthCard'
import { BackupCard } from '@/components/BackupCard'
import { DayCloseContent } from '@/components/DayCloseSheet'
import { SettingsSheet } from '@/components/SettingsSheet'
import { StandaloneRecoveryBanner } from '@/components/StandaloneRecoveryBanner'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Watermark } from '@/components/Watermark'
import { BusinessFinanceCards } from '@/modules/finance/components/BusinessFinanceCards'
import { BusinessHealthSummary } from '@/modules/finance/components/BusinessHealthSummary'
import { computeBusinessFinance, computeBusinessHealthSummary } from '@/modules/finance/services/calculations'
import { computeReceivables, sumOpenReceivables, sumReceivablesPaid } from '@/modules/finance/services/receivables'
import { currentMonthKey } from '@/modules/finance/models'
import type { ClientFinanceSettings, Payment } from '@/modules/finance/models'
import {
  averageHourlyRate,
  computeBusinessHealth,
  computeDayClose,
  entriesThisMonth,
  entriesThisWeek,
  entriesToday,
  outstandingAmount,
  sumHours,
} from '@/services/calculations'
import { addWeeks, formatCurrency, formatHours } from '@/services/date'
import type { Client, EnrichedEntry, Project, TimeEntry } from '@/models'
import type { UseTimerReturn, StoppedTimer } from '@/hooks/useTimer'

export function Dashboard({
  entries,
  projects,
  clients,
  payments,
  clientFinanceSettings,
  timer,
  lastBackupAt,
  onNewEntry,
  onSelectEntry,
  onCreateEntryFromTimer,
  onOpenBackup,
  onNavigateToProjects,
  onOpenReports,
}: {
  entries: EnrichedEntry[]
  projects: Project[]
  clients: Client[]
  payments: Payment[]
  clientFinanceSettings: ClientFinanceSettings[]
  timer: UseTimerReturn
  lastBackupAt: number | null
  onNewEntry: () => void
  onSelectEntry: (entry: TimeEntry) => void
  onCreateEntryFromTimer: (data: TimerStopConfirmation & { hours: number }) => void
  onOpenBackup: () => void
  onNavigateToProjects: () => void
  onOpenReports: () => void
}) {
  const [dayCloseOpen, setDayCloseOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [pendingTimerResult, setPendingTimerResult] = useState<StoppedTimer | null>(null)
  const timerCardRef = useRef<HTMLDivElement>(null)

  const today = entriesToday(entries)
  const week = entriesThisWeek(entries)
  const month = entriesThisMonth(entries)
  const financeMonthKey = currentMonthKey()
  const businessFinance = computeBusinessFinance(payments, clientFinanceSettings, financeMonthKey)
  const businessHealthSummary = computeBusinessHealthSummary(payments, clientFinanceSettings)

  // Retainer clients are billed a flat monthly amount, not per logged hour —
  // their entries must never separately count as owed on top of that
  // payment (that's the double-counting bug this replaces). Everyone else
  // keeps the existing per-entry status/EntryPayment accounting.
  const receivables = computeReceivables(entries, projects, clientFinanceSettings, payments)
  const openReceivablesTotal = sumOpenReceivables(receivables)
  const receivablesPaidTotal = sumReceivablesPaid(receivables)
  const retainerClientIds = new Set(
    clientFinanceSettings
      .filter((s) => s.incomeModel === 'monthly_retainer' && (s.defaultRetainerAmount ?? 0) > 0)
      .map((s) => s.clientId),
  )
  const clientIdForProject = new Map(projects.map((p) => [p.id, p.clientId]))
  const billableEntries = entries.filter((e) => {
    const clientId = clientIdForProject.get(e.projectId)
    return !clientId || !retainerClientIds.has(clientId)
  })
  const health = {
    ...computeBusinessHealth(entries),
    outstanding: outstandingAmount(entriesThisWeek(billableEntries, addWeeks(new Date(), -1))),
  }
  const dayClose = { ...computeDayClose(entries), outstanding: outstandingAmount(entriesToday(billableEntries)) }

  const recentActivity = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    .slice(0, 8)

  const recentProjects = useMemo(() => {
    const lastActivity = new Map<string, number>()
    for (const e of entries) {
      const prev = lastActivity.get(e.projectId) ?? 0
      if (e.createdAt > prev) lastActivity.set(e.projectId, e.createdAt)
    }
    return [...projects]
      .filter((p) => !p.archived && lastActivity.has(p.id))
      .sort((a, b) => (lastActivity.get(b.id) ?? 0) - (lastActivity.get(a.id) ?? 0))
      .slice(0, 4)
  }, [entries, projects])

  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? 'Ohne Kunde'
  const monthHoursForProject = (projectId: string) => sumHours(month.filter((e) => e.projectId === projectId))

  return (
    <div className="relative">
      <Watermark size="lg" position="center" />
      <div className="relative z-10 mx-auto max-w-lg space-y-5 px-4 pb-28 pt-6">
        <header className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Willkommen zurück</p>
            <h1 className="font-display text-2xl text-ink">Babic Work Log</h1>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded-full p-2 text-muted-foreground hover:bg-cream-dark"
            aria-label="Einstellungen"
          >
            <Settings className="h-5 w-5" />
          </button>
        </header>

        <StandaloneRecoveryBanner hasNoEntries={entries.length === 0} onOpenBackup={onOpenBackup} />

        <div className="grid grid-cols-5 gap-2">
          <QuickAction
            icon={<Play className="h-4 w-4" />}
            label="Timer"
            onClick={() => timerCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          />
          <QuickAction icon={<Plus className="h-4 w-4" />} label="Eintrag" onClick={onNewEntry} />
          <QuickAction icon={<FolderPlus className="h-4 w-4" />} label="Projekt" onClick={onNavigateToProjects} />
          <QuickAction icon={<FileDown className="h-4 w-4" />} label="Berichte" onClick={onOpenReports} />
          <QuickAction icon={<ShieldCheck className="h-4 w-4" />} label="Backup" onClick={onOpenBackup} />
        </div>

        <div ref={timerCardRef}>
          <TimerCard timer={timer} projects={projects} onStopped={setPendingTimerResult} />
        </div>

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
            value={formatCurrency(openReceivablesTotal)}
            accent="rose"
            icon={<CircleDollarSign className="h-4 w-4" />}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Bereits bezahlt"
            value={formatCurrency(receivablesPaidTotal)}
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

        <BackupCard lastBackupAt={lastBackupAt} onOpen={onOpenBackup} />

        <BusinessHealthCard health={health} projects={projects} />

        <BusinessFinanceCards summary={businessFinance} />

        <BusinessHealthSummary summary={businessHealthSummary} />

        {recentProjects.length > 0 && (
          <section>
            <h2 className="mb-2 font-display text-lg text-ink">Zuletzt aktive Projekte</h2>
            <ul className="space-y-2">
              {recentProjects.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={onNavigateToProjects}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3 text-left shadow-soft"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{p.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{clientName(p.clientId)}</p>
                      </div>
                    </div>
                    <p className="shrink-0 text-xs text-muted-foreground">{formatHours(monthHoursForProject(p.id))}</p>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Button variant="secondary" size="lg" className="w-full" onClick={() => setDayCloseOpen(true)}>
          <ClipboardCheck className="h-5 w-5" />
          Tag abschließen
        </Button>

        <section>
          <h2 className="mb-2 font-display text-lg text-ink">Letzte Aktivität</h2>
          <EntryList
            entries={recentActivity}
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

      <Sheet open={pendingTimerResult !== null} onOpenChange={(open) => !open && setPendingTimerResult(null)}>
        <SheetContent open={pendingTimerResult !== null} title="Was hast du gemacht?">
          {pendingTimerResult && (
            <TimerStopDialog
              result={pendingTimerResult}
              projects={projects}
              clients={clients}
              onConfirm={(data) => {
                onCreateEntryFromTimer({ ...data, hours: pendingTimerResult.hours })
                setPendingTimerResult(null)
              }}
              onCancel={() => setPendingTimerResult(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent open={settingsOpen} title="Einstellungen">
          <SettingsSheet />
        </SheetContent>
      </Sheet>
    </div>
  )
}

function QuickAction({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-2xl bg-card px-2 py-3 text-center shadow-soft transition-transform active:scale-[0.97]"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage/15 text-sage-dark">{icon}</span>
      <span className="text-[11px] font-medium text-ink">{label}</span>
    </button>
  )
}
