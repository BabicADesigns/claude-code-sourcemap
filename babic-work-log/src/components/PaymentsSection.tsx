import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDateShort, todayISO } from '@/services/date'
import { paymentsSum } from '@/services/calculations'
import type { Payment } from '@/models'
import { uid } from '@/services/utils'

export function PaymentsSection({
  payments,
  totalAmount,
  onChange,
}: {
  payments: Payment[]
  totalAmount: number
  onChange: (payments: Payment[]) => void
}) {
  const [amount, setAmount] = useState('')
  const paid = paymentsSum(payments)
  const remaining = Math.max(0, Math.round((totalAmount - paid) * 100) / 100)

  function addPayment() {
    const value = Number(amount)
    if (!value || value <= 0) return
    onChange([...payments, { id: uid(), amount: value, date: todayISO() }])
    setAmount('')
  }

  function removePayment(id: string) {
    onChange(payments.filter((p) => p.id !== id))
  }

  return (
    <div className="space-y-2 rounded-xl bg-cream-dark/60 p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Bezahlt</span>
        <span className="font-medium text-sage-dark">{formatCurrency(paid)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Offen</span>
        <span className="font-medium text-ink">{formatCurrency(remaining)}</span>
      </div>

      {payments.length > 0 && (
        <ul className="space-y-1 pt-1">
          {payments.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 text-sm">
              <span className="text-ink">
                {formatCurrency(p.amount)} <span className="text-muted-foreground">· {formatDateShort(p.date)}</span>
              </span>
              <button
                type="button"
                onClick={() => removePayment(p.id)}
                className="rounded-full p-1 text-rose-dark hover:bg-rose/10"
                aria-label="Teilzahlung entfernen"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2 pt-1">
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="Betrag (€)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-9 text-sm"
        />
        <Button type="button" variant="secondary" size="sm" onClick={addPayment} disabled={!amount || Number(amount) <= 0}>
          <Plus className="h-3.5 w-3.5" />
          Teilzahlung
        </Button>
      </div>
    </div>
  )
}
