import { CheckCircle2 } from 'lucide-react'
import { formatCurrency, formatHours } from '@/lib/date'
import type { DayClose } from '@/lib/calculations'
import type { Project } from '@/lib/types'

export function DayCloseContent({ summary, projects }: { summary: DayClose; projects: Project[] }) {
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? 'Unbekannt'

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-2 rounded-xl bg-sage/10 px-4 py-3 text-sage-dark">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">Guter Tag! Hier deine Zusammenfassung.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Heute gearbeitet" value={formatHours(summary.hours)} />
        <Stat label="Verdienst" value={formatCurrency(summary.amount)} />
        <Stat label="Offene Forderungen" value={formatCurrency(summary.outstanding)} />
        <Stat label="Notizen gespeichert" value={String(summary.notes.length)} />
      </div>

      {summary.byProject.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Projektübersicht</h3>
          <ul className="space-y-1.5">
            {summary.byProject.map((row) => (
              <li key={row.projectId} className="flex items-center justify-between rounded-xl bg-cream-dark/60 px-3 py-2 text-sm">
                <span className="text-ink">{projectName(row.projectId)}</span>
                <span className="text-muted-foreground">
                  {formatHours(row.hours)} · {formatCurrency(row.amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.notes.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Notizen</h3>
          <ul className="space-y-1.5">
            {summary.notes.map((note, i) => (
              <li key={i} className="rounded-xl bg-cream-dark/60 px-3 py-2 text-sm text-ink">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-cream-dark/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-lg text-ink">{value}</p>
    </div>
  )
}
