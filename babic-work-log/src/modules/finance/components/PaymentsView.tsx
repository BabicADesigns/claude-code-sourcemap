import type { Client, Project } from '@/models'
import { PaymentForm } from './PaymentForm'
import { PaymentHistory } from './PaymentHistory'
import type { NewPaymentInput } from '../hooks/usePayments'
import type { ClientFinanceSettings, Payment } from '../models'

export function PaymentsView({
  clients,
  projects,
  payments,
  clientSettings,
  onAdd,
  onDelete,
}: {
  clients: Client[]
  projects: Project[]
  payments: Payment[]
  clientSettings: ClientFinanceSettings[]
  onAdd: (input: NewPaymentInput) => void
  onDelete: (id: string) => void
}) {
  const activeClients = clients.filter((c) => c.status !== 'archived')

  return (
    <div className="space-y-5">
      {activeClients.length > 0 ? (
        <PaymentForm clients={activeClients} projects={projects} clientSettings={clientSettings} onAdd={onAdd} />
      ) : (
        <p className="rounded-2xl bg-card p-4 text-center text-sm text-muted-foreground shadow-soft">
          Lege zuerst einen Kunden an, um Zahlungen zu erfassen.
        </p>
      )}
      <PaymentHistory payments={payments} clients={clients} onDelete={onDelete} />
    </div>
  )
}
