import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { NewsItem } from '@/data/types'

const FALLBACK = '/img/hero-dark.jpg'

/**
 * Latest news (BIFA layout): one big featured article on the right, the next three as small rows on the left.
 * Rotates automatically every 6s (pauses on hover) and has arrows on either side.
 */
export function NewsCarousel({ items, interval = 6000 }: { items: NewsItem[]; interval?: number }) {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const n = items.length
  useEffect(() => {
    if (paused || n < 2) return
    const id = window.setInterval(() => setI(x => (x + 1) % n), interval)
    return () => window.clearInterval(id)
  }, [paused, n, interval])
  if (!n) return null
  const feat = items[i % n]
  const rest = [1, 2, 3].map(k => items[(i + k) % n]).filter((x, idx, arr) => x !== feat && arr.indexOf(x) === idx)
  const go = (d: number) => setI(x => (x + d + n) % n)
  const arrow = (d: -1 | 1) => (
    <button type="button" aria-label={d < 0 ? 'Previous' : 'Next'} onClick={() => go(d)}
      className="glass pop grid h-12 w-12 shrink-0 place-items-center rounded-full text-[20px] text-white hover:bg-white/15">
      {d < 0 ? '←' : '→'}
    </button>
  )
  return (
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* side arrows (desktop) */}
      <div className="absolute -left-6 top-1/2 z-10 hidden -translate-y-1/2 xl:block">{arrow(-1)}</div>
      <div className="absolute -right-6 top-1/2 z-10 hidden -translate-y-1/2 xl:block">{arrow(1)}</div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        {/* three small on the left */}
        <div className="flex flex-col gap-4 lg:order-1">
          {rest.map(a => (
            <Link key={a.id} to={`/news/${a.slug}`} className="card pop grid flex-1 grid-cols-[132px_1fr] items-stretch overflow-hidden rounded-[18px]">
              <div className="bg-cover bg-center" style={{ backgroundImage: `url(${a.image ?? FALLBACK})` }} />
              <div className="flex flex-col justify-center px-4 py-4">
                <div className="mb-[6px] flex gap-[10px] text-[11px] font-extrabold uppercase tracking-[.1em] text-dim"><b className="text-orange">{a.tag}</b><span>{a.date}</span></div>
                <div className="disp line-clamp-3 text-[24px] leading-[.95] md:text-[26px]">{a.title}</div>
              </div>
            </Link>
          ))}
        </div>
        {/* one big on the right */}
        <Link key={feat.id} to={`/news/${feat.slug}`} className="rise-in card pop relative min-h-[420px] overflow-hidden rounded-[22px] lg:order-2 lg:min-h-[560px]">
          <div className="absolute inset-0 bg-cover bg-[center_30%] transition-transform duration-700 hover:scale-[1.03]" style={{ backgroundImage: `url(${feat.image ?? FALLBACK})` }} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,11,0)_35%,rgba(10,10,11,.85)_100%)]" />
          <div className="glass absolute bottom-4 left-4 right-4 rounded-[18px] p-5 md:p-6">
            <div className="mb-2 flex gap-[10px] text-[11px] font-extrabold uppercase tracking-[.1em] text-dim"><b className="text-orange">{feat.tag}</b><span>{feat.date}</span></div>
            <div className="disp line-clamp-3 text-[34px] leading-[.92] text-white md:text-[44px]">{feat.title}</div>
            <div className="mt-3 line-clamp-2 max-w-[640px] text-[14px] text-cement">{feat.excerpt}</div>
          </div>
        </Link>
      </div>

      {/* arrows below on narrow screens, where the side ones are hidden */}
      <div className="mt-4 flex items-center justify-center gap-3 xl:hidden">{arrow(-1)}{arrow(1)}</div>
    </div>
  )
}
