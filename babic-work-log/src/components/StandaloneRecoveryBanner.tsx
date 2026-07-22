import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { isStandalone } from '@/services/platform'

/** Nudge shown only in the installed Home Screen app when it has no logged
 * entries yet. iOS doesn't always share localStorage between a Home Screen
 * app and regular Safari for the same site, so an app that looks "reset"
 * after installing is usually looking at a separate, empty storage bucket
 * rather than having actually lost anything — the fix is importing a
 * Backup exported from Safari, not re-entering data. Real first-time users
 * with nothing to restore can just dismiss this. */
export function StandaloneRecoveryBanner({ hasNoEntries, onOpenBackup }: { hasNoEntries: boolean; onOpenBackup: () => void }) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || !hasNoEntries || !isStandalone()) return null

  return (
    <div className="relative rounded-2xl border border-gold/40 bg-gold/10 p-4 pr-10 text-sm text-ink">
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-cream-dark"
        aria-label="Hinweis schließen"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
        <div>
          <p className="font-medium">Keine Einträge sichtbar</p>
          <p className="mt-1 text-muted-foreground">
            Diese installierte App-Version zeigt noch keine Arbeitseinträge. Falls du bereits Daten in Safari
            eingegeben hast: iOS teilt den Speicher zwischen Safari und der installierten App nicht immer — deine
            Daten sind dort wahrscheinlich noch vorhanden, nur nicht hier sichtbar. Öffne die App in Safari, erstelle
            dort unter „Backup" ein Backup und importiere es anschließend hier.
          </p>
          <button
            onClick={onOpenBackup}
            className="mt-2 rounded-xl bg-gold-dark px-3 py-1.5 text-xs font-medium text-white"
          >
            Backup hier importieren
          </button>
        </div>
      </div>
    </div>
  )
}
