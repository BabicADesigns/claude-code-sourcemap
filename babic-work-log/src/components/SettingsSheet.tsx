import { APP_VERSION, BUILD_DATE, CHANGELOG } from '@/services/version'
import { formatDateDisplay, toISODate } from '@/services/date'

export function SettingsSheet() {
  const buildDate = new Date(BUILD_DATE)

  return (
    <div className="space-y-5 pb-6">
      <div className="rounded-2xl bg-sage/10 p-4">
        <p className="text-xs text-muted-foreground">Version</p>
        <p className="font-display text-2xl text-sage-dark">{APP_VERSION}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Build: {Number.isNaN(buildDate.getTime()) ? BUILD_DATE : formatDateDisplay(toISODate(buildDate))}
        </p>
      </div>

      <div>
        <h3 className="mb-2 font-display text-lg text-ink">Änderungsprotokoll</h3>
        <ul className="space-y-4">
          {CHANGELOG.map((entry) => (
            <li key={entry.version} className="rounded-2xl bg-card p-4 shadow-soft">
              <div className="mb-2 flex items-baseline justify-between">
                <p className="font-medium text-ink">Version {entry.version}</p>
                <p className="text-xs text-muted-foreground">{entry.date}</p>
              </div>
              <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                {entry.changes.map((change, i) => (
                  <li key={i}>{change}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-0.5 pt-2 text-center text-xs text-muted-foreground">
        <p>Designed by: BabicADesigns</p>
        <p>© {new Date().getFullYear()} BabicADesigns. All rights reserved.</p>
      </div>
    </div>
  )
}
