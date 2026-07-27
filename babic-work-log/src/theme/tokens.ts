/**
 * BabicADesigns brand tokens — single source of truth for the palette values
 * used outside Tailwind (jsPDF drawing, the icon/watermark generator scripts,
 * anywhere else that needs a raw hex or RGB triple instead of a class name).
 *
 * Tailwind utility classes remain the primary way components consume these
 * colors (see tailwind.config.js). Tailwind's config is loaded by PostCSS
 * outside the Vite/TS pipeline, so it can't import this module directly —
 * keep the two in sync by hand when a brand color changes.
 */

export const COLORS = {
  sage: '#8B9B7A',
  sageLight: '#A6B398',
  sageDark: '#6F7D61',
  cream: '#F5EEE6',
  creamDark: '#EDE3D6',
  rose: '#C4A096',
  roseLight: '#D6B9B0',
  roseDark: '#A9827A',
  gold: '#F0C878',
  goldLight: '#F5D89A',
  goldDark: '#D9AE55',
  adriatic: '#6A9AB0',
  adriaticLight: '#8AB2C4',
  adriaticDark: '#527D91',
  ink: '#3A352E',
  border: '#E3D8C8',
  mutedForeground: '#8A8072',
} as const

export type ColorToken = keyof typeof COLORS

/** Fixed, CVD-validated categorical set for project color-coding (see the
 * dataviz skill for how this was chosen — six perceptually distinct hues
 * that still read as part of the warm-editorial brand family). */
export const PROJECT_COLOR_PALETTE = [
  '#3E7CD6', // blue
  '#B8862E', // ochre
  '#8B4F8C', // plum
  '#2E9E8A', // teal
  '#C2453C', // terracotta
  '#5C9E3A', // green
] as const

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return [r, g, b]
}

export const FONT_FAMILY = {
  display: '"Fraunces", Georgia, serif',
  sans: '"Inter", system-ui, sans-serif',
} as const
