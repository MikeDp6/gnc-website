import type { ReactNode } from 'react'

/** Page header band: cover image, kicker, two-tone title, subtitle, and stat tiles on the right. */
export function Band({ kicker, title, title2, sub, stats, cover = '/img/hero-dark.jpg', left }: {
  kicker: ReactNode; title: string; title2?: string; sub?: ReactNode; stats?: Array<{ v: ReactNode; l: string; accent?: string }>; cover?: string; left?: ReactNode
}) {
  return (
    <div className="wrap">
      <div className="card relative mt-[14px] overflow-hidden rounded-band">
        <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_60%] opacity-55" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,11,.97)_0%,rgba(10,10,11,.85)_50%,rgba(10,10,11,.35)_100%)]" />
        <div className="relative z-[2] flex flex-col justify-between gap-8 p-6 md:flex-row md:items-end md:p-12">
          <div className="flex items-center gap-7">
            {left}
            <div>
              <div className="mb-3 text-[13px] font-bold uppercase tracking-[.18em] text-orange-soft">{kicker}</div>
              <h1 className="disp text-[56px] text-white md:text-[104px]">{title}{title2 && <><br /><span className="text-orange">{title2}</span></>}</h1>
              {sub && <div className="mt-[14px] max-w-[640px] text-[16px] text-[#d9d8d3]">{sub}</div>}
            </div>
          </div>
          {stats && (
            <div className="flex flex-wrap gap-3">
              {stats.map(s => (
                <div key={s.l} className="min-w-[110px] rounded-[14px] border border-line bg-white/5 px-[18px] py-[14px]" style={s.accent ? { borderColor: s.accent } : undefined}>
                  <b className="disp block text-[40px]" style={s.accent ? { color: s.accent } : undefined}>{s.v}</b>
                  <span className="text-[11px] font-bold uppercase tracking-[.12em] text-dim">{s.l}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
