import { cn } from '@/lib/utils'

type WatermarkSize = 'lg' | 'md' | 'sm'
type WatermarkPosition = 'center' | 'bottom-right' | 'top-right'

const SIZE_CLASS: Record<WatermarkSize, string> = {
  lg: 'w-[65vmin] h-[65vmin] max-w-[380px] max-h-[380px]',
  md: 'w-36 h-36',
  sm: 'w-20 h-20',
}

const POSITION_CLASS: Record<WatermarkPosition, string> = {
  center: 'inset-0 m-auto',
  'bottom-right': 'right-2 bottom-2 sm:right-4 sm:bottom-4',
  'top-right': 'right-2 top-2 sm:right-4 sm:top-4',
}

const OPACITY: Record<WatermarkSize, number> = {
  lg: 0.05,
  md: 0.06,
  sm: 0.07,
}

/**
 * Decorative BabicADesigns "Čipka-B" brand mark. Purely visual — never carries
 * information, so it stays out of the accessibility tree and never intercepts
 * touches/clicks for the real content painted above it.
 */
export function Watermark({ size = 'lg', position = 'center' }: { size?: WatermarkSize; position?: WatermarkPosition }) {
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute z-0 overflow-hidden', POSITION_CLASS[position])}>
      <div className={cn('watermark-mark', SIZE_CLASS[size])} style={{ opacity: OPACITY[size] }} />
    </div>
  )
}
