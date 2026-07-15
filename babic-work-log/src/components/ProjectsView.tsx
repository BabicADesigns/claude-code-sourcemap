import { useMemo, useState, type FormEvent } from 'react'
import { Archive, ArchiveRestore, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { summarizeByProject } from '@/lib/calculations'
import { formatCurrency, formatHours } from '@/lib/date'
import type { Project, TimeEntry } from '@/lib/types'

export function ProjectsView({
  projects,
  entries,
  onAdd,
  onUpdate,
  onArchive,
  onDelete,
}: {
  projects: Project[]
  entries: TimeEntry[]
  onAdd: (name: string, defaultRate: number) => void
  onUpdate: (id: string, patch: Partial<Omit<Project, 'id'>>) => void
  onArchive: (id: string, archived: boolean) => void
  onDelete: (id: string) => void
}) {
  const [name, setName] = useState('')
  const [rate, setRate] = useState('45')

  const totals = useMemo(() => summarizeByProject(entries), [entries])
  const totalFor = (id: string) => totals.find((t) => t.projectId === id)
  const entryCountFor = (id: string) => entries.filter((e) => e.projectId === id).length

  const active = projects.filter((p) => !p.archived)
  const archived = projects.filter((p) => p.archived)

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(name.trim(), Number(rate) || 0)
    setName('')
    setRate('45')
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 pb-28 pt-6">
      <header>
        <h1 className="font-display text-2xl text-ink">Projekte</h1>
      </header>

      <form onSubmit={handleAdd} className="space-y-3 rounded-2xl bg-card p-4 shadow-soft">
        <div>
          <Label htmlFor="new-project">Neues Projekt</Label>
          <Input id="new-project" placeholder="Projektname" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="new-rate">Standard-Stundensatz (€)</Label>
          <Input
            id="new-rate"
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={!name.trim()}>
          <Plus className="h-4 w-4" />
          Projekt anlegen
        </Button>
      </form>

      <section className="space-y-2">
        {active.map((project) => (
          <ProjectRow
            key={project.id}
            project={project}
            hours={totalFor(project.id)?.hours ?? 0}
            amount={totalFor(project.id)?.amount ?? 0}
            hasEntries={entryCountFor(project.id) > 0}
            onUpdate={onUpdate}
            onArchive={onArchive}
            onDelete={onDelete}
          />
        ))}
      </section>

      {archived.length > 0 && (
        <section>
          <h2 className="mb-2 font-display text-lg text-ink">Archiviert</h2>
          <div className="space-y-2">
            {archived.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                hours={totalFor(project.id)?.hours ?? 0}
                amount={totalFor(project.id)?.amount ?? 0}
                hasEntries={entryCountFor(project.id) > 0}
                onUpdate={onUpdate}
                onArchive={onArchive}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function ProjectRow({
  project,
  hours,
  amount,
  hasEntries,
  onUpdate,
  onArchive,
  onDelete,
}: {
  project: Project
  hours: number
  amount: number
  hasEntries: boolean
  onUpdate: (id: string, patch: Partial<Omit<Project, 'id'>>) => void
  onArchive: (id: string, archived: boolean) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <Input
          value={project.name}
          onChange={(e) => onUpdate(project.id, { name: e.target.value })}
          className="h-9 flex-1 border-none bg-transparent px-0 font-medium text-ink focus-visible:ring-0"
        />
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => onArchive(project.id, !project.archived)}
            className="rounded-full p-2 text-muted-foreground hover:bg-cream-dark"
            aria-label={project.archived ? 'Reaktivieren' : 'Archivieren'}
          >
            {project.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
          </button>
          {!hasEntries && (
            <button
              onClick={() => onDelete(project.id)}
              className="rounded-full p-2 text-rose-dark hover:bg-rose/10"
              aria-label="Löschen"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>€/h</span>
          <Input
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            value={project.defaultRate}
            onChange={(e) => onUpdate(project.id, { defaultRate: Number(e.target.value) || 0 })}
            className="h-8 w-20 px-2 text-sm"
          />
        </div>
        {hasEntries && (
          <p className="text-xs text-muted-foreground">
            {formatHours(hours)} · {formatCurrency(amount)}
          </p>
        )}
      </div>
    </div>
  )
}
