import { formatDateShort, formatMonthLabel } from '@/services/date'

/** How a payment is anchored in time for grouping/reporting. `date_range` is
 * modeled so a future picker doesn't require a breaking change, but nothing
 * constructs one yet — see IMPLEMENTED_BILLING_PERIOD_TYPES. */
export type BillingPeriodType = 'single_date' | 'month' | 'date_range'

export const BILLING_PERIOD_TYPE_LABELS: Record<BillingPeriodType, string> = {
  single_date: 'Einzeldatum',
  month: 'Abrechnungsmonat',
  date_range: 'Zeitraum',
}

/** Only these billing period types are exposed in the UI today. */
export const IMPLEMENTED_BILLING_PERIOD_TYPES: BillingPeriodType[] = ['single_date', 'month']

export interface BillingPeriod {
  type: BillingPeriodType
  /** ISO yyyy-mm-dd — set when type is 'single_date'. */
  date?: string
  /** yyyy-MM — set when type is 'month'. */
  month?: string
  /** ISO yyyy-mm-dd — set when type is 'date_range'. */
  startDate?: string
  /** ISO yyyy-mm-dd — set when type is 'date_range'. */
  endDate?: string
}

/** How a client generates income. Only IMPLEMENTED_INCOME_MODELS drive real
 * calculations today (Business Finance cards, retainer month grouping) — the
 * rest are reserved so ClientFinanceSettings doesn't need a breaking change
 * when passive income / subscriptions / commission are built out. */
export type IncomeModel = 'hourly' | 'fixed_price' | 'monthly_retainer' | 'passive_income' | 'subscription' | 'commission'

export const INCOME_MODEL_LABELS: Record<IncomeModel, string> = {
  hourly: 'Stundenbasiert',
  fixed_price: 'Festpreis',
  monthly_retainer: 'Monatliche Pauschale',
  passive_income: 'Passives Einkommen',
  subscription: 'Abonnement',
  commission: 'Provision',
}

export const IMPLEMENTED_INCOME_MODELS: IncomeModel[] = ['hourly', 'fixed_price', 'monthly_retainer']

export type PaymentType = 'retainer' | 'hourly' | 'fixed_price' | 'extra' | 'advance' | 'bonus' | 'reimbursement'

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  retainer: 'Pauschale',
  hourly: 'Stundenbasiert',
  fixed_price: 'Festpreis',
  extra: 'Zusatzzahlung',
  advance: 'Vorauszahlung',
  bonus: 'Bonus',
  reimbursement: 'Spesenerstattung',
}

export const PAYMENT_TYPE_ORDER: PaymentType[] = [
  'retainer',
  'hourly',
  'fixed_price',
  'extra',
  'advance',
  'bonus',
  'reimbursement',
]

export type PaymentMethod = 'bank_transfer' | 'paypal' | 'cash' | 'crypto' | 'other'

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: 'Überweisung',
  paypal: 'PayPal',
  cash: 'Bar',
  crypto: 'Krypto',
  other: 'Sonstiges',
}

export const PAYMENT_METHOD_ORDER: PaymentMethod[] = ['bank_transfer', 'paypal', 'cash', 'crypto', 'other']

export type IncomeCategory = 'client_work' | 'retainer' | 'passive' | 'affiliate' | 'product' | 'other'

export const INCOME_CATEGORY_LABELS: Record<IncomeCategory, string> = {
  client_work: 'Kundenarbeit',
  retainer: 'Pauschale',
  passive: 'Passives Einkommen',
  affiliate: 'Affiliate',
  product: 'Produkt',
  other: 'Sonstiges',
}

export const INCOME_CATEGORY_ORDER: IncomeCategory[] = [
  'client_work',
  'retainer',
  'passive',
  'affiliate',
  'product',
  'other',
]

/** A standalone financial transaction, independent of any TimeEntry — see
 * `EntryPayment` in `@/models` for the (unrelated) partial-payment-per-entry
 * concept. This is the record every finance report and dashboard card reads
 * from. References `Client`/`Project` by id rather than duplicating data. */
export interface Payment {
  id: string
  clientId: string
  projectId?: string
  amount: number
  date: string // ISO yyyy-mm-dd — when the payment was actually received
  billingPeriod: BillingPeriod
  type: PaymentType
  method?: PaymentMethod
  category?: IncomeCategory
  note?: string
  createdAt: number
  updatedAt: number
}

/** Per-client financial defaults — kept separate from `Client` (in `@/models`)
 * so the core Client type stays finance-agnostic and any future module can
 * depend on it without pulling in billing concepts. */
export interface ClientFinanceSettings {
  clientId: string
  incomeModel?: IncomeModel
  defaultRate?: number
  defaultRetainerAmount?: number
  defaultCurrency?: string
  /** Billing period type new payments for this client should default to
   * (e.g. retainer clients default to 'month' instead of picking a date). */
  billingPeriodType?: BillingPeriodType
  createdAt: number
  updatedAt: number
}

export function currentMonthKey(reference = new Date()): string {
  return `${reference.getFullYear()}-${String(reference.getMonth() + 1).padStart(2, '0')}`
}

/** Grouping/sort key ('yyyy-MM') for a billing period, regardless of type. */
export function billingPeriodMonthKey(period: BillingPeriod): string {
  if (period.type === 'month' && period.month) return period.month
  if (period.type === 'single_date' && period.date) return period.date.slice(0, 7)
  if (period.type === 'date_range' && period.startDate) return period.startDate.slice(0, 7)
  return ''
}

/** ISO date usable for chronological sorting across all period types. */
export function billingPeriodSortDate(period: BillingPeriod): string {
  if (period.type === 'single_date') return period.date ?? ''
  if (period.type === 'month') return period.month ? `${period.month}-01` : ''
  if (period.type === 'date_range') return period.startDate ?? ''
  return ''
}

export function billingPeriodLabel(period: BillingPeriod): string {
  if (period.type === 'single_date') return period.date ? formatDateShort(period.date) : ''
  if (period.type === 'month') return period.month ? formatMonthKeyLabel(period.month) : ''
  if (period.type === 'date_range' && period.startDate && period.endDate) {
    return `${formatDateShort(period.startDate)} – ${formatDateShort(period.endDate)}`
  }
  return ''
}

export function formatMonthKeyLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number)
  if (!y || !m) return monthKey
  return formatMonthLabel(new Date(y, m - 1, 1))
}
