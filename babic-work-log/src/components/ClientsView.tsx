import { useState, type FormEvent } from 'react'
import { Archive, ArchiveRestore, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Client, Project } from '@/lib/types'

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
  onAdd: (input: { name: string; phone?: string; email?: string; notes?: string }) => void
  onUpdate: (id: string, patch: Partial<Omit<Client, 'id'>>) => void
  onArchive: (id: string, archived: boolean) => void
  onDelete: (id: string) => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')

  const projectCountFor = (clientId: string) => projects.filter((p) => p.clientId === clientId).length

  const active = clients.filter((c) => !c.archived)
  const archived = clients.filter((c) => c.archived)

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({ name: name.trim(), phone: phone.trim() || undefined, email: email.trim() || undefined, notes: notes.trim() || undefined })
    setName('')
    setPhone('')
    setEmail('')
    setNotes('')
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleAdd} className="space-y-3 rounded-2xl bg-card p-4 shadow-soft">
        <div>
          <Label htmlFor="new-client">Neuer Kunde</Label>
          <Input id="new-client" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
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
        <Input
          value={client.name}
          onChange={(e) => onUpdate(client.id, { name: e.target.value })}
          className="h-9 flex-1 border-none bg-transparent px-0 font-medium text-ink focus-visible:ring-0"
        />
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
      <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
        {client.phone && <span>{client.phone}</span>}
        {client.email && <span>{client.email}</span>}
        <span>
          {projectCount} {projectCount === 1 ? 'Projekt' : 'Projekte'}
        </span>
      </div>
      {client.notes && <p className="mt-1.5 text-sm text-muted-foreground">{client.notes}</p>}
    </div>
  )
}
