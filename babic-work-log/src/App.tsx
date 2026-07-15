import { useState } from 'react'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { BottomNav } from '@/components/BottomNav'
import { Dashboard } from '@/components/Dashboard'
import { WeekView } from '@/components/WeekView'
import { MonthView } from '@/components/MonthView'
import { ProjectsView } from '@/components/ProjectsView'
import { EntryForm } from '@/components/EntryForm'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useEntries } from '@/hooks/useEntries'
import { useProjects } from '@/hooks/useProjects'
import type { TimeEntry } from '@/lib/types'

export default function App() {
  const { entries, upsertEntry, deleteEntry } = useEntries()
  const { projects, addProject, updateProject, archiveProject, deleteProject } = useProjects()
  const [view, setView] = useState('dashboard')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)

  function openNewEntry() {
    setEditingEntry(null)
    setSheetOpen(true)
  }

  function openEntry(entry: TimeEntry) {
    setEditingEntry(entry)
    setSheetOpen(true)
  }

  return (
    <Tabs value={view} onValueChange={setView} className="min-h-dvh bg-background">
      <TabsContent value="dashboard" tabIndex={-1}>
        <Dashboard entries={entries} projects={projects} onNewEntry={openNewEntry} onSelectEntry={openEntry} />
      </TabsContent>
      <TabsContent value="week" tabIndex={-1}>
        <WeekView entries={entries} projects={projects} onSelectEntry={openEntry} />
      </TabsContent>
      <TabsContent value="month" tabIndex={-1}>
        <MonthView entries={entries} projects={projects} />
      </TabsContent>
      <TabsContent value="projects" tabIndex={-1}>
        <ProjectsView
          projects={projects}
          entries={entries}
          onAdd={addProject}
          onUpdate={updateProject}
          onArchive={archiveProject}
          onDelete={deleteProject}
        />
      </TabsContent>

      <BottomNav />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent open={sheetOpen} title={editingEntry ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}>
          <EntryForm
            projects={projects}
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
