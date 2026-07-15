import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatHours } from '@/services/date'
import { CATEGORIES } from '@/models'
import type { Client, Project } from '@/models'
import type { StoppedTimer } from '@/hooks/useTimer'

export interface TimerStopConfirmation {
  projectId: string
  category: string
  description: string
  notes: string
}

/** "Was hast du gemacht?" — shown once the dashboard timer is stopped, before
 * the work entry is actually created, so the entry always carries a real
 * description instead of being saved blank. */
export function TimerStopDialog({
  result,
  projects,
  clients,
  onConfirm,
  onCancel,
}: {
  result: StoppedTimer
  projects: Project[]
  clients: Client[]
  onConfirm: (data: TimerStopConfirmation) => void
  onCancel: () => void
}) {
  const [projectId, setProjectId] = useState(result.projectId)
  const [category, setCategory] = useState(result.category)
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')

  const activeProjects = projects.filter((p) => !p.archived)
  const selectedProject = projects.find((p) => p.id === projectId)
  const client = clients.find((c) => c.id === selectedProject?.clientId)

  function handleConfirm() {
    onConfirm({ projectId, category, description: description.trim(), notes: notes.trim() })
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="rounded-xl bg-sage/10 px-4 py-3 text-center">
        <p className="text-sm text-muted-foreground">Erfasste Zeit</p>
        <p className="font-display text-2xl text-sage-dark">{formatHours(result.hours)}</p>
      </div>

      <div>
        <Label htmlFor="timer-stop-project">Projekt</Label>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger id="timer-stop-project">
            <SelectValue placeholder="Projekt wählen" />
          </SelectTrigger>
          <SelectContent>
            {activeProjects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {client && <p className="mt-1 text-xs text-muted-foreground">Kunde: {client.name}</p>}
      </div>

      <div>
        <Label htmlFor="timer-stop-category">Kategorie</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="timer-stop-category">
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

      <div>
        <Label htmlFor="timer-stop-description">Was hast du gemacht?</Label>
        <Input
          id="timer-stop-description"
          placeholder="Kurzbeschreibung"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          autoFocus
        />
      </div>

      <div>
        <Label htmlFor="timer-stop-notes">Notizen (optional)</Label>
        <Textarea
          id="timer-stop-notes"
          placeholder="Details, Links, Rückfragen …"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Verwerfen
        </Button>
        <Button type="button" size="lg" className="flex-1" disabled={!projectId} onClick={handleConfirm}>
          Eintrag speichern
        </Button>
      </div>
    </div>
  )
}
