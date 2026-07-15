import type { Project, TimeEntry } from './types'
import { uid } from './utils'

const PROJECTS_KEY = 'babic-work-log:projects'
const ENTRIES_KEY = 'babic-work-log:entries'

const DEFAULT_PROJECTS: Omit<Project, 'id' | 'createdAt'>[] = [
  { name: 'Lilian', defaultRate: 45 },
  { name: 'HGH Website', defaultRate: 45 },
  { name: 'Ingo', defaultRate: 45 },
  { name: 'Export', defaultRate: 45 },
  { name: 'BabicADesigns', defaultRate: 45 },
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
  localStorage.setItem(key, JSON.stringify(value))
}

export function loadProjects(): Project[] {
  const existing = read<Project[] | null>(PROJECTS_KEY, null)
  if (existing && existing.length > 0) return existing
  const seeded = DEFAULT_PROJECTS.map((p) => ({ ...p, id: uid(), createdAt: Date.now() }))
  write(PROJECTS_KEY, seeded)
  return seeded
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
