import { useEffect, useMemo, useState } from 'react'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { BottomNav } from '@/components/BottomNav'
import { Dashboard } from '@/components/Dashboard'
import { PeriodsView } from '@/components/PeriodsView'
import { ClientsAndProjectsView } from '@/components/ClientsAndProjectsView'
import { StatsView } from '@/components/StatsView'
import { EntryForm } from '@/components/EntryForm'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useEntries } from '@/hooks/useEntries'
import { useProjects } from '@/hooks/useProjects'
import { useClients } from '@/hooks/useClients'
import { useDocuments } from '@/hooks/useDocuments'
import { useTimer, type StoppedTimer } from '@/hooks/useTimer'
import { enrichEntries } from '@/lib/calculations'
import { todayISO } from '@/lib/date'
import { uid } from '@/lib/utils'
import type { TimeEntry } from '@/lib/types'

export default function App() {
  const { entries, upsertEntry, deleteEntry } = useEntries()
  const { projects, addProject, updateProject, archiveProject, deleteProject } = useProjects()
  const { clients, addClient, updateClient, archiveClient, deleteClient } = useClients()
  const { documents, addDocument, deleteDocument } = useDocuments()
  const timer = useTimer()

  const [view, setView] = useState('dashboard')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [pendingOpenId, setPendingOpenId] = useState<string | null>(null)

  const enrichedEntries = useMemo(() => enrichEntries(entries, projects), [entries, projects])

  useEffect(() => {
    if (!pendingOpenId) return
    const found = entries.find((e) => e.id === pendingOpenId)
    if (found) {
      setEditingEntry(found)
      setSheetOpen(true)
      setPendingOpenId(null)
    }
  }, [entries, pendingOpenId])

  function openNewEntry() {
    setEditingEntry(null)
    setSheetOpen(true)
  }

  function openEntry(entry: TimeEntry) {
    setEditingEntry(entry)
    setSheetOpen(true)
  }

  function handleTimerStopped(result: StoppedTimer) {
    const project = projects.find((p) => p.id === result.projectId)
    const id = uid()
    upsertEntry({
      id,
      projectId: result.projectId,
      date: todayISO(),
      category: result.category,
      manualHours: result.hours,
      hourlyRate: project?.defaultRate ?? 0,
      notes: '',
      status: 'offen',
      source: 'timer',
    })
    setPendingOpenId(id)
  }

  return (
    <Tabs value={view} onValueChange={setView} className="min-h-dvh bg-background">
      <TabsContent value="dashboard" tabIndex={-1}>
        <Dashboard
          entries={enrichedEntries}
          projects={projects}
          timer={timer}
          onNewEntry={openNewEntry}
          onSelectEntry={openEntry}
          onTimerStopped={handleTimerStopped}
        />
      </TabsContent>
      <TabsContent value="periods" tabIndex={-1}>
        <PeriodsView entries={enrichedEntries} projects={projects} onSelectEntry={openEntry} />
      </TabsContent>
      <TabsContent value="clients-projects" tabIndex={-1}>
        <ClientsAndProjectsView
          clients={clients}
          projects={projects}
          entries={entries}
          documents={documents}
          onAddClient={addClient}
          onUpdateClient={updateClient}
          onArchiveClient={archiveClient}
          onDeleteClient={deleteClient}
          onAddProject={addProject}
          onUpdateProject={updateProject}
          onArchiveProject={archiveProject}
          onDeleteProject={deleteProject}
          onAddDocument={addDocument}
          onDeleteDocument={deleteDocument}
        />
      </TabsContent>
      <TabsContent value="stats" tabIndex={-1}>
        <StatsView entries={enrichedEntries} projects={projects} clients={clients} />
      </TabsContent>

      <BottomNav />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent open={sheetOpen} title={editingEntry ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}>
          <EntryForm
            projects={projects}
            clients={clients}
            entries={entries}
            timer={timer}
            initialEntry={editingEntry}
            onSave={upsertEntry}
            onDelete={deleteEntry}
            onClose={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </Tabs>
  )
}
