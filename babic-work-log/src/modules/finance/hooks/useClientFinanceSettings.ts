import { useCallback, useEffect, useState } from 'react'
import { loadClientFinanceSettings, saveClientFinanceSettings } from '../services/storage'
import type { ClientFinanceSettings } from '../models'

export function useClientFinanceSettings() {
  const [settings, setSettings] = useState<ClientFinanceSettings[]>(() => loadClientFinanceSettings())

  useEffect(() => {
    saveClientFinanceSettings(settings)
  }, [settings])

  const getForClient = useCallback(
    (clientId: string) => settings.find((s) => s.clientId === clientId) ?? null,
    [settings],
  )

  const upsertForClient = useCallback(
    (clientId: string, patch: Partial<Omit<ClientFinanceSettings, 'clientId' | 'createdAt' | 'updatedAt'>>) => {
      setSettings((prev) => {
        const now = Date.now()
        const existing = prev.find((s) => s.clientId === clientId)
        if (existing) {
          return prev.map((s) => (s.clientId === clientId ? { ...s, ...patch, updatedAt: now } : s))
        }
        return [...prev, { clientId, createdAt: now, updatedAt: now, ...patch }]
      })
    },
    [],
  )

  const replaceAll = useCallback((next: ClientFinanceSettings[]) => {
    setSettings(next)
  }, [])

  return { settings, getForClient, upsertForClient, replaceAll }
}
