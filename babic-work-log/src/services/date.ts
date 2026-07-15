export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayISO(): string {
  return toISODate(new Date())
}

/** Monday-based start of week */
export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0 = Sunday
  const diff = (day === 0 ? -6 : 1) - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfWeek(date: Date): Date {
  const start = startOfWeek(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

/** ISO 8601 week number and week-year */
export function getISOWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return { year: d.getUTCFullYear(), week }
}

export function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + weeks * 7)
  return d
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

export function isSameDay(a: Date, b: Date): boolean {
  return toISODate(a) === toISODate(b)
}

/** Monday-first weekday short labels, matching startOfWeek's Monday anchor. */
export const WEEKDAY_SHORT_MONDAY_FIRST = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

/** Full 6x7 month grid (Monday-first), including leading/trailing days from
 * adjacent months so every week row is complete. */
export function getMonthGrid(reference: Date): Date[] {
  const firstOfMonth = startOfMonth(reference)
  const gridStart = startOfWeek(firstOfMonth)
  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    days.push(d)
  }
  return days
}

const WEEKDAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
const MONTH_NAMES = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
]

export function formatDateDisplay(iso: string): string {
  const d = fromISODate(iso)
  return `${WEEKDAY_SHORT[d.getDay()]}, ${d.getDate()}. ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
}

export function formatDateShort(iso: string): string {
  const d = fromISODate(iso)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

export function formatMonthLabel(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`
}

export function formatWeekLabel(date: Date): string {
  const { year, week } = getISOWeek(date)
  const start = startOfWeek(date)
  const end = endOfWeek(date)
  const range = `${start.getDate()}.${start.getMonth() + 1}. – ${end.getDate()}.${end.getMonth() + 1}.`
  return `KW ${week} · ${range} ${year}`
}

export function formatHours(hours: number): string {
  return `${hours.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} h`
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}
