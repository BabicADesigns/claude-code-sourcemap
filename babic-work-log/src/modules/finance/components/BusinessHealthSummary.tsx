import { TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/services/date'
import type { BusinessHealthSummary as BusinessHealthSummaryData } from '../services/calculations'
import { formatMonthKeyLabel } from '../models'

export function BusinessHealthSummary({ summary }: { summary: BusinessHealthSummaryData }) {
  if (summary.received === 0 && summary.previousReceived === 0) return null

  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <TrendingUp className="h-4 w-4" />
        Umsatzentwicklung · {formatMonthKeyLabel(summary.monthKey)}
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Diesen Monat</p>
          <p className="font-display text-lg text-ink">{formatCurrency(summary.received)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Vormonat</p>
          <p className="font-display text-lg text-ink">{formatCurrency(summary.previousReceived)}</p>
        </div>
      </div>
      {summary.changePercent !== null && (
        <p className={`mt-3 text-xs font-medium ${summary.changePercent >= 0 ? 'text-sage-dark' : 'text-rose-dark'}`}>
          {summary.changePercent >= 0 ? '+' : ''}
          {summary.changePercent.toLocaleString('de-DE', { maximumFractionDigits: 1 })}% zum Vormonat
        </p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">
        {summary.activeRetainerClients} {summary.activeRetainerClients === 1 ? 'Kunde' : 'Kunden'} mit monatlicher
        Pauschale
      </p>
    </div>
  )
}
