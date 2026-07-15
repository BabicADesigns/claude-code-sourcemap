import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/services/utils'

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger

export function SheetContent({
  children,
  title,
  open,
  className,
}: {
  children: React.ReactNode
  title: string
  open: boolean
  className?: string
}) {
  return (
    <AnimatePresence>
      {open && (
        <DialogPrimitive.Portal forceMount>
          <DialogPrimitive.Overlay asChild forceMount>
            <motion.div
              className="fixed inset-0 z-40 bg-ink/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          </DialogPrimitive.Overlay>
          <DialogPrimitive.Content asChild forceMount aria-describedby={undefined}>
            <motion.div
              className={cn(
                'fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-2xl bg-cream shadow-card safe-bottom sm:inset-x-auto sm:left-1/2 sm:bottom-auto sm:top-1/2 sm:max-h-[85vh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl',
                className,
              )}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-cream/95 px-4 py-3 backdrop-blur">
                <DialogPrimitive.Title className="font-display text-lg text-ink">{title}</DialogPrimitive.Title>
                <DialogPrimitive.Close className="rounded-full p-1.5 text-muted-foreground hover:bg-cream-dark">
                  <X className="h-5 w-5" />
                </DialogPrimitive.Close>
              </div>
              <div className="p-4">{children}</div>
            </motion.div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      )}
    </AnimatePresence>
  )
}
