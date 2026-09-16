import { cn } from '@/lib/cn'

export type TimelineItem = { year: string; month?: string; title: string; sub: string; result: string; tone?: 'gold' | 'silver' | 'sf' | 'live' | 'plain' }

/** History list (team or player): year · title/sub · result badge. */
export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((it, i) => (
        <div key={i} className="card grid grid-cols-[72px_1fr_auto] items-center gap-[18px] px-5 py-4 md:grid-cols-[110px_1fr_auto]">
          <div className="disp text-[30px]">{it.year}{it.month && <span className="block font-sans text-[12px] font-bold tracking-[.1em] text-dim">{it.month}</span>}</div>
          <div><div className="text-[16px] font-bold">{it.title}</div><div className="mt-[3px] text-[13px] text-dim">{it.sub}</div></div>
          <span className={cn('rounded-lg border border-line px-3 py-2 text-[11px] font-extrabold uppercase tracking-[.12em]',
            it.tone === 'gold' && 'border-orange bg-orange text-[#111]', it.tone === 'silver' && 'border-[#d9d8d3] bg-[#d9d8d3] text-[#111]',
            it.tone === 'sf' && 'border-blue bg-blue/25', it.tone === 'live' && 'border-orange text-orange')}>{it.result}</span>
        </div>
      ))}
    </div>
  )
}
