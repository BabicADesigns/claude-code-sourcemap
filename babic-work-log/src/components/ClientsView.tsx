import { useState, type FormEvent } from 'react'
import { Archive, ArchiveRestore, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { ClientDetailSheet } from '@/components/ClientDetailSheet'
import { CLIENT_STATUS_LABELS } from '@/models'
import type { Client, Project } from '@/models'
import type { NewClientInput } from '@/hooks/useClients'
import type { ClientFinanceSettings } from '@/modules/finance/models'

export function ClientsView({
  clients,
  projects,
  clientFinanceSettings,
  onAdd,
  onUpdate,
  onArchive,
  onDelete,
  onUpdateClientFinanceSettings,
}: {
  clients: Client[]
  projects: Project[]
  clientFinanceSettings: ClientFinanceSettings[]
  onAdd: (input: NewClientInput) => void
  onUpdate: (id: string, patch: Partial<Omit<Client, 'id'>>) => void
  onArchive: (id: string, archived: boolean) => void
  onDelete: (id: string) => void
  onUpdateClientFinanceSettings: (
    clientId: string,
    patch: Partial<Omit<ClientFinanceSettings, 'clientId' | 'createdAt' | 'updatedAt'>>,
  ) => void
}) {
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [detailClientId, setDetailClientId] = useState<string | null>(null)

  const projectCountFor = (clientId: string) => projects.filter((p) => p.clientId === clientId).length

  const active = clients.filter((c) => c.status !== 'archived')
  const archived = clients.filter((c) => c.status === 'archived')
  const detailClient = clients.find((c) => c.id === detailClientId) ?? null

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({ name: name.trim(), company: company.trim() || undefined })
    setName('')
    setCompany('')
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleAdd} className="space-y-3 rounded-2xl bg-card p-4 shadow-soft">
        <div>
          <Label htmlFor="new-client">Neuer Kunde</Label>
          <Input id="new-client" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="new-client-company">Firma (optional)</Label>
          <Input id="new-client-company" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={!name.trim()}>
          <Plus className="h-4 w-4" />
          Kunde anlegen
        </Button>
        <p className="text-xs text-muted-foreground">
          Kontakt, Beziehung, Status, Priorität, Tags und mehr lassen sich danach im Profil ergänzen.
        </p>
      </form>

      <section className="space-y-2">
        {active.map((client) => (
          <ClientRow
            key={client.id}
            client={client}
            projectCount={projectCountFor(client.id)}
            onArchive={onArchive}
            onDelete={onDelete}
            onOpenDetail={() => setDetailClientId(client.id)}
          />
        ))}
      </section>

      {archived.length > 0 && (
        <section>
          <h2 className="mb-2 font-display text-lg text-ink">Archiviert</h2>
          <div className="space-y-2">
            {archived.map((client) => (
              <ClientRow
                key={client.id}
                client={client}
                projectCount={projectCountFor(client.id)}
                onArchive={onArchive}
                onDelete={onDelete}
                onOpenDetail={() => setDetailClientId(client.id)}
              />
            ))}
          </div>
        </section>
      )}

      <Sheet open={detailClient !== null} onOpenChange={(open) => !open && setDetailClientId(null)}>
        <SheetContent open={detailClient !== null} title={detailClient?.name ?? ''}>
          {detailClient && (
            <ClientDetailSheet
              client={detailClient}
              financeSettings={clientFinanceSettings.find((s) => s.clientId === detailClient.id) ?? null}
              onUpdate={onUpdate}
              onUpdateFinanceSettings={onUpdateClientFinanceSettings}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function ClientRow({
  client,
  projectCount,
  onArchive,
  onDelete,
  onOpenDetail,
}: {
  client: Client
  projectCount: number
  onArchive: (id: string, archived: boolean) => void
  onDelete: (id: string) => void
  onOpenDetail: () => void
}) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft">
      <button onClick={onOpenDetail} className="flex w-full items-center justify-between gap-3 text-left">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: client.color ?? '#8B9B7A' }} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate font-medium text-ink">{client.name}</p>
              {client.status !== 'active' && <Badge variant="rose">{CLIENT_STATUS_LABELS[client.status]}</Badge>}
            </div>
            {client.company && <p className="truncate text-xs text-muted-foreground">{client.company}</p>}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {client.tags && client.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {client.tags.map((t) => (
            <Badge key={t} variant="neutral">
              {t}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {projectCount} {projectCount === 1 ? 'Projekt' : 'Projekte'}
        </p>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => onArchive(client.id, client.status !== 'archived')}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-cream-dark"
            aria-label={client.status === 'archived' ? 'Reaktivieren' : 'Archivieren'}
          >
            {client.status === 'archived' ? (
              <ArchiveRestore className="h-3.5 w-3.5" />
            ) : (
              <Archive className="h-3.5 w-3.5" />
            )}
          </button>
          {projectCount === 0 && (
            <button
              onClick={() => onDelete(client.id)}
              className="rounded-full p-1.5 text-rose-dark hover:bg-rose/10"
              aria-label="Löschen"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
