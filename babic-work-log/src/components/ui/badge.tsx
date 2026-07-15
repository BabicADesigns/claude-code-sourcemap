import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/services/utils'

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', {
  variants: {
    variant: {
      neutral: 'bg-cream-dark text-ink',
      gold: 'bg-gold/25 text-gold-dark',
      adriatic: 'bg-adriatic/20 text-adriatic-dark',
      sage: 'bg-sage/20 text-sage-dark',
      rose: 'bg-rose/20 text-rose-dark',
    },
  },
  defaultVariants: {
    variant: 'neutral',
  },
})

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
