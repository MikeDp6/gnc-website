import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'

export const FALLBACK_PHOTO = '/img/hero-dark.jpg'

/** Cover photo that swaps to the fallback when the file is missing (no broken-image icons anywhere). */
export function Photo({ src, fallback = FALLBACK_PHOTO, className, position = 'center 40%', alt = '', eager = false }: { src?: string; fallback?: string; className?: string; position?: string; alt?: string; eager?: boolean }) {
  const [cur, setCur] = useState(src || fallback)
  useEffect(() => { setCur(src || fallback) }, [src, fallback])
  return <img src={cur} alt={alt} loading={eager ? 'eager' : 'lazy'} onError={() => { if (cur !== fallback) setCur(fallback) }} className={cn('absolute inset-0 h-full w-full object-cover', className)} style={{ objectPosition: position }} />
}
