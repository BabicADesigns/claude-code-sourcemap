import { useCallback, useEffect, useState } from 'react'
import { loadDocuments, saveDocuments } from '@/lib/storage'
import type { ProjectDocument } from '@/lib/types'
import { uid } from '@/lib/utils'

export interface NewDocumentInput {
  projectId: string
  name: string
  label: string
  dataUrl: string
  mimeType: string
}

export function useDocuments() {
  const [documents, setDocuments] = useState<ProjectDocument[]>(() => loadDocuments())

  useEffect(() => {
    saveDocuments(documents)
  }, [documents])

  const addDocument = useCallback((input: NewDocumentInput) => {
    const doc: ProjectDocument = { id: uid(), addedAt: Date.now(), ...input }
    setDocuments((prev) => [doc, ...prev])
    return doc
  }, [])

  const deleteDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const documentsForProject = useCallback(
    (projectId: string) => documents.filter((d) => d.projectId === projectId),
    [documents],
  )

  const replaceAll = useCallback((next: ProjectDocument[]) => {
    setDocuments(next)
  }, [])

  return { documents, addDocument, deleteDocument, documentsForProject, replaceAll }
}
