import { Marquee } from '@/components/ui/Marquee'
import { tickerItems } from '@/data/mock'

export function Ticker() {
  return (
    <div className="border-b border-line py-[9px] text-[12px] font-semibold uppercase tracking-[.06em]">
      <Marquee duration={45} gap={44} className="wrap">
        {tickerItems.map((it, i) => (
          <span key={i} className="whitespace-nowrap">
            <b className={it.tone === 'orange' ? 'text-orange' : 'text-blue'}>{it.tag}:</b>&nbsp;&nbsp;{it.text}
          </span>
        ))}
      </Marquee>
    </div>
  )
}
