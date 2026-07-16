import {
  endOfMonth,
  endOfWeek,
  formatDateShort,
  formatMonthLabel,
  formatWeekLabel,
  startOfMonth,
  startOfWeek,
  toISODate,
} from '@/services/date'

export type ReportType = 'business' | 'client_activity'

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  business: 'Business Report',
  client_activity: 'Kundenbericht',
}

export type ReportPeriodType = 'week' | 'month' | 'custom'

export const REPORT_PERIOD_TYPE_LABELS: Record<ReportPeriodType, string> = {
  week: 'Diese Woche',
  month: 'Dieser Monat',
  custom: 'Zeitraum wählen',
}

export const REPORT_PERIOD_TYPE_ORDER: ReportPeriodType[] = ['week', 'month', 'custom']

export interface ReportPeriod {
  type: ReportPeriodType
  /** ISO yyyy-mm-dd, inclusive. */
  start: string
  /** ISO yyyy-mm-dd, inclusive. */
  end: string
  label: string
}

export function resolveReportPeriod(
  type: ReportPeriodType,
  reference = new Date(),
  custom?: { start: string; end: string },
): ReportPeriod {
  if (type === 'week') {
    return { type, start: toISODate(startOfWeek(reference)), end: toISODate(endOfWeek(reference)), label: formatWeekLabel(reference) }
  }
  if (type === 'month') {
    return { type, start: toISODate(startOfMonth(reference)), end: toISODate(endOfMonth(reference)), label: formatMonthLabel(reference) }
  }
  const start = custom?.start ?? toISODate(reference)
  const end = custom?.end ?? toISODate(reference)
  return { type, start, end, label: `${formatDateShort(start)} – ${formatDateShort(end)}` }
}

/** Configuration for a single generated PDF report. Stateless and
 * on-demand — nothing here is persisted to localStorage, it only lives for
 * the lifetime of the report-builder sheet. */
export interface ReportConfig {
  type: ReportType
  /** Required for 'client_activity'; ignored for 'business' (which covers
   * every project with entries in the period). */
  projectId?: string
  period: ReportPeriod
  /** Client Activity Report only. Defaults to false — a report handed to a
   * client shows no rates, amounts, or totals unless explicitly turned on. */
  includeFinancials: boolean

  // --- Future Ready (Sprint 2.3) ---
  // Not read or written by any UI today. Shaped so Invoices, Signatures,
  // Attachments, and Customer Approval can be added to a report later
  // without a breaking change to ReportConfig — mirrors the Memory
  // Architecture fields already on TimeEntry (see src/future-ai/).
  /** Future: attach ProjectDocument ids to the generated report. */
  attachmentIds?: string[]
  /** Future: embed a captured signature image in the report footer. */
  signatureDataUrl?: string
  /** Future: track whether a client has approved this report. */
  customerApprovalStatus?: 'pending' | 'approved'
}
