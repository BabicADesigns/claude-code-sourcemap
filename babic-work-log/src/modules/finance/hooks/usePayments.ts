import { useCallback, useEffect, useState } from 'react'
import { uid } from '@/services/utils'
import { loadPayments, savePayments } from '../services/storage'
import type { BillingPeriod, IncomeCategory, Payment, PaymentMethod, PaymentType } from '../models'

export interface NewPaymentInput {
  clientId: string
  projectId?: string
  amount: number
  date: string
  billingPeriod: BillingPeriod
  type: PaymentType
  method?: PaymentMethod
  category?: IncomeCategory
  note?: string
}

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>(() => loadPayments())

  useEffect(() => {
    savePayments(payments)
  }, [payments])

  const addPayment = useCallback((input: NewPaymentInput) => {
    const now = Date.now()
    const payment: Payment = { id: uid(), createdAt: now, updatedAt: now, ...input }
    setPayments((prev) => [...prev, payment])
    return payment
  }, [])

  const updatePayment = useCallback((id: string, patch: Partial<Omit<Payment, 'id' | 'createdAt'>>) => {
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p)))
  }, [])

  const deletePayment = useCallback((id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const replaceAll = useCallback((next: Payment[]) => {
    setPayments(next)
  }, [])

  return { payments, addPayment, updatePayment, deletePayment, replaceAll }
}
