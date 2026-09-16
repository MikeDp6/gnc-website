import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Infinite horizontal marquee. Children are rendered twice so the loop is seamless. Pauses on hover; disabled under reduced-motion. */
export function Marquee({ children, duration = 40, className, gap = 64 }: { children: ReactNode; duration?: number; className?: string; gap?: number }) {
  return (
    <div className={cn('overflow-hidden', className)}>
      <div className="marquee-track" style={{ ['--marquee-duration' as string]: `${duration}s`, gap }}>
        <div className="flex shrink-0 items-center" style={{ gap }}>{children}</div>
        <div className="flex shrink-0 items-center" style={{ gap }} aria-hidden>{children}</div>
      </div>
    </div>
  )
}
