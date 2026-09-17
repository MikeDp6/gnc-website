import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'

export const FALLBACK_PHOTO = '/img/gnc/hero-gnc-sunset.jpg'

/** The 640px copy the build writes next to every picture in /img — see scripts/make-image-sizes.mjs. */
export function small(src?: string): string | undefined {
  if (!src || !src.startsWith('/img/')) return undefined
  return src.replace(/\.(jpe?g|png)$/i, '@640.$1')
}

/**
 * Cover photo that swaps to the fallback when the file is missing (no broken-image icons anywhere).
 * Pass an empty `position` to steer the crop from the class list instead, e.g. object-[70%_50%]
 * on phones and object-center on wider screens. `sizes` tells the browser how wide the picture will
 * be drawn, so a card downloads the small copy and a hero the full one.
 */
export function Photo({ src, fallback = FALLBACK_PHOTO, className, position = 'center 40%', alt = '', eager = false, sizes }:
  { src?: string; fallback?: string; className?: string; position?: string; alt?: string; eager?: boolean; sizes?: string }) {
  const [cur, setCur] = useState(src || fallback)
  useEffect(() => { setCur(src || fallback) }, [src, fallback])
  const s = sizes ? small(cur) : undefined
  return (
    <img
      src={cur}
      srcSet={s ? `${s} 640w, ${cur} 1600w` : undefined}
      sizes={s ? sizes : undefined}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      onError={() => { if (cur !== fallback) setCur(fallback) }}
      className={cn('absolute inset-0 h-full w-full object-cover', className)}
      style={position ? { objectPosition: position } : undefined}
    />
  )
}
