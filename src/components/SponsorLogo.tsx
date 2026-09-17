import { useState } from 'react'
import { cn } from '@/lib/cn'
import type { Sponsor, SponsorTier } from '@/data/types'

const H: Record<SponsorTier, string> = { main: 'h-[104px] md:h-[124px]', official: 'h-[78px] md:h-[88px]', partner: 'h-[62px]', media: 'h-[56px]' }
const TXT: Record<SponsorTier, string> = { main: 'text-[38px] md:text-[48px]', official: 'text-[30px]', partner: 'text-[24px]', media: 'text-[22px]' }

/**
 * A sponsor mark. The logos are drawn in dark ink for a white page, so they sit on a light panel —
 * the way a printed sponsor board does — instead of disappearing into the dark background.
 */
export function SponsorLogo({ s, className }: { s: Sponsor; className?: string }) {
  const [broken, setBroken] = useState(false)
  const tier: SponsorTier = s.tier ?? 'partner'
  const inner = s.logo && !broken
    ? <span className={cn('flex items-center justify-center rounded-[14px] bg-white px-4 py-[10px]', H[tier])}>
        <img src={s.logo} alt={s.name} loading="lazy" onError={() => setBroken(true)} className="h-full w-auto max-w-[280px] object-contain" />
      </span>
    : <span className={cn('disp whitespace-nowrap font-bold tracking-[.04em] text-[#9a9fa3] transition-colors group-hover:text-white', TXT[tier])}>{s.name}</span>
  const cls = cn('pop group flex shrink-0 items-center', className)
  return s.url
    ? <a href={s.url} target="_blank" rel="noreferrer" title={s.name} className={cls}>{inner}</a>
    : <span title={s.name} className={cls}>{inner}</span>
}
