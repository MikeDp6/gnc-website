import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'

export const FALLBACK_PHOTO = '/img/gnc/hero-gnc-sunset.jpg'

/**
 * Cover photo that swaps to the fallback when the file is missing (no broken-image icons anywhere).
 * Pass an empty `position` to steer the crop from the class list instead, e.g. object-[70%_50%]
 * on phones and object-center on wider screens.
 */
export function Photo({ src, fallback = FALLBACK_PHOTO, className, position = 'center 40%', alt = '', eager = false }: { src?: string; fallback?: string; className?: string; position?: string; alt?: string; eager?: boolean }) {
  const [cur, setCur] = useState(src || fallback)
  useEffect(() => { setCur(src || fallback) }, [src, fallback])
  return <img src={cur} alt={alt} loading={eager ? 'eager' : 'lazy'} onError={() => { if (cur !== fallback) setCur(fallback) }} className={cn('absolute inset-0 h-full w-full object-cover', className)} style={position ? { objectPosition: position } : undefined} />
}
