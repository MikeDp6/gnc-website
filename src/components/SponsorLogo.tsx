import { useState } from 'react'
import { cn } from '@/lib/cn'
import type { Sponsor } from '@/data/types'

// Every sponsor is drawn the same size. Ranking them by tier on the page put the smaller ones in a
// corner, which is not what any of them paid for — the order in the admin is the only distinction.
const H = 'h-[72px] md:h-[84px]'
const TXT = 'text-[26px] md:text-[30px]'

/**
 * A sponsor mark. The logos are drawn in dark ink for a white page, so they sit on a light panel —
 * the way a printed sponsor board does — instead of disappearing into the dark background.
 */
export function SponsorLogo({ s, className }: { s: Sponsor; className?: string }) {
  const [broken, setBroken] = useState(false)
  const inner = s.logo && !broken
    ? <span className={cn('flex items-center justify-center rounded-[14px] bg-white px-4 py-[10px]', H)}>
        <img src={s.logo} alt={s.name} decoding="async" onError={() => setBroken(true)} className="h-full w-auto max-w-[min(280px,52vw)] object-contain" />
      </span>
    : <span className={cn('disp whitespace-nowrap font-bold tracking-[.04em] text-[#9a9fa3] transition-colors group-hover:text-white', TXT)}>{s.name}</span>
  const cls = cn('pop group flex shrink-0 items-center', className)
  return s.url
    ? <a href={s.url} target="_blank" rel="noreferrer" title={s.name} className={cls}>{inner}</a>
    : <span title={s.name} className={cls}>{inner}</span>
}
