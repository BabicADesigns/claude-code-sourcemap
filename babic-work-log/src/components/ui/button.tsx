import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/services/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary: 'bg-sage text-white shadow-soft hover:bg-sage-dark',
        secondary: 'bg-white text-ink border border-border hover:bg-cream-dark',
        ghost: 'bg-transparent text-ink hover:bg-cream-dark',
        destructive: 'bg-white text-rose-dark border border-rose/40 hover:bg-rose/10',
        gold: 'bg-gold text-ink shadow-soft hover:bg-gold-dark',
      },
      size: {
        default: 'h-11 px-4 text-sm',
        lg: 'h-14 px-6 text-base',
        sm: 'h-9 px-3 text-xs',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  },
)
Button.displayName = 'Button'
