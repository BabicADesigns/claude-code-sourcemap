import { useRef, useState, type ChangeEvent } from 'react'
import { Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buildBackup, downloadBackup, parseBackupFile, BackupParseError, type BackupData } from '@/lib/backup'

export function BackupSheet({
  data,
  onExported,
  onImport,
}: {
  data: BackupData
  onExported: () => void
  onImport: (mode: 'merge' | 'replace', parsed: BackupData) => void
}) {
  const [pending, setPending] = useState<BackupData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  function handleExport() {
    downloadBackup(buildBackup(data))
    onExported()
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        setPending(parseBackupFile(reader.result as string))
        setError(null)
      } catch (err) {
        setPending(null)
        setError(err instanceof BackupParseError ? err.message : 'Datei konnte nicht gelesen werden.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleReplace() {
    if (!pending) return
    const confirmed = window.confirm(
      'Wirklich ALLE vorhandenen Daten durch das Backup ersetzen? Das kann nicht rückgängig gemacht werden.',
    )
    if (confirmed) onImport('replace', pending)
  }

  if (pending) {
    return (
      <div className="space-y-4 pb-6">
        <div className="rounded-xl bg-gold/15 p-4 text-sm text-ink">
          <p className="mb-1 font-medium">Backup gefunden</p>
          <p>
            {pending.clients.length} Kunden · {pending.projects.length} Projekte · {pending.entries.length} Einträge ·{' '}
            {pending.documents.length} Dokumente
          </p>
        </div>
        <p className="text-sm text-muted-foreground">Vorhandene Daten behalten oder ersetzen?</p>
        <div>
          <Button className="w-full" onClick={() => onImport('merge', pending)}>
            Zusammenführen
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">
            Empfohlen — bestehende Daten bleiben unverändert, neue Einträge aus dem Backup werden ergänzt.
          </p>
        </div>
        <div>
          <Button variant="destructive" className="w-full" onClick={handleReplace}>
            Ersetzen
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">
            Löscht alle aktuellen Daten und ersetzt sie vollständig durch das Backup.
          </p>
        </div>
        <Button variant="ghost" className="w-full" onClick={() => setPending(null)}>
          Abbrechen
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="rounded-xl bg-sage/10 p-4 text-sm text-sage-dark">
        {data.clients.length} Kunden · {data.projects.length} Projekte · {data.entries.length} Einträge ·{' '}
        {data.documents.length} Dokumente
      </div>

      <Button className="w-full" onClick={handleExport}>
        <Download className="h-4 w-4" />
        Backup erstellen
      </Button>

      <Button variant="secondary" className="w-full" onClick={() => fileInput.current?.click()}>
        <Upload className="h-4 w-4" />
        Backup importieren
      </Button>
      <input ref={fileInput} type="file" accept="application/json" className="hidden" onChange={handleFile} />

      {error && <p className="text-sm text-rose-dark">{error}</p>}

      <p className="text-xs text-muted-foreground">
        Backups enthalten alle Kunden, Projekte, Einträge und Dokumente als JSON-Datei und werden ausschließlich lokal
        auf diesem Gerät erstellt — keine Cloud, kein Server.
      </p>
    </div>
  )
}
