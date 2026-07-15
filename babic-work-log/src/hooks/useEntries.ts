import { useCallback, useEffect, useState } from 'react'
import { loadEntries, saveEntries } from '@/lib/storage'
import type { EntryStatus, TimeEntry } from '@/lib/types'
import { uid } from '@/lib/utils'

export function useEntries() {
  const [entries, setEntries] = useState<TimeEntry[]>(() => loadEntries())

  useEffect(() => {
    saveEntries(entries)
  }, [entries])

  const upsertEntry = useCallback((entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    setEntries((prev) => {
      if (entry.id) {
        const id = entry.id
        return prev.map((e) => (e.id === id ? { ...e, ...entry, id, updatedAt: Date.now() } : e))
      }
      const newEntry: TimeEntry = {
        ...entry,
        id: uid(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      return [newEntry, ...prev]
    })
  }, [])

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const setStatus = useCallback((id: string, status: EntryStatus) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status, updatedAt: Date.now() } : e)))
  }, [])

  return { entries, upsertEntry, deleteEntry, setStatus }
}
