import { addMonths } from '@/services/date'
import type { ClientFinanceSettings, Payment } from '../models'
import { billingPeriodMonthKey, currentMonthKey } from '../models'

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function sumPaymentAmount(payments: Payment[]): number {
  return round2(payments.reduce((sum, p) => sum + p.amount, 0))
}

export function paymentsForClientMonth(payments: Payment[], clientId: string, monthKey: string): Payment[] {
  return payments.filter((p) => p.clientId === clientId && billingPeriodMonthKey(p.billingPeriod) === monthKey)
}

export interface RetainerMonthSummary {
  clientId: string
  monthKey: string
  targetAmount: number
  receivedAmount: number
  /** received - target. Positive means over target, negative means under. */
  difference: number
  status: 'under' | 'met' | 'over'
  payments: Payment[]
}

/** Reconciles a retainer client's target for one billing month against
 * however many payments landed in it — a base retainer payment plus any
 * number of extra payments all count toward the same month. */
export function computeRetainerMonth(
  payments: Payment[],
  clientId: string,
  monthKey: string,
  targetAmount: number,
): RetainerMonthSummary {
  const monthPayments = paymentsForClientMonth(payments, clientId, monthKey)
  const receivedAmount = sumPaymentAmount(monthPayments)
  const difference = round2(receivedAmount - targetAmount)
  const status: RetainerMonthSummary['status'] = difference > 0.005 ? 'over' : difference < -0.005 ? 'under' : 'met'
  return { clientId, monthKey, targetAmount, receivedAmount, difference, status, payments: monthPayments }
}

export interface MonthGroup {
  monthKey: string
  payments: Payment[]
  total: number
}

/** Newest month first, for Payment History readability. */
export function groupPaymentsByMonth(payments: Payment[]): MonthGroup[] {
  const map = new Map<string, Payment[]>()
  for (const p of payments) {
    const key = billingPeriodMonthKey(p.billingPeriod)
    const list = map.get(key) ?? []
    list.push(p)
    map.set(key, list)
  }
  return [...map.entries()]
    .map(([monthKey, list]) => ({ monthKey, payments: list, total: sumPaymentAmount(list) }))
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
}

export interface BusinessFinanceSummary {
  monthKey: string
  /** Sum of active monthly-retainer targets for this month. Hourly/fixed-price
   * income already has its own expectation tracking via the hours-based
   * Business Health card — this summary covers the standalone Payment layer
   * (retainers + extras) so the two don't double-count. */
  expected: number
  received: number
  outstanding: number
  extra: number
  /** received - expected. */
  difference: number
}

export function computeBusinessFinance(
  payments: Payment[],
  clientSettings: ClientFinanceSettings[],
  monthKey: string,
): BusinessFinanceSummary {
  const monthPayments = payments.filter((p) => billingPeriodMonthKey(p.billingPeriod) === monthKey)
  const received = sumPaymentAmount(monthPayments)

  const retainerTargets = clientSettings.filter((s) => s.incomeModel === 'monthly_retainer' && s.defaultRetainerAmount)
  const expected = round2(retainerTargets.reduce((sum, s) => sum + (s.defaultRetainerAmount ?? 0), 0))

  const extra = sumPaymentAmount(monthPayments.filter((p) => p.type === 'extra'))
  const outstanding = Math.max(0, round2(expected - received))
  const difference = round2(received - expected)

  return { monthKey, expected, received, outstanding, extra, difference }
}

export interface BusinessHealthSummary {
  monthKey: string
  received: number
  previousMonthKey: string
  previousReceived: number
  /** null when the previous month had no income (avoids a divide-by-zero / infinite jump). */
  changePercent: number | null
  activeRetainerClients: number
}

/** Revenue-focused monthly recap over the standalone Payment layer — distinct
 * from the existing hours-based `computeBusinessHealth` in the core
 * calculations module, which stays weekly and hours-focused. */
export function computeBusinessHealthSummary(
  payments: Payment[],
  clientSettings: ClientFinanceSettings[],
  reference = new Date(),
): BusinessHealthSummary {
  const monthKey = currentMonthKey(reference)
  const previousMonthKey = currentMonthKey(addMonths(reference, -1))
  const received = sumPaymentAmount(payments.filter((p) => billingPeriodMonthKey(p.billingPeriod) === monthKey))
  const previousReceived = sumPaymentAmount(
    payments.filter((p) => billingPeriodMonthKey(p.billingPeriod) === previousMonthKey),
  )
  const changePercent = previousReceived > 0 ? round2(((received - previousReceived) / previousReceived) * 100) : null
  const activeRetainerClients = clientSettings.filter((s) => s.incomeModel === 'monthly_retainer').length

  return { monthKey, received, previousMonthKey, previousReceived, changePercent, activeRetainerClients }
}

// --- Reports (data model only — no screen renders these yet) ---

export interface RevenueBucket {
  key: string
  amount: number
}

function bucketBy(payments: Payment[], keyFn: (p: Payment) => string): RevenueBucket[] {
  const map = new Map<string, number>()
  for (const p of payments) {
    const key = keyFn(p)
    map.set(key, round2((map.get(key) ?? 0) + p.amount))
  }
  return [...map.entries()].map(([key, amount]) => ({ key, amount })).sort((a, b) => b.amount - a.amount)
}

export function revenueByMonth(payments: Payment[]): RevenueBucket[] {
  return bucketBy(payments, (p) => billingPeriodMonthKey(p.billingPeriod)).sort((a, b) => a.key.localeCompare(b.key))
}

export function revenueByClient(payments: Payment[]): RevenueBucket[] {
  return bucketBy(payments, (p) => p.clientId)
}

export function revenueByCategory(payments: Payment[]): RevenueBucket[] {
  return bucketBy(payments, (p) => p.category ?? 'other')
}

export function revenueByProject(payments: Payment[]): RevenueBucket[] {
  return bucketBy(payments, (p) => p.projectId ?? 'none')
}

export function revenueByPaymentType(payments: Payment[]): RevenueBucket[] {
  return bucketBy(payments, (p) => p.type)
}
