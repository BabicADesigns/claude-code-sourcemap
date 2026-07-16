import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/services/utils'
import {
  BILLING_PERIOD_TYPE_LABELS,
  IMPLEMENTED_BILLING_PERIOD_TYPES,
  IMPLEMENTED_INCOME_MODELS,
  INCOME_MODEL_LABELS,
} from '../models'
import type { ClientFinanceSettings, IncomeModel } from '../models'

export function ClientFinanceSettingsForm({
  clientId,
  settings,
  onUpdate,
}: {
  clientId: string
  settings: ClientFinanceSettings | null
  onUpdate: (
    clientId: string,
    patch: Partial<Omit<ClientFinanceSettings, 'clientId' | 'createdAt' | 'updatedAt'>>,
  ) => void
}) {
  const incomeModel = settings?.incomeModel ?? ''
  const isRetainer = incomeModel === 'monthly_retainer'

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="fin-model">Einkommensmodell</Label>
        <Select value={incomeModel} onValueChange={(v) => onUpdate(clientId, { incomeModel: v as IncomeModel })}>
          <SelectTrigger id="fin-model">
            <SelectValue placeholder="Wählen" />
          </SelectTrigger>
          <SelectContent>
            {IMPLEMENTED_INCOME_MODELS.map((m) => (
              <SelectItem key={m} value={m}>
                {INCOME_MODEL_LABELS[m]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isRetainer ? (
        <div>
          <Label htmlFor="fin-retainer">Monatliche Pauschale (€)</Label>
          <Input
            id="fin-retainer"
            type="number"
            inputMode="decimal"
            step="1"
            min="0"
            value={settings?.defaultRetainerAmount ?? ''}
            onChange={(e) => onUpdate(clientId, { defaultRetainerAmount: Number(e.target.value) || undefined })}
          />
        </div>
      ) : (
        <div>
          <Label htmlFor="fin-rate">Standard-Stundensatz (€)</Label>
          <Input
            id="fin-rate"
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            value={settings?.defaultRate ?? ''}
            onChange={(e) => onUpdate(clientId, { defaultRate: Number(e.target.value) || undefined })}
          />
        </div>
      )}

      <div>
        <Label>Standard-Abrechnungszeitraum</Label>
        <div className="inline-flex rounded-xl bg-cream-dark p-1">
          {IMPLEMENTED_BILLING_PERIOD_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onUpdate(clientId, { billingPeriodType: t })}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                (settings?.billingPeriodType ?? 'single_date') === t
                  ? 'bg-white text-ink shadow-soft'
                  : 'text-muted-foreground',
              )}
            >
              {BILLING_PERIOD_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
