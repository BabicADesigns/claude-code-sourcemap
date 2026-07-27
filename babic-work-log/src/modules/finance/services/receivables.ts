import type { EnrichedEntry, Project } from '@/models'
import type { ClientFinanceSettings, Payment } from '../models'
import { billingPeriodMonthKey, formatMonthKeyLabel } from '../models'

export type ReceivableStatus = 'open' | 'partially_paid' | 'paid'

/**
 * A receivable is the thing that's actually either open or paid — not a raw
 * entry amount. Retainer clients are billed one flat amount per month, so
 * their logged entries don't each carry their own separate debt; everyone
 * else keeps being billed per entry, exactly as before (entry.status /
 * EntryPayment). Computed on the fly from entries + payments, nothing here
 * is persisted.
 */
export interface Receivable {
  id: string
  clientId: string
  projectId?: string
  source: 'retainer' | 'work'
  period: string
  periodLabel: string
  amount: number
  paidAmount: number
  outstandingAmount: number
  status: ReceivableStatus
  entryIds: string[]
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function statusFor(amount: number, paid: number): ReceivableStatus {
  if (paid <= 0.005) return 'open'
  if (paid >= amount - 0.005) return 'paid'
  return 'partially_paid'
}

function retainerClientIds(clientSettings: ClientFinanceSettings[]): Set<string> {
  return new Set(
    clientSettings
      .filter((s) => s.incomeModel === 'monthly_retainer' && (s.defaultRetainerAmount ?? 0) > 0)
      .map((s) => s.clientId),
  )
}

/**
 * Builds one receivable per retainer client per month that has activity
 * (logged entries and/or recorded payments) — target is the client's flat
 * retainer amount, paid is whatever was actually recorded that month
 * (base retainer + any extra/bonus payments all count toward the same
 * target, same as the existing retainer-month reconciliation).
 */
function retainerReceivables(
  entries: EnrichedEntry[],
  projects: Project[],
  clientSettings: ClientFinanceSettings[],
  payments: Payment[],
  retainerIds: Set<string>,
): Receivable[] {
  const clientIdForProject = new Map(projects.map((p) => [p.id, p.clientId]))
  const months = new Map<string, { clientId: string; monthKey: string; entryIds: string[] }>()

  for (const e of entries) {
    const clientId = clientIdForProject.get(e.projectId)
    if (!clientId || !retainerIds.has(clientId)) continue
    const monthKey = e.date.slice(0, 7)
    const key = `${clientId}:${monthKey}`
    const bucket = months.get(key) ?? { clientId, monthKey, entryIds: [] }
    bucket.entryIds.push(e.id)
    months.set(key, bucket)
  }
  for (const p of payments) {
    if (!retainerIds.has(p.clientId)) continue
    const monthKey = billingPeriodMonthKey(p.billingPeriod)
    if (!monthKey) continue
    const key = `${p.clientId}:${monthKey}`
    if (!months.has(key)) months.set(key, { clientId: p.clientId, monthKey, entryIds: [] })
  }

  return [...months.values()].map(({ clientId, monthKey, entryIds }) => {
    const target = clientSettings.find((s) => s.clientId === clientId)?.defaultRetainerAmount ?? 0
    const received = round2(
      payments
        .filter((p) => p.clientId === clientId && billingPeriodMonthKey(p.billingPeriod) === monthKey)
        .reduce((sum, p) => sum + p.amount, 0),
    )
    const paidAmount = Math.min(received, target)
    const outstandingAmount = Math.max(0, round2(target - received))
    return {
      id: `retainer-${clientId}-${monthKey}`,
      clientId,
      source: 'retainer' as const,
      period: monthKey,
      periodLabel: formatMonthKeyLabel(monthKey),
      amount: target,
      paidAmount,
      outstandingAmount,
      status: statusFor(target, received),
      entryIds,
    }
  })
}

/** Everyone not covered by a retainer keeps the existing per-entry billing. */
function workReceivables(entries: EnrichedEntry[], projects: Project[], retainerIds: Set<string>): Receivable[] {
  const clientIdForProject = new Map(projects.map((p) => [p.id, p.clientId]))
  return entries
    .filter((e) => {
      const clientId = clientIdForProject.get(e.projectId)
      return !clientId || !retainerIds.has(clientId)
    })
    .map((e) => ({
      id: `entry-${e.id}`,
      clientId: clientIdForProject.get(e.projectId) ?? 'unknown',
      projectId: e.projectId,
      source: 'work' as const,
      period: e.date,
      periodLabel: e.date,
      amount: e.amount,
      paidAmount: e.paidAmount,
      outstandingAmount: e.outstandingAmount,
      status: e.displayStatus === 'offen' ? 'open' : e.displayStatus === 'bezahlt' ? 'paid' : 'partially_paid',
      entryIds: [e.id],
    }))
}

export function computeReceivables(
  entries: EnrichedEntry[],
  projects: Project[],
  clientSettings: ClientFinanceSettings[],
  payments: Payment[],
): Receivable[] {
  const retainerIds = retainerClientIds(clientSettings)
  return [
    ...retainerReceivables(entries, projects, clientSettings, payments, retainerIds),
    ...workReceivables(entries, projects, retainerIds),
  ]
}

/** Open Receivables = only Open or Partially Paid — fully paid receivables never count. */
export function sumOpenReceivables(receivables: Receivable[]): number {
  return round2(receivables.filter((r) => r.status !== 'paid').reduce((sum, r) => sum + r.outstandingAmount, 0))
}

export function sumReceivablesPaid(receivables: Receivable[]): number {
  return round2(receivables.reduce((sum, r) => sum + r.paidAmount, 0))
}
