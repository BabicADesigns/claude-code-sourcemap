import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/services/utils'
import {
  CLIENT_PRIORITY_LABELS,
  CLIENT_PRIORITY_ORDER,
  CLIENT_RELATIONSHIP_LABELS,
  CLIENT_RELATIONSHIP_ORDER,
  CLIENT_STATUS_LABELS,
  CLIENT_STATUS_ORDER,
  PREFERRED_COMMUNICATION_LABELS,
  PREFERRED_COMMUNICATION_ORDER,
  PROJECT_COLORS,
} from '@/models'
import type { Client } from '@/models'
import { ClientFinanceSettingsForm } from '@/modules/finance/components/ClientFinanceSettingsForm'
import type { ClientFinanceSettings } from '@/modules/finance/models'

export function ClientDetailSheet({
  client,
  financeSettings,
  onUpdate,
  onUpdateFinanceSettings,
}: {
  client: Client
  financeSettings: ClientFinanceSettings | null
  onUpdate: (id: string, patch: Partial<Omit<Client, 'id'>>) => void
  onUpdateFinanceSettings: (
    clientId: string,
    patch: Partial<Omit<ClientFinanceSettings, 'clientId' | 'createdAt' | 'updatedAt'>>,
  ) => void
}) {
  const [tagInput, setTagInput] = useState('')

  function addTag() {
    const t = tagInput.trim()
    if (!t || (client.tags ?? []).includes(t)) {
      setTagInput('')
      return
    }
    onUpdate(client.id, { tags: [...(client.tags ?? []), t] })
    setTagInput('')
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  function removeTag(t: string) {
    onUpdate(client.id, { tags: (client.tags ?? []).filter((x) => x !== t) })
  }

  return (
    <div className="space-y-5 pb-6">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="cd-name">Name</Label>
          <Input id="cd-name" value={client.name} onChange={(e) => onUpdate(client.id, { name: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="cd-company">Firma</Label>
          <Input
            id="cd-company"
            value={client.company ?? ''}
            onChange={(e) => onUpdate(client.id, { company: e.target.value || undefined })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="cd-contact">Ansprechpartner</Label>
        <Input
          id="cd-contact"
          value={client.contactPerson ?? ''}
          onChange={(e) => onUpdate(client.id, { contactPerson: e.target.value || undefined })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="cd-email">E-Mail</Label>
          <Input
            id="cd-email"
            type="email"
            value={client.email ?? ''}
            onChange={(e) => onUpdate(client.id, { email: e.target.value || undefined })}
          />
        </div>
        <div>
          <Label htmlFor="cd-phone">Telefon</Label>
          <Input
            id="cd-phone"
            value={client.phone ?? ''}
            onChange={(e) => onUpdate(client.id, { phone: e.target.value || undefined })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="cd-website">Website</Label>
        <Input
          id="cd-website"
          value={client.website ?? ''}
          onChange={(e) => onUpdate(client.id, { website: e.target.value || undefined })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="cd-address">Adresse</Label>
          <Input
            id="cd-address"
            value={client.address ?? ''}
            onChange={(e) => onUpdate(client.id, { address: e.target.value || undefined })}
          />
        </div>
        <div>
          <Label htmlFor="cd-country">Land</Label>
          <Input
            id="cd-country"
            value={client.country ?? ''}
            onChange={(e) => onUpdate(client.id, { country: e.target.value || undefined })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="cd-vat">USt-IdNr. (optional)</Label>
        <Input
          id="cd-vat"
          value={client.vatId ?? ''}
          onChange={(e) => onUpdate(client.id, { vatId: e.target.value || undefined })}
        />
      </div>

      <div>
        <Label htmlFor="cd-relationship">Beziehung</Label>
        <Select
          value={client.relationship ?? ''}
          onValueChange={(v) => onUpdate(client.id, { relationship: v as Client['relationship'] })}
        >
          <SelectTrigger id="cd-relationship">
            <SelectValue placeholder="Wählen" />
          </SelectTrigger>
          <SelectContent>
            {CLIENT_RELATIONSHIP_ORDER.map((r) => (
              <SelectItem key={r} value={r}>
                {CLIENT_RELATIONSHIP_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Status</Label>
        <div className="grid grid-cols-2 gap-2">
          {CLIENT_STATUS_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onUpdate(client.id, { status: s, archived: s === 'archived' })}
              className={cn(
                'rounded-xl border px-2 py-2 text-xs font-medium transition-colors',
                client.status === s ? 'border-sage bg-sage/15 text-sage-dark' : 'border-border text-muted-foreground',
              )}
            >
              {CLIENT_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Priorität</Label>
        <div className="flex gap-2">
          {CLIENT_PRIORITY_ORDER.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onUpdate(client.id, { priority: p })}
              className={cn(
                'flex-1 rounded-xl border px-2 py-2 text-xs font-medium transition-colors',
                client.priority === p ? 'border-sage bg-sage/15 text-sage-dark' : 'border-border text-muted-foreground',
              )}
            >
              {CLIENT_PRIORITY_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="cd-comm">Bevorzugte Kommunikation</Label>
        <Select
          value={client.preferredCommunication ?? ''}
          onValueChange={(v) => onUpdate(client.id, { preferredCommunication: v as Client['preferredCommunication'] })}
        >
          <SelectTrigger id="cd-comm">
            <SelectValue placeholder="Wählen" />
          </SelectTrigger>
          <SelectContent>
            {PREFERRED_COMMUNICATION_ORDER.map((c) => (
              <SelectItem key={c} value={c}>
                {PREFERRED_COMMUNICATION_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Farbe</Label>
        <div className="flex flex-wrap gap-2">
          {PROJECT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onUpdate(client.id, { color })}
              className={cn(
                'h-8 w-8 rounded-full border-2 transition-transform',
                client.color === color ? 'scale-110 border-ink' : 'border-transparent',
              )}
              style={{ backgroundColor: color }}
              aria-label={`Farbe ${color} wählen`}
            />
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="cd-tags">Tags</Label>
        {client.tags && client.tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {client.tags.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1 rounded-full bg-cream-dark px-2.5 py-1 text-xs font-medium text-ink"
              >
                {t}
                <button type="button" onClick={() => removeTag(t)} aria-label={`Tag ${t} entfernen`}>
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </span>
            ))}
          </div>
        )}
        <Input
          id="cd-tags"
          placeholder="Tag eingeben und Enter drücken"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          onBlur={addTag}
        />
      </div>

      <div>
        <Label htmlFor="cd-notes">Notizen</Label>
        <Textarea
          id="cd-notes"
          value={client.notes ?? ''}
          onChange={(e) => onUpdate(client.id, { notes: e.target.value || undefined })}
        />
      </div>

      <div>
        <Label htmlFor="cd-internal-notes">Interne Notizen</Label>
        <Textarea
          id="cd-internal-notes"
          value={client.internalNotes ?? ''}
          onChange={(e) => onUpdate(client.id, { internalNotes: e.target.value || undefined })}
        />
      </div>

      <div>
        <Label htmlFor="cd-relationship-notes">Beziehungsnotizen</Label>
        <Textarea
          id="cd-relationship-notes"
          value={client.relationshipNotes ?? ''}
          onChange={(e) => onUpdate(client.id, { relationshipNotes: e.target.value || undefined })}
        />
      </div>

      <div className="border-t border-border pt-5">
        <h3 className="mb-3 font-display text-base text-ink">Finanzen</h3>
        <ClientFinanceSettingsForm
          clientId={client.id}
          settings={financeSettings}
          onUpdate={onUpdateFinanceSettings}
        />
      </div>
    </div>
  )
}
