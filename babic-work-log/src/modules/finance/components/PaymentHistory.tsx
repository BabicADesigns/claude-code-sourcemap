import { Trash2 } from 'lucide-react'
import { formatCurrency, formatDateShort } from '@/services/date'
import type { Client } from '@/models'
import { groupPaymentsByMonth } from '../services/calculations'
import { billingPeriodLabel, formatMonthKeyLabel, PAYMENT_TYPE_LABELS } from '../models'
import type { Payment } from '../models'

export function PaymentHistory({
  payments,
  clients,
  onDelete,
}: {
  payments: Payment[]
  clients: Client[]
  onDelete: (id: string) => void
}) {
  const groups = groupPaymentsByMonth(payments)
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? 'Unbekannt'

  if (groups.length === 0) {
    return (
      <p className="rounded-2xl bg-card p-4 text-center text-sm text-muted-foreground shadow-soft">
        Noch keine Zahlungen erfasst.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group.monthKey || 'ohne-zeitraum'}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-lg text-ink">
              {group.monthKey ? formatMonthKeyLabel(group.monthKey) : 'Ohne Zeitraum'}
            </h3>
            <span className="text-sm font-medium text-sage-dark">{formatCurrency(group.total)}</span>
          </div>
          <div className="space-y-2">
            {group.payments.map((p) => (
              <div key={p.id} className="rounded-2xl bg-card p-3 shadow-soft">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">
                      {clientName(p.clientId)} · {formatCurrency(p.amount)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {PAYMENT_TYPE_LABELS[p.type]} · {billingPeriodLabel(p.billingPeriod) || formatDateShort(p.date)}
                    </p>
                  </div>
                  <button
                    onClick={() => onDelete(p.id)}
                    className="shrink-0 rounded-full p-1.5 text-rose-dark hover:bg-rose/10"
                    aria-label="Zahlung löschen"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {p.note && <p className="mt-1 text-xs text-muted-foreground">{p.note}</p>}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
