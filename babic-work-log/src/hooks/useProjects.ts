import { useCallback, useEffect, useState } from 'react'
import { loadProjects, saveProjects } from '@/services/storage'
import type { PricingType, Project, ProjectStatus } from '@/models'
import { PROJECT_COLORS } from '@/models'
import { uid } from '@/services/utils'

export interface NewProjectInput {
  name: string
  clientId: string
  defaultRate: number
  color?: string
  pricingType?: PricingType
  fixedPrice?: number
  status?: ProjectStatus
  notes?: string
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects())

  useEffect(() => {
    saveProjects(projects)
  }, [projects])

  const addProject = useCallback((input: NewProjectInput) => {
    const project: Project = {
      id: uid(),
      name: input.name,
      clientId: input.clientId,
      defaultRate: input.defaultRate,
      color: input.color ?? PROJECT_COLORS[0],
      pricingType: input.pricingType ?? 'hourly',
      fixedPrice: input.fixedPrice,
      status: input.status ?? 'active',
      notes: input.notes,
      createdAt: Date.now(),
    }
    setProjects((prev) => [...prev, project])
    return project
  }, [])

  const updateProject = useCallback((id: string, patch: Partial<Omit<Project, 'id'>>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }, [])

  const archiveProject = useCallback((id: string, archived: boolean) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, archived } : p)))
  }, [])

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const replaceAll = useCallback((next: Project[]) => {
    setProjects(next)
  }, [])

  return { projects, addProject, updateProject, archiveProject, deleteProject, replaceAll }
}
