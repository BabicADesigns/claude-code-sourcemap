import { Badge } from '@/components/ui/badge'
import type { EntryStatus } from '@/lib/types'
import { STATUS_LABELS } from '@/lib/types'

const VARIANT: Record<EntryStatus, 'gold' | 'adriatic' | 'sage'> = {
  offen: 'gold',
  teilweise_bezahlt: 'adriatic',
  bezahlt: 'sage',
}

export function StatusBadge({ status }: { status: EntryStatus }) {
  return <Badge variant={VARIANT[status]}>{STATUS_LABELS[status]}</Badge>
}
