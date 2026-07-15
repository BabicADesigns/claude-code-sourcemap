import type { ReactNode } from 'react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { cn } from '@/services/utils'

export function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string
  value: string
  sub?: string
  accent?: 'sage' | 'gold' | 'adriatic' | 'rose'
  icon?: ReactNode
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <CardTitle>{label}</CardTitle>
          {icon && (
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full',
                accent === 'sage' && 'bg-sage/15 text-sage-dark',
                accent === 'gold' && 'bg-gold/25 text-gold-dark',
                accent === 'adriatic' && 'bg-adriatic/20 text-adriatic-dark',
                accent === 'rose' && 'bg-rose/20 text-rose-dark',
                !accent && 'bg-cream-dark text-muted-foreground',
              )}
            >
              {icon}
            </span>
          )}
        </div>
        <p className="mt-1 font-display text-2xl text-ink">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  )
}
