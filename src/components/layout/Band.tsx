import type { ReactNode } from 'react'
import { Photo } from '@/components/ui/Photo'
import { cn } from '@/lib/cn'

/**
 * Page hero (BIFA-style): full photo behind, intro blur/scale, kicker + two-tone title rising in,
 * and glass stat tiles on the right.
 */
export function Band({ kicker, title, title2, sub, stats, cover, left, actions, tall = false }: {
  kicker: ReactNode; title: string; title2?: string; sub?: ReactNode; stats?: Array<{ v: ReactNode; l: string; accent?: string }>; cover?: string; left?: ReactNode; actions?: ReactNode; tall?: boolean
}) {
  return (
    <div className="wrap">
      <div className={cn('relative mt-[14px] overflow-hidden rounded-band border border-white/10', tall ? 'min-h-[520px] md:min-h-[600px]' : 'min-h-[420px] md:min-h-[520px]')}>
        <Photo src={cover} className="hero-in" position="center 45%" eager />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,11,.25)_0%,rgba(10,10,11,.15)_40%,rgba(10,10,11,.92)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,11,.55)_0%,rgba(10,10,11,0)_60%)]" />
        <div className="relative z-[2] flex min-h-[inherit] flex-col justify-end gap-8 p-6 md:flex-row md:items-end md:justify-between md:p-12">
          <div className="flex items-end gap-6">
            {left && <div className="rise-in" style={{ animationDelay: '.35s' }}>{left}</div>}
            <div>
              <div className="rise-in mb-3 text-[12px] font-bold uppercase tracking-[.18em] text-orange-soft md:text-[13px]" style={{ animationDelay: '.4s' }}>{kicker}</div>
              <h1 className="rise-in disp text-[42px] text-white sm:text-[56px] md:text-[104px]" style={{ animationDelay: '.5s' }}>{title}{title2 && <><br /><span className="text-orange">{title2}</span></>}</h1>
              {sub && <div className="rise-in mt-[14px] max-w-[640px] text-[15px] text-[#d9d8d3] md:text-[16px]" style={{ animationDelay: '.65s' }}>{sub}</div>}
              {actions && <div className="rise-in mt-6 flex flex-wrap gap-3" style={{ animationDelay: '.75s' }}>{actions}</div>}
            </div>
          </div>
          {stats && (
            <div className="rise-in flex flex-wrap gap-3 md:justify-end" style={{ animationDelay: '.7s' }}>
              {stats.map(s => (
                <div key={s.l} className="glass min-w-[104px] rounded-[16px] px-[18px] py-[14px]" style={s.accent ? { borderColor: s.accent } : undefined}>
                  <b className="disp block text-[40px] leading-none" style={s.accent ? { color: s.accent } : undefined}>{s.v}</b>
                  <span className="mt-1 block text-[11px] font-bold uppercase tracking-[.12em] text-dim">{s.l}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
