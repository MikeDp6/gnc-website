import { Link } from 'react-router-dom'
import { useData } from '@/data/store'
import { useI18n } from '@/i18n'
import { useMeta } from '@/lib/meta'
import { Band } from '@/components/layout/Band'
import { Crumb } from '@/components/ui/Crumb'
import { Heading } from '@/components/ui/Heading'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/cn'
import { SponsorLogo } from '@/components/SponsorLogo'
import type { Sponsor, SponsorTier } from '@/data/types'

const TIERS: SponsorTier[] = ['main', 'official', 'partner', 'media']
const SIZE: Record<SponsorTier, { logo: string; text: string; cols: string }> = {
  main: { logo: 'h-[96px] md:h-[120px]', text: 'text-[44px] md:text-[64px]', cols: 'grid-cols-1' },
  official: { logo: 'h-[64px] md:h-[76px]', text: 'text-[32px] md:text-[40px]', cols: 'grid-cols-2 md:grid-cols-3' },
  partner: { logo: 'h-[44px] md:h-[52px]', text: 'text-[24px] md:text-[28px]', cols: 'grid-cols-2 md:grid-cols-4' },
  media: { logo: 'h-[40px]', text: 'text-[22px]', cols: 'grid-cols-2 md:grid-cols-4' },
}

/** Sponsors page: the three tiers of the approved structure, plus the media kit numbers a sponsor asks for. */
export function Sponsors() {
  const { t } = useI18n()
  const { sponsorList, stats, season, tournaments } = useData()
  useMeta(t.sponsors.title1 + ' ' + t.sponsors.title2, t.sponsors.blurb, tournaments[0]?.cover)
  const byTier = (tier: SponsorTier) => sponsorList.filter(s => (s.tier ?? 'partner') === tier)
  const card = (s: Sponsor, tier: SponsorTier) => (
    <div key={s.name} className={cn('card flex flex-col items-center justify-center gap-3 p-6 text-center', tier === 'main' && 'md:p-10')}>
      <SponsorLogo s={{ ...s, tier }} />
      {s.blurb && <span className="text-[12px] text-dim">{s.blurb}</span>}
    </div>
  )

  const reach = [
    { v: stats.cities, l: t.counters.cities },
    { v: season.length, l: t.counters.tournaments },
    { v: stats.teams, l: t.counters.teams },
    { v: `${new Date().getFullYear() - stats.sinceYear}+`, l: t.sponsors.years },
  ]
  return (
    <>
      <Crumb items={[{ label: t.sponsors.title1 }]} />
      <Band kicker={t.sections.sponsors} title={t.sponsors.title1} title2={t.sponsors.title2} cover={tournaments[0]?.cover} sub={t.sponsors.blurb}
        actions={<Button variant="orange" to="/contact">{t.sponsors.cta} →</Button>} stats={reach.slice(0, 3).map(r => ({ v: r.v, l: r.l }))} />

      {TIERS.map(tier => {
        const list = byTier(tier)
        if (!list.length) return null
        return (
          <section key={tier} className="wrap pt-[60px]">
            <div className="kicker mb-4">{t.sponsors.tier[tier]}</div>
            <div className={cn('grid gap-4', SIZE[tier].cols)}>{list.map(s => card(s, tier))}</div>
          </section>
        )
      })}

      <section className="wrap pt-[90px]">
        <Heading a={t.sponsors.kit1} b={t.sponsors.kit2} size="md" className="mb-4" />
        <p className="max-w-[720px] text-[15px] text-dim">{t.sponsors.kitBlurb}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Reveal className="card p-6">
            <div className="kicker mb-4">{t.sponsors.reach}</div>
            <div className="grid grid-cols-2 gap-5">
              {reach.map(r => <div key={r.l}><b className="disp block text-[44px] leading-none text-orange">{r.v}</b><span className="mt-1 block text-[11px] font-bold uppercase tracking-[.12em] text-dim">{r.l}</span></div>)}
            </div>
            <p className="mt-5 text-[12px] text-mute">{t.sponsors.reachNote}</p>
          </Reveal>
          <Reveal className="card p-6" delay={80}>
            <div className="kicker mb-4">{t.sponsors.what}</div>
            <div className="space-y-3 text-[14px] text-dim">
              {t.sponsors.items.map(i => <div key={i} className="flex gap-3 border-t border-line pt-3 first:border-0 first:pt-0"><span className="text-orange">→</span>{i}</div>)}
            </div>
          </Reveal>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="orange" to="/contact">{t.sponsors.cta} →</Button>
          <Button variant="ghost" onClick={() => window.print()}>↓ {t.sponsors.print}</Button>
          <Link to="/archive" className="self-center text-[13px] font-bold uppercase tracking-[.08em] text-orange">{t.sponsors.seeTour} →</Link>
        </div>
      </section>
    </>
  )
}
