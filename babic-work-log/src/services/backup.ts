import { CURRENT_SCHEMA_VERSION, normalizeClient, normalizeDocument, normalizeEntry, migrateLegacyProjects, normalizeProject } from './migrations'
import type { Client, Project, ProjectDocument, TimeEntry } from '../models'
import { toISODate } from './date'

export interface BackupFile {
  meta: {
    app: 'babic-work-log'
    version: number
    exportedAt: string
  }
  clients: Client[]
  projects: Project[]
  entries: TimeEntry[]
  documents: ProjectDocument[]
}

export interface BackupData {
  clients: Client[]
  projects: Project[]
  entries: TimeEntry[]
  documents: ProjectDocument[]
}

export function buildBackup(data: BackupData): BackupFile {
  return {
    meta: {
      app: 'babic-work-log',
      version: CURRENT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
    },
    ...data,
  }
}

export function backupFilename(date = new Date()): string {
  return `babica-worklog-backup-${toISODate(date)}.json`
}

export function downloadBackup(backup: BackupFile): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = backupFilename()
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export class BackupParseError extends Error {}

/** Validates and normalizes an arbitrary JSON payload into current-shape
 * data. Accepts backups from older schema versions (missing fields get
 * sensible defaults, legacy client-less projects get migrated) and rejects
 * anything that isn't recognizably a Babic Work Log backup. */
export function parseBackupFile(text: string): BackupData {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new BackupParseError('Die Datei enthält kein gültiges JSON.')
  }

  if (!raw || typeof raw !== 'object') {
    throw new BackupParseError('Unbekanntes Dateiformat.')
  }

  const obj = raw as Record<string, unknown>
  const isBabicBackup = (obj.meta as { app?: string } | undefined)?.app === 'babic-work-log'
  const hasKnownShape = Array.isArray(obj.projects) && Array.isArray(obj.entries)
  if (!isBabicBackup && !hasKnownShape) {
    throw new BackupParseError('Diese Datei sieht nicht wie ein Babic Work Log Backup aus.')
  }

  const rawClients = Array.isArray(obj.clients) ? (obj.clients as Partial<Client>[]) : []
  const rawProjects = Array.isArray(obj.projects) ? (obj.projects as Partial<Project>[]) : []
  const rawEntries = Array.isArray(obj.entries) ? (obj.entries as Partial<TimeEntry>[]) : []
  const rawDocuments = Array.isArray(obj.documents) ? (obj.documents as Partial<ProjectDocument>[]) : []

  const withIds = <T extends { id?: string }>(items: T[]) =>
    items.filter((i): i is T & { id: string } => typeof i.id === 'string' && i.id.length > 0)

  const needsClientMigration = rawProjects.some((p) => !p.clientId)
  let clients: Client[]
  let projects: Project[]

  if (needsClientMigration) {
    const migrated = migrateLegacyProjects(withIds(rawProjects) as (Partial<Project> & {
      id: string
      name: string
      defaultRate: number
      createdAt: number
    })[])
    clients = [...withIds(rawClients).map(normalizeClient), ...migrated.clients]
    projects = migrated.projects
  } else {
    clients = withIds(rawClients).map(normalizeClient)
    projects = withIds(rawProjects).map(normalizeProject)
  }

  const entries = withIds(rawEntries).map(normalizeEntry)
  const documents = withIds(rawDocuments).map(normalizeDocument)

  return { clients, projects, entries, documents }
}

/** Merges a backup into the current data set without ever touching an
 * existing record: anything already present locally (by id) is kept as-is,
 * anything only in the backup is added. */
export function mergeBackupData(current: BackupData, incoming: BackupData): BackupData {
  function mergeById<T extends { id: string }>(currentItems: T[], incomingItems: T[]): T[] {
    const existingIds = new Set(currentItems.map((i) => i.id))
    const additions = incomingItems.filter((i) => !existingIds.has(i.id))
    return [...currentItems, ...additions]
  }

  return {
    clients: mergeById(current.clients, incoming.clients),
    projects: mergeById(current.projects, incoming.projects),
    entries: mergeById(current.entries, incoming.entries),
    documents: mergeById(current.documents, incoming.documents),
  }
}
