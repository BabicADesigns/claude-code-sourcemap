import { useState } from 'react'
import { ClientsView } from '@/components/ClientsView'
import { ProjectsView } from '@/components/ProjectsView'
import { PaymentsView } from '@/modules/finance/components/PaymentsView'
import { cn } from '@/services/utils'
import type { Client, Project, ProjectDocument, TimeEntry } from '@/models'
import type { NewClientInput } from '@/hooks/useClients'
import type { NewProjectInput } from '@/hooks/useProjects'
import type { NewPaymentInput } from '@/modules/finance/hooks/usePayments'
import type { ClientFinanceSettings, Payment } from '@/modules/finance/models'

type SubView = 'clients' | 'projects' | 'payments'

export function ClientsAndProjectsView({
  clients,
  projects,
  entries,
  documents,
  payments,
  clientFinanceSettings,
  onAddClient,
  onUpdateClient,
  onArchiveClient,
  onDeleteClient,
  onAddProject,
  onUpdateProject,
  onArchiveProject,
  onDeleteProject,
  onAddDocument,
  onDeleteDocument,
  onAddPayment,
  onDeletePayment,
  onUpdateClientFinanceSettings,
}: {
  clients: Client[]
  projects: Project[]
  entries: TimeEntry[]
  documents: ProjectDocument[]
  payments: Payment[]
  clientFinanceSettings: ClientFinanceSettings[]
  onAddClient: (input: NewClientInput) => void
  onUpdateClient: (id: string, patch: Partial<Omit<Client, 'id'>>) => void
  onArchiveClient: (id: string, archived: boolean) => void
  onDeleteClient: (id: string) => void
  onAddProject: (input: NewProjectInput) => void
  onUpdateProject: (id: string, patch: Partial<Omit<Project, 'id'>>) => void
  onArchiveProject: (id: string, archived: boolean) => void
  onDeleteProject: (id: string) => void
  onAddDocument: (input: { projectId: string; name: string; label: string; dataUrl: string; mimeType: string }) => void
  onDeleteDocument: (id: string) => void
  onAddPayment: (input: NewPaymentInput) => void
  onDeletePayment: (id: string) => void
  onUpdateClientFinanceSettings: (
    clientId: string,
    patch: Partial<Omit<ClientFinanceSettings, 'clientId' | 'createdAt' | 'updatedAt'>>,
  ) => void
}) {
  const [view, setView] = useState<SubView>('projects')

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 pb-28 pt-6">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Kunden &amp; Projekte</h1>
      </header>

      <div className="inline-flex rounded-xl bg-cream-dark p-1">
        {(
          [
            ['projects', 'Projekte'],
            ['clients', 'Kunden'],
            ['payments', 'Zahlungen'],
          ] as [SubView, string][]
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={cn(
              'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
              view === v ? 'bg-white text-ink shadow-soft' : 'text-muted-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'projects' && (
        <ProjectsView
          projects={projects}
          clients={clients}
          entries={entries}
          documents={documents}
          onAdd={onAddProject}
          onUpdate={onUpdateProject}
          onArchive={onArchiveProject}
          onDelete={onDeleteProject}
          onAddDocument={onAddDocument}
          onDeleteDocument={onDeleteDocument}
        />
      )}
      {view === 'clients' && (
        <ClientsView
          clients={clients}
          projects={projects}
          clientFinanceSettings={clientFinanceSettings}
          onAdd={onAddClient}
          onUpdate={onUpdateClient}
          onArchive={onArchiveClient}
          onDelete={onDeleteClient}
          onUpdateClientFinanceSettings={onUpdateClientFinanceSettings}
        />
      )}
      {view === 'payments' && (
        <PaymentsView
          clients={clients}
          projects={projects}
          payments={payments}
          clientSettings={clientFinanceSettings}
          onAdd={onAddPayment}
          onDelete={onDeletePayment}
        />
      )}
    </div>
  )
}
