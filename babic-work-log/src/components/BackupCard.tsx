import { ChevronRight, ShieldCheck, ShieldAlert } from 'lucide-react'
import { cn } from '@/services/utils'

export function BackupCard({ lastBackupAt, onOpen }: { lastBackupAt: number | null; onOpen: () => void }) {
  const days = lastBackupAt !== null ? Math.floor((Date.now() - lastBackupAt) / 86_400_000) : null
  const stale = days === null || days > 14

  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center justify-between gap-3 rounded-2xl bg-card p-4 text-left shadow-soft"
    >
      <div className="flex items-center gap-3">
        {stale ? (
          <ShieldAlert className="h-5 w-5 shrink-0 text-rose-dark" />
        ) : (
          <ShieldCheck className="h-5 w-5 shrink-0 text-sage-dark" />
        )}
        <div>
          <p className={cn('font-medium', stale ? 'text-rose-dark' : 'text-ink')}>
            {days === null ? 'Noch nie gesichert' : `Letztes Backup: vor ${days} ${days === 1 ? 'Tag' : 'Tagen'}`}
          </p>
          {stale && <p className="text-xs text-rose-dark">⚠️ Backup empfohlen</p>}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  )
}
