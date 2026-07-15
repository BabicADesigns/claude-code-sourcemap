import { useMemo, useState, type FormEvent } from 'react'
import { Archive, ArchiveRestore, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { ProjectDetailSheet } from '@/components/ProjectDetailSheet'
import { cn } from '@/lib/utils'
import { effectiveRateForProject, summarizeByProject } from '@/lib/calculations'
import { formatCurrency, formatHours } from '@/lib/date'
import { PROJECT_COLORS } from '@/lib/types'
import type { Client, PricingType, Project, ProjectDocument, TimeEntry } from '@/lib/types'
import type { NewProjectInput } from '@/hooks/useProjects'

export function ProjectsView({
  projects,
  clients,
  entries,
  documents,
  onAdd,
  onUpdate,
  onArchive,
  onDelete,
  onAddDocument,
  onDeleteDocument,
}: {
  projects: Project[]
  clients: Client[]
  entries: TimeEntry[]
  documents: ProjectDocument[]
  onAdd: (input: NewProjectInput) => void
  onUpdate: (id: string, patch: Partial<Omit<Project, 'id'>>) => void
  onArchive: (id: string, archived: boolean) => void
  onDelete: (id: string) => void
  onAddDocument: (input: { projectId: string; name: string; label: string; dataUrl: string; mimeType: string }) => void
  onDeleteDocument: (id: string) => void
}) {
  const [name, setName] = useState('')
  const [clientId, setClientId] = useState(clients[0]?.id ?? '')
  const [pricingType, setPricingType] = useState<PricingType>('hourly')
  const [rate, setRate] = useState('45')
  const [fixedPrice, setFixedPrice] = useState('500')
  const [detailProjectId, setDetailProjectId] = useState<string | null>(null)

  const totals = useMemo(() => summarizeByProject(entries), [entries])
  const totalFor = (id: string) => totals.find((t) => t.projectId === id)
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? 'Ohne Kunde'

  const active = projects.filter((p) => !p.archived)
  const archived = projects.filter((p) => p.archived)
  const detailProject = projects.find((p) => p.id === detailProjectId) ?? null

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !clientId) return
    onAdd({
      name: name.trim(),
      clientId,
      defaultRate: Number(rate) || 0,
      pricingType,
      fixedPrice: pricingType === 'fixed' ? Number(fixedPrice) || 0 : undefined,
      color: PROJECT_COLORS[active.length % PROJECT_COLORS.length],
    })
    setName('')
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleAdd} className="space-y-3 rounded-2xl bg-card p-4 shadow-soft">
          <div>
            <Label htmlFor="new-project">Neues Projekt</Label>
            <Input id="new-project" placeholder="Projektname" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="new-project-client">Kunde</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger id="new-project-client">
                <SelectValue placeholder="Kunde wählen" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Preisart</Label>
            <div className="inline-flex rounded-xl bg-cream-dark p-1">
              {(
                [
                  ['hourly', 'Stundensatz'],
                  ['fixed', 'Festpreis'],
                ] as [PricingType, string][]
              ).map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPricingType(type)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    pricingType === type ? 'bg-white text-ink shadow-soft' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {pricingType === 'fixed' ? (
            <div>
              <Label htmlFor="new-project-fixed">Festpreis (€)</Label>
              <Input
                id="new-project-fixed"
                type="number"
                inputMode="decimal"
                step="1"
                min="0"
                value={fixedPrice}
                onChange={(e) => setFixedPrice(e.target.value)}
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="new-project-rate">Standard-Stundensatz (€)</Label>
              <Input
                id="new-project-rate"
                type="number"
                inputMode="decimal"
                step="0.5"
                min="0"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={!name.trim() || !clientId}>
            <Plus className="h-4 w-4" />
            Projekt anlegen
          </Button>
        </form>

        <section className="space-y-2">
          {active.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              clientName={clientName(project.clientId)}
              hours={totalFor(project.id)?.hours ?? 0}
              amount={totalFor(project.id)?.amount ?? 0}
              effectiveRate={effectiveRateForProject(project, entries)}
              onArchive={onArchive}
              onDelete={(totalFor(project.id)?.hours ?? 0) === 0 ? () => onDelete(project.id) : undefined}
              onOpenDetail={() => setDetailProjectId(project.id)}
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
                  clientName={clientName(project.clientId)}
                  hours={totalFor(project.id)?.hours ?? 0}
                  amount={totalFor(project.id)?.amount ?? 0}
                  effectiveRate={effectiveRateForProject(project, entries)}
                  onArchive={onArchive}
                  onDelete={(totalFor(project.id)?.hours ?? 0) === 0 ? () => onDelete(project.id) : undefined}
                  onOpenDetail={() => setDetailProjectId(project.id)}
                />
              ))}
            </div>
          </section>
        )}

      <Sheet open={detailProject !== null} onOpenChange={(open) => !open && setDetailProjectId(null)}>
        <SheetContent open={detailProject !== null} title={detailProject?.name ?? ''}>
          {detailProject && (
            <ProjectDetailSheet
              project={detailProject}
              clients={clients}
              entries={entries}
              documents={documents.filter((d) => d.projectId === detailProject.id)}
              onUpdate={onUpdate}
              onAddDocument={onAddDocument}
              onDeleteDocument={onDeleteDocument}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function ProjectRow({
  project,
  clientName,
  hours,
  amount,
  effectiveRate,
  onArchive,
  onDelete,
  onOpenDetail,
}: {
  project: Project
  clientName: string
  hours: number
  amount: number
  effectiveRate: number
  onArchive: (id: string, archived: boolean) => void
  onDelete?: () => void
  onOpenDetail: () => void
}) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft">
      <button onClick={onOpenDetail} className="flex w-full items-center justify-between gap-3 text-left">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{project.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {clientName} · {project.pricingType === 'fixed' ? `Festpreis ${formatCurrency(project.fixedPrice ?? 0)}` : `${project.defaultRate} €/h`}
            </p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {hours > 0 ? `${formatHours(hours)} · ${formatCurrency(amount)}` : 'Noch keine Einträge'}
          {project.pricingType === 'fixed' && hours > 0 ? ` · ${formatCurrency(effectiveRate)}/h effektiv` : ''}
        </p>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => onArchive(project.id, !project.archived)}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-cream-dark"
            aria-label={project.archived ? 'Reaktivieren' : 'Archivieren'}
          >
            {project.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
          </button>
          {onDelete && (
            <button onClick={onDelete} className="rounded-full p-1.5 text-rose-dark hover:bg-rose/10" aria-label="Löschen">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
