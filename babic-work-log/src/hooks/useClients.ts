import { useCallback, useEffect, useState } from 'react'
import { loadClients, saveClients } from '@/services/storage'
import type { Client } from '@/models'
import { uid } from '@/services/utils'

export interface NewClientInput {
  name: string
  company?: string
  phone?: string
  email?: string
  defaultRate?: number
  color?: string
  notes?: string
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>(() => loadClients())

  useEffect(() => {
    saveClients(clients)
  }, [clients])

  const addClient = useCallback((input: NewClientInput) => {
    const client: Client = { id: uid(), createdAt: Date.now(), ...input }
    setClients((prev) => [...prev, client])
    return client
  }, [])

  const updateClient = useCallback((id: string, patch: Partial<Omit<Client, 'id'>>) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }, [])

  const archiveClient = useCallback((id: string, archived: boolean) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, archived } : c)))
  }, [])

  const deleteClient = useCallback((id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const replaceAll = useCallback((next: Client[]) => {
    setClients(next)
  }, [])

  return { clients, addClient, updateClient, archiveClient, deleteClient, replaceAll }
}
