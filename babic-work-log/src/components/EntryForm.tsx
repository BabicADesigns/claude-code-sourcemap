import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Camera, Pause, Play, Square, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PaymentsSection } from '@/components/PaymentsSection'
import { cn } from '@/lib/utils'
import { CATEGORIES, STATUS_LABELS, STATUS_ORDER } from '@/lib/types'
import type { Client, EntryDraft, EntryStatus, Payment, Project, TimeEntry } from '@/lib/types'
import { formatCurrency, todayISO } from '@/lib/date'
import { entryHours, entryAmount, effectiveRateForProject } from '@/lib/calculations'
import { formatElapsed, type UseTimerReturn } from '@/hooks/useTimer'

function emptyDraft(projects: Project[]): EntryDraft {
  const project = projects[0]
  return {
    projectId: project?.id ?? '',
    date: todayISO(),
    category: CATEGORIES[0],
    timeMode: 'manual',
    startTime: '09:00',
    endTime: '17:00',
    manualHours: '',
    hourlyRate: project ? String(project.defaultRate) : '',
    notes: '',
    status: 'offen',
    payments: [],
  }
}

function draftFromEntry(entry: TimeEntry): EntryDraft {
  const timeMode = entry.source === 'timer' ? 'timer' : entry.manualHours ? 'manual' : 'range'
  return {
    id: entry.id,
    projectId: entry.projectId,
    date: entry.date,
    category: entry.category,
    timeMode,
    startTime: entry.startTime ?? '09:00',
    endTime: entry.endTime ?? '17:00',
    manualHours: typeof entry.manualHours === 'number' ? String(entry.manualHours) : '',
    hourlyRate: String(entry.hourlyRate),
    notes: entry.notes ?? '',
    photo: entry.photo,
    status: entry.status,
    payments: entry.payments ?? [],
  }
}

function draftToPreviewEntry(draft: EntryDraft, rate: number): TimeEntry {
  return {
    id: 'preview',
    projectId: draft.projectId,
    date: draft.date,
    category: draft.category,
    startTime: draft.timeMode === 'range' ? draft.startTime : undefined,
    endTime: draft.timeMode === 'range' ? draft.endTime : undefined,
    manualHours: draft.timeMode !== 'range' ? Number(draft.manualHours) || 0 : undefined,
    hourlyRate: rate,
    notes: draft.notes,
    photo: draft.photo,
    status: draft.status,
    payments: draft.payments,
    createdAt: 0,
    updatedAt: 0,
  }
}

export function EntryForm({
  projects,
  clients,
  entries,
  timer,
  initialEntry,
  onSave,
  onDelete,
  onClose,
}: {
  projects: Project[]
  clients: Client[]
  entries: TimeEntry[]
  timer: UseTimerReturn
  initialEntry: TimeEntry | null
  onSave: (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void
  onDelete?: (id: string) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState<EntryDraft>(() =>
    initialEntry ? draftFromEntry(initialEntry) : emptyDraft(projects),
  )

  useEffect(() => {
    setDraft(initialEntry ? draftFromEntry(initialEntry) : emptyDraft(projects))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEntry])

  const activeProjects = projects.filter((p) => !p.archived)
  const selectedProject = projects.find((p) => p.id === draft.projectId)
  const isFixedPrice = selectedProject?.pricingType === 'fixed'
  const effectiveRate = selectedProject ? effectiveRateForProject(selectedProject, entries) : 0
  const rateForCalc = isFixedPrice ? effectiveRate : Number(draft.hourlyRate) || 0
  const preview = draftToPreviewEntry(draft, rateForCalc)
  const canSave =
    draft.projectId && draft.date && (isFixedPrice || Number(draft.hourlyRate) >= 0) && entryHours(preview) > 0

  const clientsById = new Map(clients.map((c) => [c.id, c]))
  const projectsByClient = new Map<string, Project[]>()
  for (const p of activeProjects) {
    const list = projectsByClient.get(p.clientId) ?? []
    list.push(p)
    projectsByClient.set(p.clientId, list)
  }

  function handleProjectChange(projectId: string) {
    const project = projects.find((p) => p.id === projectId)
    setDraft((d) => ({
      ...d,
      projectId,
      hourlyRate: project ? String(project.defaultRate) : d.hourlyRate,
    }))
  }

  function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setDraft((d) => ({ ...d, photo: reader.result as string }))
    reader.readAsDataURL(file)
  }

  function handleTimerStop() {
    const result = timer.stop()
    if (result) setDraft((d) => ({ ...d, manualHours: result.hours.toFixed(2) }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSave) return
    onSave({
      id: draft.id,
      projectId: draft.projectId,
      date: draft.date,
      category: draft.category,
      startTime: draft.timeMode === 'range' ? draft.startTime : undefined,
      endTime: draft.timeMode === 'range' ? draft.endTime : undefined,
      manualHours: draft.timeMode !== 'range' ? Number(draft.manualHours) : undefined,
      hourlyRate: rateForCalc,
      notes: draft.notes.trim() || undefined,
      photo: draft.photo,
      status: draft.status,
      payments: draft.payments.length > 0 ? draft.payments : undefined,
      source: draft.timeMode,
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-6">
      <div>
        <Label htmlFor="project">Projekt</Label>
        <Select value={draft.projectId} onValueChange={handleProjectChange}>
          <SelectTrigger id="project">
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="date">Datum</Label>
          <Input
            id="date"
            type="date"
            value={draft.date}
            onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="category">Kategorie</Label>
          <Select value={draft.category} onValueChange={(v) => setDraft((d) => ({ ...d, category: v }))}>
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Arbeitszeit</Label>
        <div className="mb-3 inline-flex flex-wrap rounded-xl bg-cream-dark p-1">
          {(
            [
              ['manual', 'Stunden manuell'],
              ['range', 'Start-/Endzeit'],
              ['timer', 'Timer'],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setDraft((d) => ({ ...d, timeMode: mode }))}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                draft.timeMode === mode ? 'bg-white text-ink shadow-soft' : 'text-muted-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {draft.timeMode === 'manual' && (
          <Input
            type="number"
            inputMode="decimal"
            step="0.25"
            min="0"
            placeholder="z. B. 2.5"
            value={draft.manualHours}
            onChange={(e) => setDraft((d) => ({ ...d, manualHours: e.target.value }))}
          />
        )}

        {draft.timeMode === 'range' && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="time"
              value={draft.startTime}
              onChange={(e) => setDraft((d) => ({ ...d, startTime: e.target.value }))}
            />
            <Input
              type="time"
              value={draft.endTime}
              onChange={(e) => setDraft((d) => ({ ...d, endTime: e.target.value }))}
            />
          </div>
        )}

        {draft.timeMode === 'timer' &&
          (draft.manualHours === '' ? (
            timer.isIdle ? (
              <Button
                type="button"
                variant="gold"
                className="w-full"
                disabled={!draft.projectId}
                onClick={() => timer.start(draft.projectId, draft.category)}
              >
                <Play className="h-4 w-4" />
                Timer starten
              </Button>
            ) : (
              <div className="rounded-xl bg-cream-dark p-3 text-center">
                <p className="font-display text-2xl tabular-nums text-ink">{formatElapsed(timer.elapsedMs)}</p>
                <div className="mt-2 flex gap-2">
                  {timer.state.running ? (
                    <Button type="button" variant="secondary" className="flex-1" onClick={timer.pause}>
                      <Pause className="h-4 w-4" />
                      Pause
                    </Button>
                  ) : (
                    <Button type="button" variant="secondary" className="flex-1" onClick={timer.resume}>
                      <Play className="h-4 w-4" />
                      Weiter
                    </Button>
                  )}
                  <Button type="button" variant="gold" className="flex-1" onClick={handleTimerStop}>
                    <Square className="h-4 w-4" />
                    Stop
                  </Button>
                </div>
              </div>
            )
          ) : (
            <div>
              <p className="mb-1.5 text-xs text-muted-foreground">⏱ Per Timer erfasst — bei Bedarf anpassen</p>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={draft.manualHours}
                onChange={(e) => setDraft((d) => ({ ...d, manualHours: e.target.value }))}
              />
            </div>
          ))}
      </div>

      {isFixedPrice ? (
        <div className="rounded-xl bg-gold/15 px-4 py-3 text-sm text-ink">
          <p className="font-medium">Festpreisprojekt · {formatCurrency(selectedProject?.fixedPrice ?? 0)}</p>
          <p className="mt-0.5 text-muted-foreground">
            Aktuell effektiv {formatCurrency(effectiveRate)}/h insgesamt für dieses Projekt
          </p>
        </div>
      ) : (
        <div>
          <Label htmlFor="rate">Stundensatz (€)</Label>
          <Input
            id="rate"
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            value={draft.hourlyRate}
            onChange={(e) => setDraft((d) => ({ ...d, hourlyRate: e.target.value }))}
          />
          {selectedProject && (
            <p className="mt-1 text-xs text-muted-foreground">
              Standardsatz {selectedProject.name}: {selectedProject.defaultRate.toLocaleString('de-DE')} €/h
            </p>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="notes">Notizen</Label>
        <Textarea
          id="notes"
          placeholder="Was wurde gemacht?"
          value={draft.notes}
          onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
        />
      </div>

      <div>
        <Label>Status</Label>
        {draft.payments.length > 0 && (
          <p className="mb-1.5 text-xs text-muted-foreground">Wird automatisch aus den Teilzahlungen berechnet.</p>
        )}
        <div className="flex gap-2">
          {STATUS_ORDER.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setDraft((d) => ({ ...d, status: s as EntryStatus }))}
              className={cn(
                'flex-1 rounded-xl border px-2 py-2 text-xs font-medium transition-colors',
                draft.status === s ? 'border-sage bg-sage/15 text-sage-dark' : 'border-border text-muted-foreground',
              )}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Teilzahlungen</Label>
        <PaymentsSection
          payments={draft.payments}
          totalAmount={entryAmount(preview)}
          onChange={(payments: Payment[]) => setDraft((d) => ({ ...d, payments }))}
        />
      </div>

      <div>
        <Label>Foto (optional)</Label>
        {draft.photo ? (
          <div className="relative w-fit">
            <img src={draft.photo} alt="Anhang" className="h-28 w-28 rounded-xl object-cover" />
            <button
              type="button"
              onClick={() => setDraft((d) => ({ ...d, photo: undefined }))}
              className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow-soft"
            >
              <X className="h-4 w-4 text-rose-dark" />
            </button>
          </div>
        ) : (
          <label className="flex h-16 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:bg-cream-dark">
            <Camera className="h-4 w-4" />
            Foto anhängen
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
          </label>
        )}
      </div>

      {entryHours(preview) > 0 && (
        <div className="rounded-xl bg-sage/10 px-4 py-3 text-sm text-sage-dark">
          {entryHours(preview).toLocaleString('de-DE', { maximumFractionDigits: 2 })} h ·{' '}
          {entryAmount(preview).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        {initialEntry && onDelete && (
          <Button
            type="button"
            variant="destructive"
            size="lg"
            onClick={() => {
              onDelete(initialEntry.id)
              onClose()
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <Button type="submit" size="lg" className="flex-1" disabled={!canSave}>
          Speichern
        </Button>
      </div>
    </form>
  )
}
