import { useState } from 'react'
import { cn } from '@/lib/cn'

/**
 * Equipment images come in two shapes: photographs of a court or an event, and product cutouts on white.
 * Cropping a cutout looks broken, so a PNG is shown whole on a light panel while a photo fills the card.
 */
export function RentalImage({ src, className }: { src?: string; className?: string }) {
  const [broken, setBroken] = useState(false)
  const cutout = !!src && /\.png($|\?)/i.test(src)
  if (!src || broken) return (
    <div className={cn('flex h-full items-center justify-center bg-[linear-gradient(135deg,rgba(16,114,255,.25),rgba(255,135,0,.18))]', className)}>
      <span className="disp text-[64px] text-white/20">GNC</span>
    </div>
  )
  return (
    <div className={cn('h-full w-full', cutout && 'bg-white/90 p-3', className)}>
      <img src={src} alt="" loading="lazy" onError={() => setBroken(true)}
        className={cn('h-full w-full', cutout ? 'object-contain' : 'object-cover')} />
    </div>
  )
}
