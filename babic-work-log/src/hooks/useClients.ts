import { useCallback, useEffect, useState } from 'react'
import { loadClients, saveClients } from '@/services/storage'
import type { Client, ClientPriority, ClientRelationship, PreferredCommunication } from '@/models'
import { uid } from '@/services/utils'

export interface NewClientInput {
  name: string
  company?: string
  contactPerson?: string
  phone?: string
  email?: string
  website?: string
  address?: string
  country?: string
  vatId?: string
  relationship?: ClientRelationship
  priority?: ClientPriority
  defaultRate?: number
  color?: string
  tags?: string[]
  notes?: string
  internalNotes?: string
  relationshipNotes?: string
  preferredCommunication?: PreferredCommunication
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>(() => loadClients())

  useEffect(() => {
    saveClients(clients)
  }, [clients])

  const addClient = useCallback((input: NewClientInput) => {
    const client: Client = { id: uid(), status: 'active', createdAt: Date.now(), ...input }
    setClients((prev) => [...prev, client])
    return client
  }, [])

  const updateClient = useCallback((id: string, patch: Partial<Omit<Client, 'id'>>) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }, [])

  const archiveClient = useCallback((id: string, archived: boolean) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, archived, status: archived ? 'archived' : 'active' } : c)),
    )
  }, [])

  const deleteClient = useCallback((id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const replaceAll = useCallback((next: Client[]) => {
    setClients(next)
  }, [])

  return { clients, addClient, updateClient, archiveClient, deleteClient, replaceAll }
}
