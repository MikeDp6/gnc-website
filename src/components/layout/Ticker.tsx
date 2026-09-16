import { Marquee } from '@/components/ui/Marquee'
import { useData } from '@/data/store'
import { useI18n } from '@/i18n'

export function Ticker({ overlay = false }: { overlay?: boolean }) {
  const { ticker } = useData()
  const { lang } = useI18n()
  const tickerItems = ticker.map(it => ({ ...it, text: lang === 'en' && it.textEn ? it.textEn : it.text }))
  if (!tickerItems.length) return null
  return (
    <div className={(overlay ? 'absolute left-0 right-0 top-0 z-20 border-b border-white/10 bg-black/30 backdrop-blur-sm ' : 'border-b border-line ') + 'py-[9px] text-[12px] font-semibold uppercase tracking-[.06em]'}>
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
