import type { ClientFinanceSettings, Payment } from '../models'

const PAYMENTS_KEY = 'babic-work-log:finance-payments'
const CLIENT_SETTINGS_KEY = 'babic-work-log:finance-client-settings'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.error(`Failed to persist ${key} to localStorage`, err)
  }
}

export function loadPayments(): Payment[] {
  return read<Payment[]>(PAYMENTS_KEY, [])
}

export function savePayments(payments: Payment[]): void {
  write(PAYMENTS_KEY, payments)
}

export function loadClientFinanceSettings(): ClientFinanceSettings[] {
  return read<ClientFinanceSettings[]>(CLIENT_SETTINGS_KEY, [])
}

export function saveClientFinanceSettings(settings: ClientFinanceSettings[]): void {
  write(CLIENT_SETTINGS_KEY, settings)
}
