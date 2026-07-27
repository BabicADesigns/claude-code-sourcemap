import { useEffect, useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/services/utils'
import { todayISO } from '@/services/date'
import type { Client, Project } from '@/models'
import {
  BILLING_PERIOD_TYPE_LABELS,
  IMPLEMENTED_BILLING_PERIOD_TYPES,
  INCOME_CATEGORY_LABELS,
  INCOME_CATEGORY_ORDER,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_ORDER,
  PAYMENT_TYPE_LABELS,
  PAYMENT_TYPE_ORDER,
  currentMonthKey,
} from '../models'
import type { BillingPeriodType, ClientFinanceSettings, IncomeCategory, PaymentMethod, PaymentType } from '../models'
import type { NewPaymentInput } from '../hooks/usePayments'

export function PaymentForm({
  clients,
  projects,
  clientSettings,
  onAdd,
}: {
  clients: Client[]
  projects: Project[]
  clientSettings: ClientFinanceSettings[]
  onAdd: (input: NewPaymentInput) => void
}) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? '')
  const [projectId, setProjectId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayISO())
  const [billingPeriodType, setBillingPeriodType] = useState<BillingPeriodType>('single_date')
  const [billingMonth, setBillingMonth] = useState(currentMonthKey())
  const [type, setType] = useState<PaymentType>('hourly')
  const [method, setMethod] = useState<PaymentMethod | ''>('')
  const [category, setCategory] = useState<IncomeCategory | ''>('')
  const [note, setNote] = useState('')

  const clientProjects = projects.filter((p) => p.clientId === clientId)

  // Retainer clients default new payments to billing-by-month instead of a specific date.
  useEffect(() => {
    const settings = clientSettings.find((s) => s.clientId === clientId)
    if (settings?.billingPeriodType) setBillingPeriodType(settings.billingPeriodType)
    if (settings?.incomeModel === 'monthly_retainer') setType('retainer')
  }, [clientId, clientSettings])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const value = Number(amount)
    if (!clientId || !value || value <= 0) return

    const billingPeriod =
      billingPeriodType === 'month'
        ? { type: 'month' as const, month: billingMonth }
        : { type: 'single_date' as const, date }

    onAdd({
      clientId,
      projectId: projectId || undefined,
      amount: value,
      date,
      billingPeriod,
      type,
      method: method || undefined,
      category: category || undefined,
      note: note.trim() || undefined,
    })

    setAmount('')
    setNote('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl bg-card p-4 shadow-soft">
      <div>
        <Label htmlFor="pay-client">Kunde</Label>
        <Select
          value={clientId}
          onValueChange={(v) => {
            setClientId(v)
            setProjectId('')
          }}
        >
          <SelectTrigger id="pay-client">
            <SelectValue placeholder="Kunde wählen" />
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

      {clientProjects.length > 0 && (
        <div>
          <Label htmlFor="pay-project">Projekt (optional)</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger id="pay-project">
              <SelectValue placeholder="Kein Projekt" />
            </SelectTrigger>
            <SelectContent>
              {clientProjects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="pay-amount">Betrag (€)</Label>
          <Input
            id="pay-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="pay-date">Zahlungsdatum</Label>
          <Input id="pay-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div>
        <Label>Abrechnungszeitraum</Label>
        <div className="mb-2 inline-flex rounded-xl bg-cream-dark p-1">
          {IMPLEMENTED_BILLING_PERIOD_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setBillingPeriodType(t)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                billingPeriodType === t ? 'bg-white text-ink shadow-soft' : 'text-muted-foreground',
              )}
            >
              {BILLING_PERIOD_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        {billingPeriodType === 'month' && (
          <Input type="month" value={billingMonth} onChange={(e) => setBillingMonth(e.target.value)} />
        )}
      </div>

      <div>
        <Label htmlFor="pay-type">Zahlungsart</Label>
        <Select value={type} onValueChange={(v) => setType(v as PaymentType)}>
          <SelectTrigger id="pay-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_TYPE_ORDER.map((t) => (
              <SelectItem key={t} value={t}>
                {PAYMENT_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="pay-method">Methode (optional)</Label>
          <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
            <SelectTrigger id="pay-method">
              <SelectValue placeholder="Wählen" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHOD_ORDER.map((m) => (
                <SelectItem key={m} value={m}>
                  {PAYMENT_METHOD_LABELS[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="pay-category">Kategorie (optional)</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as IncomeCategory)}>
            <SelectTrigger id="pay-category">
              <SelectValue placeholder="Wählen" />
            </SelectTrigger>
            <SelectContent>
              {INCOME_CATEGORY_ORDER.map((c) => (
                <SelectItem key={c} value={c}>
                  {INCOME_CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="pay-note">Notiz (optional)</Label>
        <Textarea id="pay-note" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <Button type="submit" className="w-full" disabled={!clientId || !amount || Number(amount) <= 0}>
        <Plus className="h-4 w-4" />
        Zahlung erfassen
      </Button>
    </form>
  )
}
