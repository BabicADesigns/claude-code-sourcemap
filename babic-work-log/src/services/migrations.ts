import { CATEGORIES, PROJECT_COLORS } from '../models'
import type { Client, ClientStatus, PricingType, Project, ProjectDocument, ProjectStatus, TimeEntry } from '../models'
import { uid } from './utils'

/** Bump whenever the stored data shape changes in a way old records don't
 * already satisfy. Used both for the automatic on-load migration and to
 * decide whether an imported backup file needs migrating.
 *
 * 1 — pre-1.1 flat projects (no client/color/pricing).
 * 2 — clients, fixed-price projects, payments, documents.
 * 3 — client company/rate/color, project status/notes, memory-architecture
 *     fields on TimeEntry (all additive/optional).
 * 4 — full client profile (contact info, relationship, status, priority,
 *     tags, split notes, preferred communication). */
export const CURRENT_SCHEMA_VERSION = 4

function colorForIndex(i: number): string {
  return PROJECT_COLORS[i % PROJECT_COLORS.length]
}

/** Pre-1.1 projects had no clientId/color/pricingType. Every distinct legacy
 * project becomes its own same-named client so nothing is renamed, merged,
 * or dropped — this only ever ADDS fields/records, never removes or
 * overwrites an existing one. */
export function migrateLegacyProjects(
  legacy: (Partial<Project> & { id: string; name: string; defaultRate: number; createdAt: number })[],
): { clients: Client[]; projects: Project[] } {
  const clients: Client[] = []
  const projects: Project[] = legacy.map((p, i) => {
    if (p.clientId) return normalizeProject(p)
    const client: Client = { id: uid(), name: p.name, status: 'active', createdAt: p.createdAt ?? Date.now() }
    clients.push(client)
    return normalizeProject({ ...p, clientId: client.id, color: colorForIndex(i), pricingType: 'hourly' })
  })
  return { clients, projects }
}

/** Fills in any field a record might be missing (from an older app version
 * or a hand-edited/foreign backup file) with a sensible default. Never
 * drops a field it doesn't recognize.
 *
 * `status` and the legacy `archived` boolean are reconciled here: a record
 * that only has `archived` gets `status` derived from it, and `archived` is
 * always kept in sync with `status === 'archived'` afterwards so any code
 * still reading the boolean (or a re-exported backup) sees a consistent
 * value either way. */
export function normalizeClient(c: Partial<Client> & { id: string }): Client {
  const status: ClientStatus = c.status ?? (c.archived ? 'archived' : 'active')
  return {
    id: c.id,
    name: c.name ?? 'Unbenannt',
    company: c.company,
    contactPerson: c.contactPerson,
    phone: c.phone,
    email: c.email,
    website: c.website,
    address: c.address,
    country: c.country,
    vatId: c.vatId,
    relationship: c.relationship,
    status,
    priority: c.priority,
    defaultRate: c.defaultRate,
    color: c.color,
    tags: c.tags,
    notes: c.notes,
    internalNotes: c.internalNotes,
    relationshipNotes: c.relationshipNotes,
    preferredCommunication: c.preferredCommunication,
    createdAt: c.createdAt ?? Date.now(),
    archived: status === 'archived',
  }
}

export function normalizeProject(p: Partial<Project> & { id: string }): Project {
  return {
    id: p.id,
    name: p.name ?? 'Unbenannt',
    clientId: p.clientId ?? '',
    color: p.color ?? PROJECT_COLORS[0],
    defaultRate: p.defaultRate ?? 0,
    pricingType: (p.pricingType as PricingType) ?? 'hourly',
    fixedPrice: p.fixedPrice,
    status: (p.status as ProjectStatus) ?? 'active',
    notes: p.notes,
    createdAt: p.createdAt ?? Date.now(),
    archived: p.archived,
  }
}

export function normalizeEntry(e: Partial<TimeEntry> & { id: string }): TimeEntry {
  return {
    id: e.id,
    projectId: e.projectId ?? '',
    date: e.date ?? new Date().toISOString().slice(0, 10),
    category: e.category ?? CATEGORIES[0],
    startTime: e.startTime,
    endTime: e.endTime,
    manualHours: e.manualHours,
    hourlyRate: e.hourlyRate ?? 0,
    notes: e.notes,
    photo: e.photo,
    status: e.status ?? 'offen',
    payments: e.payments,
    source: e.source,
    createdAt: e.createdAt ?? Date.now(),
    updatedAt: e.updatedAt ?? Date.now(),
    // Memory Architecture (Sprint 2) — carried through untouched if present,
    // left undefined otherwise. Nothing writes these yet.
    summary: e.summary,
    transcript: e.transcript,
    tags: e.tags,
    entities: e.entities,
    customerId: e.customerId,
    createdBy: e.createdBy,
  }
}

export function normalizeDocument(d: Partial<ProjectDocument> & { id: string }): ProjectDocument {
  return {
    id: d.id,
    projectId: d.projectId ?? '',
    name: d.name ?? 'Dokument',
    label: d.label ?? 'Sonstiges',
    dataUrl: d.dataUrl ?? '',
    mimeType: d.mimeType ?? 'application/octet-stream',
    addedAt: d.addedAt ?? Date.now(),
  }
}
