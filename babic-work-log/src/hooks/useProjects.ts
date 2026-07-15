import { useCallback, useEffect, useState } from 'react'
import { loadProjects, saveProjects } from '@/lib/storage'
import type { PricingType, Project } from '@/lib/types'
import { PROJECT_COLORS } from '@/lib/types'
import { uid } from '@/lib/utils'

export interface NewProjectInput {
  name: string
  clientId: string
  defaultRate: number
  color?: string
  pricingType?: PricingType
  fixedPrice?: number
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

  return { projects, addProject, updateProject, archiveProject, deleteProject }
}
