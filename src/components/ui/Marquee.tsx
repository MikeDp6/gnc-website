import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Infinite horizontal marquee. The children are rendered twice and the track slides by exactly one
 * copy — one row plus one gap — so the seam never shows. (Sliding by a flat 50% is the classic bug:
 * the gap between the two copies is counted in the width but not in the distance, so the strip
 * jumps back by half a gap on every loop.) Pauses on hover; still under reduced-motion.
 */
export function Marquee({ children, duration = 40, className, gap = 64 }: { children: ReactNode; duration?: number; className?: string; gap?: number }) {
  return (
    <div className={cn('overflow-hidden', className)}>
      <div className="marquee-track" style={{ ['--marquee-duration' as string]: `${duration}s`, ['--marquee-gap' as string]: `${gap}px` }}>
        <div className="marquee-row">{children}</div>
        <div className="marquee-row" aria-hidden>{children}</div>
      </div>
    </div>
  )
}
