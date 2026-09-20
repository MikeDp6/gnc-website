import { Link } from 'react-router-dom'
import { Photo } from '@/components/ui/Photo'
import { Reveal } from '@/components/ui/Reveal'
import { Countdown } from '@/components/ui/Countdown'
import { cn } from '@/lib/cn'

export type TourCardData = {
  key: string
  name: string
  city: string
  dates: string
  venue?: string
  cover?: string
  poster?: string
  startsAt?: string
  countdown?: boolean
  badge?: { label: string; cls: string; live?: boolean }
  cta: string
  to?: string
}

/**
 * One stop of the tour, rendered the way the tournament page renders its own hero:
 * the photo behind, the name big, glass stat tiles on the right, one call to action.
 * The programme list and the teams list share it — only the call to action differs.
 */
export function TourCard({ d, delay = 0 }: { d: TourCardData; delay?: number }) {
  const inner = (
    <>
      {/* the venue photo, pushed right back: it is a dark backdrop, nothing more */}
      <Photo src={d.cover} alt="" position="center 45%" sizes="(min-width:1024px) 1120px, 100vw"
        className="scale-[1.06] brightness-[.38] blur-[2px]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,11,.55)_0%,rgba(10,10,11,.45)_45%,rgba(10,10,11,.9)_100%)]" />

      <div className="relative z-[2] grid min-h-[inherit] items-center gap-7 p-6 md:grid-cols-[1fr_auto_1fr] md:gap-8 md:p-8">
        <div className="min-w-0">
          {d.badge && (
            <span className={cn('mb-3 inline-flex items-center rounded-full border px-3 py-[5px] text-[10px] font-extrabold uppercase tracking-[.12em]', d.badge.cls)}>
              {d.badge.live && <i className="live-dot mr-[6px] inline-block h-[6px] w-[6px] rounded-full bg-[#111] align-middle" />}
              {d.badge.label}
            </span>
          )}
          <div className="text-[11px] font-bold uppercase tracking-[.18em] text-orange-soft md:text-[12px]">
            {[d.city, d.dates].filter(Boolean).join(' · ')}
          </div>
          <h3 className="disp mt-2 text-[32px] leading-[.95] text-white sm:text-[40px] md:text-[46px]">{d.name}</h3>
          {d.venue && <div className="mt-[10px] text-[14px] text-[#d9d8d3]">{d.venue}</div>}
          {d.countdown && d.startsAt && <div className="mono mt-2 text-[13px] text-blue"><Countdown to={d.startsAt} /></div>}
          <span className={cn('mt-5 inline-flex items-center gap-3 rounded-full py-[6px] pl-5 pr-[6px] text-[12px] font-bold uppercase tracking-[.06em]',
            d.to ? 'bg-white text-[#111]' : 'border border-line pr-5 text-mute')}>
            {d.cta}
            {d.to && <span className="grid h-8 w-8 place-items-center rounded-full bg-[#111] text-[16px] text-white" aria-hidden>&rarr;</span>}
          </span>
        </div>

        {/* the poster, whole and centred — never cropped */}
        {d.poster && (
          <div className="flex justify-center">
            <img src={d.poster} alt={`Αφίσα · ${d.name}`} loading="lazy" decoding="async"
              className="max-h-[260px] w-auto rounded-[14px] border border-white/15 object-contain shadow-[0_24px_60px_rgba(0,0,0,.55)] sm:max-h-[320px] md:max-h-[360px]" />
          </div>
        )}

      </div>
    </>
  )

  const base = 'relative block min-h-[380px] overflow-hidden rounded-band border border-white/10 md:min-h-[440px]'
  return (
    <Reveal delay={delay}>
      {d.to
        ? <Link to={d.to} className={cn(base, 'pop group')}>{inner}</Link>
        : <div className={cn(base, 'opacity-75')} aria-disabled>{inner}</div>}
    </Reveal>
  )
}
