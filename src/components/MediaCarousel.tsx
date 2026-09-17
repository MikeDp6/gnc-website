import { Link } from 'react-router-dom'
import { Marquee } from '@/components/ui/Marquee'
import { useData } from '@/data/store'
import { useI18n } from '@/i18n'

/**
 * The media library from the old site: the tour's cities, one photo each, running past on their own.
 * It sits half over the hero photo and half below it, the way the BIFA score strip does.
 */
export function MediaCarousel() {
  const { cities } = useData()
  const { t, lang } = useI18n()
  const shots = cities.filter(c => c.image)
  if (!shots.length) return null
  const name = (c: { name: string; nameEn?: string }) => (lang === 'en' && c.nameEn ? c.nameEn : c.name)

  return (
    <section className="relative z-20 -mt-[104px] md:-mt-[128px]">
      <Marquee duration={Math.max(45, shots.length * 5)} gap={14} className="py-1">
        {shots.map(c => (
          <Link key={c.id} to={`/cities/${c.id}`}
            className="pop group relative block h-[208px] w-[320px] shrink-0 overflow-hidden rounded-[18px] border border-white/12 md:h-[240px] md:w-[360px]">
            <img src={c.image} alt={name(c)} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
            {/* most of these photos already carry the city name in the artwork, so the label is a small
                chip in the corner rather than a second big title fighting the first */}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,11,.45)_0%,rgba(10,10,11,0)_45%,rgba(10,10,11,.25)_100%)]" />
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/55 px-3 py-[6px] backdrop-blur-sm">
              <span className="text-[11px] font-extrabold uppercase tracking-[.12em] text-white">{name(c)}</span>
              {c.years?.length ? <span className="text-[11px] font-bold tracking-[.08em] text-orange-soft">{c.years.slice().sort().reverse()[0]}</span> : null}
            </div>
          </Link>
        ))}
      </Marquee>

      <div className="wrap mt-7 flex flex-col items-end text-right">
        <h2 className="disp text-[34px] leading-[.95] text-white sm:text-[44px] md:text-[62px]">
          {t.sections.media1} <span className="text-orange">{t.sections.media2}</span>
        </h2>
        <div className="disp mt-1 text-[30px] leading-none text-blue sm:text-[40px] md:text-[56px]">{t.sections.mediaTag}</div>
        <p className="mt-3 max-w-[640px] text-[14px] text-dim md:text-[15px]">{t.sections.mediaBlurb}</p>
      </div>
    </section>
  )
}
