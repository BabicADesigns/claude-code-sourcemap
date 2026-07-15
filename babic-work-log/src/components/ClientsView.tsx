import { useState, type FormEvent } from 'react'
import { Archive, ArchiveRestore, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/services/utils'
import { PROJECT_COLORS } from '@/models'
import type { Client, Project } from '@/models'
import type { NewClientInput } from '@/hooks/useClients'

export function ClientsView({
  clients,
  projects,
  onAdd,
  onUpdate,
  onArchive,
  onDelete,
}: {
  clients: Client[]
  projects: Project[]
  onAdd: (input: NewClientInput) => void
  onUpdate: (id: string, patch: Partial<Omit<Client, 'id'>>) => void
  onArchive: (id: string, archived: boolean) => void
  onDelete: (id: string) => void
}) {
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [defaultRate, setDefaultRate] = useState('')
  const [color, setColor] = useState<string>(PROJECT_COLORS[0])
  const [notes, setNotes] = useState('')

  const projectCountFor = (clientId: string) => projects.filter((p) => p.clientId === clientId).length

  const active = clients.filter((c) => !c.archived)
  const archived = clients.filter((c) => c.archived)

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({
      name: name.trim(),
      company: company.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      defaultRate: defaultRate ? Number(defaultRate) : undefined,
      color,
      notes: notes.trim() || undefined,
    })
    setName('')
    setCompany('')
    setPhone('')
    setEmail('')
    setDefaultRate('')
    setColor(PROJECT_COLORS[0])
    setNotes('')
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="new-client-phone">Telefon (optional)</Label>
            <Input id="new-client-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="new-client-email">Mail (optional)</Label>
            <Input id="new-client-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="new-client-rate">Standard-Stundensatz (optional, €)</Label>
          <Input
            id="new-client-rate"
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            value={defaultRate}
            onChange={(e) => setDefaultRate(e.target.value)}
          />
        </div>
        <div>
          <Label>Farbe</Label>
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  'h-8 w-8 rounded-full border-2 transition-transform',
                  color === c ? 'scale-110 border-ink' : 'border-transparent',
                )}
                style={{ backgroundColor: c }}
                aria-label={`Farbe ${c} wählen`}
              />
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="new-client-notes">Notizen</Label>
          <Textarea id="new-client-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={!name.trim()}>
          <Plus className="h-4 w-4" />
          Kunde anlegen
        </Button>
      </form>

      <section className="space-y-2">
        {active.map((client) => (
          <ClientRow
            key={client.id}
            client={client}
            projectCount={projectCountFor(client.id)}
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
            {archived.map((client) => (
              <ClientRow
                key={client.id}
                client={client}
                projectCount={projectCountFor(client.id)}
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

function ClientRow({
  client,
  projectCount,
  onUpdate,
  onArchive,
  onDelete,
}: {
  client: Client
  projectCount: number
  onUpdate: (id: string, patch: Partial<Omit<Client, 'id'>>) => void
  onArchive: (id: string, archived: boolean) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: client.color ?? '#8B9B7A' }}
          />
          <Input
            value={client.name}
            onChange={(e) => onUpdate(client.id, { name: e.target.value })}
            className="h-9 flex-1 border-none bg-transparent px-0 font-medium text-ink focus-visible:ring-0"
          />
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => onArchive(client.id, !client.archived)}
            className="rounded-full p-2 text-muted-foreground hover:bg-cream-dark"
            aria-label={client.archived ? 'Reaktivieren' : 'Archivieren'}
          >
            {client.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
          </button>
          {projectCount === 0 && (
            <button
              onClick={() => onDelete(client.id)}
              className="rounded-full p-2 text-rose-dark hover:bg-rose/10"
              aria-label="Löschen"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {client.company && <p className="mt-1 text-sm text-muted-foreground">{client.company}</p>}
      <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
        {client.phone && <span>{client.phone}</span>}
        {client.email && <span>{client.email}</span>}
        {typeof client.defaultRate === 'number' && <span>{client.defaultRate} €/h</span>}
        <span>
          {projectCount} {projectCount === 1 ? 'Projekt' : 'Projekte'}
        </span>
      </div>
      {client.notes && <p className="mt-1.5 text-sm text-muted-foreground">{client.notes}</p>}
    </div>
  )
}
