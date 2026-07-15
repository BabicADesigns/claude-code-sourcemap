import { motion } from 'framer-motion'
import { Timer } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { entryAmount, entryHours } from '@/lib/calculations'
import { formatDateShort, formatCurrency, formatHours } from '@/lib/date'
import type { EnrichedEntry, Project, TimeEntry } from '@/lib/types'

export function EntryList({
  entries,
  projects,
  onSelect,
  showDate = false,
  emptyLabel = 'Noch keine Einträge.',
}: {
  entries: (TimeEntry | EnrichedEntry)[]
  projects: Project[]
  onSelect: (entry: TimeEntry) => void
  showDate?: boolean
  emptyLabel?: string
}) {
  const projectById = new Map(projects.map((p) => [p.id, p]))

  if (entries.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyLabel}</p>
  }

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)

  return (
    <ul className="space-y-2">
      {sorted.map((entry) => {
        const project = projectById.get(entry.projectId)
        const status = 'displayStatus' in entry ? entry.displayStatus : entry.status
        return (
          <motion.li key={entry.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <button
              onClick={() => onSelect(entry)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3 text-left shadow-soft transition-transform active:scale-[0.99]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: project?.color ?? '#8B9B7A' }}
                  />
                  <p className="truncate font-medium text-ink">{project?.name ?? 'Unbekannt'}</p>
                  {entry.source === 'timer' && <Timer className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                  <StatusBadge status={status} />
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {showDate ? `${formatDateShort(entry.date)} · ` : ''}
                  {entry.category}
                  {entry.notes ? ` · ${entry.notes}` : ''}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-medium text-ink">{formatHours(entryHours(entry))}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(entryAmount(entry))}</p>
              </div>
            </button>
          </motion.li>
        )
      })}
    </ul>
  )
}
