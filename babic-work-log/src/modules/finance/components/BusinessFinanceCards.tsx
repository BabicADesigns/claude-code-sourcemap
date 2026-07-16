import { Wallet } from 'lucide-react'
import { formatCurrency } from '@/services/date'
import type { BusinessFinanceSummary as BusinessFinanceSummaryData } from '../services/calculations'
import { formatMonthKeyLabel } from '../models'

export function BusinessFinanceCards({ summary }: { summary: BusinessFinanceSummaryData }) {
  if (summary.expected === 0 && summary.received === 0) return null

  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Wallet className="h-4 w-4" />
        Business Finance · {formatMonthKeyLabel(summary.monthKey)}
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Erwartet</p>
          <p className="font-display text-lg text-ink">{formatCurrency(summary.expected)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Erhalten</p>
          <p className="font-display text-lg text-ink">{formatCurrency(summary.received)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Offen</p>
          <p className="font-display text-lg text-ink">{formatCurrency(summary.outstanding)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Zusatzzahlungen</p>
          <p className="font-display text-lg text-ink">{formatCurrency(summary.extra)}</p>
        </div>
      </div>
      <p className={`mt-3 text-xs font-medium ${summary.difference >= 0 ? 'text-sage-dark' : 'text-rose-dark'}`}>
        {summary.difference >= 0 ? '+' : ''}
        {formatCurrency(summary.difference)} zum Zielbetrag
      </p>
    </div>
  )
}
