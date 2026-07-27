/** Temporary diagnostic log for the iOS PDF export issue — mirrors every
 * entry to the console (for Mac Web Inspector) and to an in-memory buffer a
 * <DebugOverlay /> renders directly on screen, so the export path can be
 * traced from the phone alone. Remove once the export is confirmed stable. */

export type DebugLogListener = (entries: string[]) => void

let entries: string[] = []
const listeners = new Set<DebugLogListener>()

function notify(): void {
  listeners.forEach((l) => l(entries))
}

function safeStringify(data: unknown): string {
  try {
    return JSON.stringify(data)
  } catch {
    return String(data)
  }
}

export function logDebug(scope: string, message: string, data?: unknown): void {
  const time = new Date().toLocaleTimeString('de-DE', { hour12: false })
  const dataStr = data !== undefined ? ` ${safeStringify(data)}` : ''
  entries = [...entries, `${time} [${scope}] ${message}${dataStr}`].slice(-200)
  console.log(`[${scope}]`, message, data ?? '')
  notify()
}

export function subscribeDebugLog(listener: DebugLogListener): () => void {
  listeners.add(listener)
  listener(entries)
  return () => listeners.delete(listener)
}

export function clearDebugLog(): void {
  entries = []
  notify()
}

export function getDebugLogText(): string {
  return entries.join('\n')
}
