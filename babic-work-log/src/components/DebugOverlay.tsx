import { useEffect, useState } from 'react'
import { Copy, Trash2 } from 'lucide-react'
import { clearDebugLog, getDebugLogText, subscribeDebugLog } from '@/services/debugLog'

/** Temporary on-screen diagnostic panel for the iOS PDF export issue — shows
 * every step directly on the phone, no Mac/Web Inspector needed. Appears
 * only once something has logged; stays out of the way otherwise. Remove
 * once the export is confirmed reliably working. */
export function DebugOverlay() {
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => subscribeDebugLog(setLogs), [])

  if (logs.length === 0) return null

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(getDebugLogText())
    } catch {
      // Clipboard API may be unavailable — the text is still visible/selectable below.
    }
  }

  return (
    <div className="fixed inset-x-2 bottom-2 z-[100] max-h-64 overflow-hidden rounded-xl border border-border bg-ink/95 shadow-card">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="text-xs font-medium text-cream">Debug-Log ({logs.length})</span>
        <div className="flex items-center gap-1">
          <button onClick={handleCopy} className="rounded p-1 text-cream hover:bg-white/10" aria-label="Log kopieren">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button onClick={clearDebugLog} className="rounded p-1 text-cream hover:bg-white/10" aria-label="Log leeren">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="max-h-52 overflow-y-auto px-3 py-2 font-mono text-[10px] leading-tight text-cream/90">
        {logs.map((l, i) => (
          <div key={i} className="whitespace-pre-wrap break-all">
            {l}
          </div>
        ))}
      </div>
    </div>
  )
}
