import { useRef, useState, type ChangeEvent } from 'react'
import { FileDown, FileText, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/input'
import { cn } from '@/services/utils'
import { effectiveRateForProject, summarizeByProject } from '@/services/calculations'
import { formatCurrency, formatHours } from '@/services/date'
import { PROJECT_COLORS, PROJECT_STATUS_LABELS, PROJECT_STATUS_ORDER } from '@/models'
import type { Client, PricingType, Project, ProjectDocument, TimeEntry } from '@/models'

const DOCUMENT_LABELS = ['Angebot', 'Vertrag', 'Rechnung', 'Hausaufgaben', 'Screenshot', 'PDF', 'Sonstiges']

export function ProjectDetailSheet({
  project,
  clients,
  entries,
  documents,
  onUpdate,
  onAddDocument,
  onDeleteDocument,
  onCreateReport,
}: {
  project: Project
  clients: Client[]
  entries: TimeEntry[]
  documents: ProjectDocument[]
  onUpdate: (id: string, patch: Partial<Omit<Project, 'id'>>) => void
  onAddDocument: (input: { projectId: string; name: string; label: string; dataUrl: string; mimeType: string }) => void
  onDeleteDocument: (id: string) => void
  onCreateReport: (projectId: string) => void
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploadLabel, setUploadLabel] = useState(DOCUMENT_LABELS[0])
  const summary = summarizeByProject(entries.filter((e) => e.projectId === project.id))[0]
  const hours = summary?.hours ?? 0
  const effectiveRate = effectiveRateForProject(project, entries)

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      onAddDocument({
        projectId: project.id,
        name: file.name,
        label: uploadLabel,
        dataUrl: reader.result as string,
        mimeType: file.type,
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-5 pb-6">
      <div>
        <Label htmlFor="detail-name">Projektname</Label>
        <Input id="detail-name" value={project.name} onChange={(e) => onUpdate(project.id, { name: e.target.value })} />
      </div>

      <div>
        <Label htmlFor="detail-client">Kunde</Label>
        <Select value={project.clientId} onValueChange={(clientId) => onUpdate(project.id, { clientId })}>
          <SelectTrigger id="detail-client">
            <SelectValue />
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
        <Label>Farbe</Label>
        <div className="flex flex-wrap gap-2">
          {PROJECT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onUpdate(project.id, { color })}
              className={cn(
                'h-8 w-8 rounded-full border-2 transition-transform',
                project.color === color ? 'scale-110 border-ink' : 'border-transparent',
              )}
              style={{ backgroundColor: color }}
              aria-label={`Farbe ${color} wählen`}
            />
          ))}
        </div>
      </div>

      <div>
        <Label>Status</Label>
        <div className="flex gap-2">
          {PROJECT_STATUS_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onUpdate(project.id, { status: s })}
              className={cn(
                'flex-1 rounded-xl border px-2 py-2 text-xs font-medium transition-colors',
                project.status === s ? 'border-sage bg-sage/15 text-sage-dark' : 'border-border text-muted-foreground',
              )}
            >
              {PROJECT_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
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
              onClick={() => onUpdate(project.id, { pricingType: type })}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                project.pricingType === type ? 'bg-white text-ink shadow-soft' : 'text-muted-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {project.pricingType === 'fixed' ? (
        <div>
          <Label htmlFor="detail-fixed">Festpreis (€)</Label>
          <Input
            id="detail-fixed"
            type="number"
            inputMode="decimal"
            step="1"
            min="0"
            value={project.fixedPrice ?? ''}
            onChange={(e) => onUpdate(project.id, { fixedPrice: Number(e.target.value) || 0 })}
          />
          {hours > 0 && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Gearbeitet: {formatHours(hours)} → effektiver Stundenlohn: {formatCurrency(effectiveRate)}/h
            </p>
          )}
        </div>
      ) : (
        <div>
          <Label htmlFor="detail-rate">Standard-Stundensatz (€)</Label>
          <Input
            id="detail-rate"
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            value={project.defaultRate}
            onChange={(e) => onUpdate(project.id, { defaultRate: Number(e.target.value) || 0 })}
          />
        </div>
      )}

      <div>
        <Label htmlFor="detail-notes">Notizen</Label>
        <Textarea
          id="detail-notes"
          value={project.notes ?? ''}
          onChange={(e) => onUpdate(project.id, { notes: e.target.value || undefined })}
        />
      </div>

      <div>
        <Label>Dokumente</Label>
        <p className="mb-2 text-xs text-muted-foreground">
          Angebot, Vertrag, Rechnung, Screenshots — alles lokal gespeichert.
        </p>

        {documents.length > 0 && (
          <ul className="mb-3 space-y-1.5">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-2 rounded-xl bg-cream-dark/60 px-3 py-2">
                {doc.mimeType.startsWith('image/') ? (
                  <img src={doc.dataUrl} alt={doc.name} className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-muted-foreground">
                    <FileText className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="sage">{doc.label}</Badge>
                  </div>
                  <a
                    href={doc.dataUrl}
                    download={doc.name}
                    className="mt-0.5 block truncate text-xs text-muted-foreground underline"
                  >
                    {doc.name}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteDocument(doc.id)}
                  className="shrink-0 rounded-full p-1.5 text-rose-dark hover:bg-rose/10"
                  aria-label="Dokument löschen"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <Select value={uploadLabel} onValueChange={setUploadLabel}>
            <SelectTrigger className="w-32 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_LABELS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:bg-cream-dark"
          >
            <Upload className="h-4 w-4" />
            Datei wählen
          </button>
        </div>
        <input ref={fileInput} type="file" className="hidden" onChange={handleFile} />
      </div>

      <Button variant="secondary" className="w-full" onClick={() => onCreateReport(project.id)}>
        <FileDown className="h-4 w-4" />
        Kundenbericht erstellen
      </Button>
    </div>
  )
}
