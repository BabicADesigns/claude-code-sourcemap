/**
 * Future AI / "Anita Memory" integration surface.
 *
 * Nothing in this file runs today — it exists so the memory-shaped fields
 * already present on TimeEntry (see src/models/index.ts) have a documented
 * home and a stable shape to grow into, without committing to an
 * implementation before there's a real AI backend to talk to.
 *
 * Do not implement against this file yet. It is intentionally inert.
 */

// Future: speech-to-text — transcribe a voice note (e.g. dictated while
// stopping the timer) into TimeEntry.transcript.
export type TranscriptionProvider = never

// Future: AI summary generation — condense TimeEntry.notes/.transcript into
// TimeEntry.summary for fast scanning across a week/month of entries.
export type SummaryGenerator = never

// Future: semantic search — index TimeEntry.summary/.transcript/.tags so a
// user (or an agent) can ask "what did I do for Ingo in March" in plain
// language instead of filtering by date/project.
export type SemanticIndex = never

// Future: automatic client/project detection — infer TimeEntry.customerId /
// .projectId / .tags from a free-text description or transcript instead of
// requiring the user to pick them from a dropdown every time.
export type EntityDetector = never

/** Shape a future memory record could take once summary/transcript/tags are
 * actually populated. Not constructed anywhere today. */
export interface MemoryEntry {
  entryId: string
  summary?: string
  transcript?: string
  tags?: string[]
  entities?: string[]
  customerId?: string
  projectId?: string
  createdBy?: string
  updatedAt: number
}
