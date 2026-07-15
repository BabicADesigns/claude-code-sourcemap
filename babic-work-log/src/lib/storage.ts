import type { Client, Project, ProjectDocument, TimeEntry } from './types'
import { PROJECT_COLORS } from './types'
import { uid } from './utils'

const CLIENTS_KEY = 'babic-work-log:clients'
const PROJECTS_KEY = 'babic-work-log:projects'
const ENTRIES_KEY = 'babic-work-log:entries'
const DOCUMENTS_KEY = 'babic-work-log:documents'

interface SeedProject {
  name: string
  defaultRate: number
}

const DEFAULT_CLIENTS: { name: string; projects: SeedProject[] }[] = [
  {
    name: 'Yousef',
    projects: [
      { name: 'Deutschunterricht', defaultRate: 45 },
      { name: 'HGH Website', defaultRate: 45 },
    ],
  },
  {
    name: 'Ingo',
    projects: [
      { name: 'Recruiting', defaultRate: 45 },
      { name: 'DATEV', defaultRate: 45 },
      { name: 'FRIMO', defaultRate: 45 },
    ],
  },
  { name: 'Exportfirma', projects: [{ name: 'Export', defaultRate: 45 }] },
  { name: 'BabicADesigns', projects: [{ name: 'BabicADesigns', defaultRate: 45 }] },
]

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

function colorForIndex(i: number): string {
  return PROJECT_COLORS[i % PROJECT_COLORS.length]
}

/** Legacy (pre-1.1) projects had no clientId/color/pricingType. Migrate each
 * distinct legacy project into its own same-named client so existing user
 * data is never lost or renamed. */
function migrateLegacyProjects(legacy: (Project & { clientId?: string })[]): { clients: Client[]; projects: Project[] } {
  const clients: Client[] = []
  const projects: Project[] = legacy.map((p, i) => {
    if (p.clientId) return p as Project
    const client: Client = { id: uid(), name: p.name, createdAt: p.createdAt ?? Date.now() }
    clients.push(client)
    return {
      ...p,
      clientId: client.id,
      color: colorForIndex(i),
      pricingType: 'hourly',
    }
  })
  return { clients, projects }
}

function seedDefaults(): { clients: Client[]; projects: Project[] } {
  const clients: Client[] = []
  const projects: Project[] = []
  let colorIndex = 0
  for (const seed of DEFAULT_CLIENTS) {
    const client: Client = { id: uid(), name: seed.name, createdAt: Date.now() }
    clients.push(client)
    for (const p of seed.projects) {
      projects.push({
        id: uid(),
        name: p.name,
        clientId: client.id,
        color: colorForIndex(colorIndex++),
        defaultRate: p.defaultRate,
        pricingType: 'hourly',
        createdAt: Date.now(),
      })
    }
  }
  return { clients, projects }
}

let bootstrapped: { clients: Client[]; projects: Project[] } | null = null

/** Loads clients + projects together and migrates legacy (pre-1.1) data once. */
function bootstrap(): { clients: Client[]; projects: Project[] } {
  if (bootstrapped) return bootstrapped

  const existingProjects = read<Project[] | null>(PROJECTS_KEY, null)
  const existingClients = read<Client[] | null>(CLIENTS_KEY, null)

  let result: { clients: Client[]; projects: Project[] }

  if (!existingProjects || existingProjects.length === 0) {
    result = seedDefaults()
    write(CLIENTS_KEY, result.clients)
    write(PROJECTS_KEY, result.projects)
  } else if (!existingClients || existingProjects.some((p) => !p.clientId)) {
    const migrated = migrateLegacyProjects(existingProjects)
    result = {
      clients: [...(existingClients ?? []), ...migrated.clients],
      projects: migrated.projects,
    }
    write(CLIENTS_KEY, result.clients)
    write(PROJECTS_KEY, result.projects)
  } else {
    result = { clients: existingClients, projects: existingProjects }
  }

  bootstrapped = result
  return result
}

export function loadClients(): Client[] {
  return bootstrap().clients
}

export function saveClients(clients: Client[]): void {
  write(CLIENTS_KEY, clients)
}

export function loadProjects(): Project[] {
  return bootstrap().projects
}

export function saveProjects(projects: Project[]): void {
  write(PROJECTS_KEY, projects)
}

export function loadEntries(): TimeEntry[] {
  return read<TimeEntry[]>(ENTRIES_KEY, [])
}

export function saveEntries(entries: TimeEntry[]): void {
  write(ENTRIES_KEY, entries)
}

export function loadDocuments(): ProjectDocument[] {
  return read<ProjectDocument[]>(DOCUMENTS_KEY, [])
}

export function saveDocuments(documents: ProjectDocument[]): void {
  write(DOCUMENTS_KEY, documents)
}
