import { useCallback, useEffect, useState } from 'react'
import { loadProjects, saveProjects } from '@/lib/storage'
import type { Project } from '@/lib/types'
import { uid } from '@/lib/utils'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects())

  useEffect(() => {
    saveProjects(projects)
  }, [projects])

  const addProject = useCallback((name: string, defaultRate: number) => {
    const project: Project = { id: uid(), name, defaultRate, createdAt: Date.now() }
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
