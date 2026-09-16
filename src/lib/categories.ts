import type { CategoryKey } from '@/data/types'

/** Tailwind colour token per category family — used for dots, chips and row accents. */
export const catColor: Record<CategoryKey, string> = {
  u11: 'var(--color-cat-u11)',
  u13: 'var(--color-cat-u13)',
  u15: 'var(--color-cat-u15)',
  u18: 'var(--color-cat-u18)',
  o18: 'var(--color-cat-o18)',
  o35: 'var(--color-cat-o35)',
}
