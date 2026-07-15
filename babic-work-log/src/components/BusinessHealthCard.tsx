import { TrendingUp } from 'lucide-react'
import { formatCurrency, formatHours } from '@/lib/date'
import type { BusinessHealth } from '@/lib/calculations'
import type { Project } from '@/lib/types'

export function BusinessHealthCard({ health, projects }: { health: BusinessHealth; projects: Project[] }) {
  if (health.amount === 0 && health.hours === 0) return null

  const mostProductive = projects.find((p) => p.id === health.mostProductiveProjectId)

  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <TrendingUp className="h-4 w-4" />
        Business Health · {health.weekLabel}
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Umsatz</p>
          <p className="font-display text-lg text-ink">{formatCurrency(health.amount)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Stunden</p>
          <p className="font-display text-lg text-ink">{formatHours(health.hours)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Ø Stundenlohn</p>
          <p className="font-display text-lg text-ink">{formatCurrency(health.averageRate)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Offene Forderungen</p>
          <p className="font-display text-lg text-ink">{formatCurrency(health.outstanding)}</p>
        </div>
      </div>
      {mostProductive && (
        <p className="mt-3 text-xs text-muted-foreground">
          Produktivstes Projekt: <span className="font-medium text-ink">{mostProductive.name}</span>
        </p>
      )}
    </div>
  )
}
