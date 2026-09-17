import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { useData } from '@/data/store'
import { catColor } from '@/lib/categories'
import { cn } from '@/lib/cn'
import { Heading } from '@/components/ui/Heading'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { Countdown } from '@/components/ui/Countdown'
import { Marquee } from '@/components/ui/Marquee'
import { GreeceMapLazy as GreeceMap } from '@/components/GreeceMapLazy'
import { NewsCarousel } from '@/components/NewsCarousel'
import { MediaCarousel } from '@/components/MediaCarousel'
import { Photo } from '@/components/ui/Photo'
import { RentalImage } from '@/components/RentalImage'
import { useMeta } from '@/lib/meta'
import type { Match } from '@/data/types'

export function Home() {
  const { t } = useI18n()
  const { categoryById, matches, stops, tournaments, teamById, news, rentals, cities, archive, stats } = useData()
  const next = tournaments.find(x => x.status !== 'done') ?? tournaments[0]
  const lastDone = [...tournaments].reverse().find(x => x.status === 'done')
  useMeta(undefined, next ? `${t.hero.kicker}: ${next.name} · ${next.dates}. ${t.footer.tagline}` : undefined, next?.cover)
  if (!next) return null
  const live = matches.filter(m => m.status === 'live')
  const upcoming = matches.filter(m => m.status === 'scheduled').slice(0, 8)
  const results = matches.filter(m => m.status === 'final').slice(-6).reverse()
  const nowCards = [...live, ...upcoming].slice(0, 10)

  return (
    <>
      {/* ---------- HERO: full screen, intro blur+scale, nav/ticker overlaid ---------- */}
      <section className="relative h-[100svh] min-h-[640px] overflow-hidden">
        <Photo src={next.cover} className="hero-in object-[72%_50%] sm:object-[64%_45%] lg:object-[center_42%]" position="" eager />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,11,.55)_0%,rgba(10,10,11,.12)_35%,rgba(10,10,11,.30)_70%,rgba(10,10,11,.70)_100%)]" />
        {/* the name of the thing, at BIFA's size; the media strip below overlaps the lower edge */}
        <div className="wrap absolute bottom-[184px] left-0 right-0 z-10 md:bottom-[214px]">
          <h1 className="rise-in disp text-[30px] leading-[.95] text-white sm:text-[38px] md:text-[46px] xl:text-[58px]" style={{ animationDelay: '.5s' }}>
            Greek National Challenge<br /><span className="text-orange">3on3</span>
          </h1>
          <div className="rise-in mt-5 flex flex-wrap gap-3" style={{ animationDelay: '.7s' }}>
            <Button variant="orange" to="/register">{t.hero.cta1}</Button>
            <Button variant="ghost" className="border-white/30" to="/tournaments">{t.hero.cta2}</Button>
          </div>
        </div>
      </section>

      <MediaCarousel />

      {/* ---------- THE COURT AWAITS: big cards that stack as you scroll ---------- */}
      <section className="wrap pt-[110px]">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <div className="lg:sticky lg:top-[96px] lg:self-start">
            <Heading a={t.sections.matchday1} b={t.sections.matchday2} />
            <p className="mt-4 max-w-[380px] text-[15px] text-dim">{t.hero.matchdayBlurb}</p>
          </div>
          <div className="flex flex-col gap-6">
            <div className="lg:sticky lg:top-[96px]">
              <StackCard tone="orange" label={`● ${t.status.live} · ${live[0] ? `${t.misc.court} ${live[0].court}` : next.venue}`} badge={t.status.optional}
                big={live[0] ? `${live[0].homeScore ?? 0} – ${live[0].awayScore ?? 0}` : '— : —'}
                title={live[0] ? `${teamById(live[0].homeId)?.name} vs ${teamById(live[0].awayId)?.name}` : t.status.noLive}
                meta={live[0] ? `${categoryById(live[0].categoryId).name} · ${live[0].label} · ${next.city}` : `${t.status.nextMatch} ${upcoming[0]?.time ?? ''} · ${next.city}`}
                cta={{ label: t.status.seeLive, to: `/tournaments/${next.slug}` }} right={next.venue} />
            </div>
            <div className="lg:sticky lg:top-[120px]">
              <StackCard tone="blue" label={t.status.startsIn}
                big={<Countdown to={next.startsAt} className="mono tracking-[-.02em]" />}
                title={next.name} meta={`${next.days[0]} · ${next.teamsCount} ${t.status.teams} · ${next.categoryIds.length} ${t.status.cats} · ${next.venue}`}
                cta={{ label: t.status.schedule, to: `/tournaments/${next.slug}` }} right={`${next.courts} ${t.status.courts}`} />
            </div>
            <div className="lg:sticky lg:top-[144px]">
              <StackCard tone="slate" label={t.status.done}
                big={archive[0]?.city ?? lastDone?.city ?? t.sections.archive1} title={archive[0] ? t.status.winners : `${t.sections.archive1} ${t.sections.archive2}`}
                meta={archive[0]?.blurb ?? t.footer.tagline}
                cta={{ label: t.status.results, to: '/archive' }} right={lastDone ? `${lastDone.teamsCount} ${t.status.teams}` : `66 ${t.status.teams}`} />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- NOW ON COURT: auto-scrolling cards (pause on hover) ---------- */}
      <section className="bg-bg2 py-[110px]">
        <div className="wrap mb-[30px]">
          <Heading a={t.sections.now1} b={t.sections.now2} />
        </div>
        {nowCards.length
          ? <Marquee duration={Math.max(30, nowCards.length * 7)} gap={14} className="py-1">
              {nowCards.map(m => <NowCard key={m.id} m={m} city={next.city} venue={next.venue} slug={next.slug} />)}
            </Marquee>
          : <div className="wrap"><div className="card p-8 text-dim">{t.hero.soon}</div></div>}
        {results.length > 0 && (
          <div className="wrap mt-10">
            <div className="kicker mb-3">{t.sections.results}</div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {results.map(m => {
                const c = categoryById(m.categoryId); const hw = (m.homeScore ?? 0) > (m.awayScore ?? 0)
                return (
                  <div key={m.id} className="card flex min-w-0 items-center gap-3 px-4 py-3 text-[14px]">
                    <i className="h-[10px] w-[10px] shrink-0 rounded-sm" style={{ background: catColor[c.key] }} />
                    <span className={cn('min-w-0 flex-1 truncate text-right font-semibold', !hw && 'text-dim')}>{teamById(m.homeId)?.name}</span>
                    <b className="mono whitespace-nowrap text-[18px]">{m.homeScore} – {m.awayScore}</b>
                    <span className={cn('min-w-0 flex-1 truncate font-semibold', hw && 'text-dim')}>{teamById(m.awayId)?.name}</span>
                    <span className="hidden text-[11px] font-bold uppercase tracking-[.1em] text-dim lg:block">{c.short} · {m.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* ---------- UPCOMING TOURNAMENTS: full-width map, list sits in the open sea ---------- */}
      <section className="wrap pt-[110px]">
        <Heading a={t.sections.schedule1} b={t.sections.schedule2} className="mb-[34px]" />
        <Reveal className="card relative overflow-hidden rounded-band">
          <div className="kicker absolute left-[26px] top-[26px] z-10">{cities.length} {t.hero.mapKicker}</div>
          <div className="h-[560px] p-3 md:h-[900px] md:p-6 lg:pr-[440px]">
            <GreeceMap className="h-full w-full" nextCityId={next.cityId} />
          </div>
          <div className="flex flex-col gap-[10px] p-4 lg:absolute lg:right-8 lg:top-1/2 lg:w-[400px] lg:-translate-y-1/2 lg:p-0">
            {stops.map(s => {
              const tour = tournaments.find(x => x.id === s.id)
              const inner = (
                <>
                  <div className="disp text-[30px]">{s.dateShort.day}<span className="block font-sans text-[12px] font-bold tracking-[.1em] text-dim">{s.dateShort.month}</span></div>
                  <div className="min-w-0">
                    <div className="truncate text-[16px] font-bold">{s.name}</div>
                    <div className="mt-[2px] truncate text-[12px] text-dim">{s.detail}</div>
                  </div>
                  <span className={cn('whitespace-nowrap rounded-lg border border-line px-3 py-2 text-[10px] font-extrabold uppercase tracking-[.12em]', s.status === 'next' && 'border-orange bg-orange text-[#111]', s.status === 'registration' && 'border-blue bg-blue')}>
                    {s.status === 'next' ? t.hero.stop.next : s.status === 'registration' ? t.hero.stop.reg : t.hero.stop.soon}
                  </span>
                </>
              )
              const cls = cn('pop grid grid-cols-[64px_1fr_auto] items-center gap-4 rounded-[14px] border border-line bg-[rgba(20,20,22,.82)] px-4 py-3 backdrop-blur-md', s.status === 'next' && 'border-orange')
              return tour ? <Link key={s.id} to={`/tournaments/${tour.slug}`} className={cls}>{inner}</Link> : <div key={s.id} className={cls}>{inner}</div>
            })}
          </div>
        </Reveal>
      </section>

      {/* ---------- COUNTERS: everything counted from the database ---------- */}
      <section className="wrap pt-[110px]">
        <Reveal className="glass grid grid-cols-2 gap-6 rounded-band p-8 md:grid-cols-4 md:p-12">
          {[[stats.cities, t.counters.cities], [stats.tournaments, t.counters.tournaments], [stats.teams, t.counters.teams], [stats.sinceYear, t.counters.since]].map(([v, l]) => (
            <div key={String(l)}>
              <b className="disp block text-[56px] leading-none text-orange md:text-[80px]">{v}</b>
              <span className="mt-2 block text-[11px] font-bold uppercase tracking-[.14em] text-dim md:text-[12px]">{l}</span>
            </div>
          ))}
        </Reveal>
      </section>

      {/* ---------- LATEST NEWS ---------- */}
      <section className="bg-bg2 py-[110px]">
        <div className="wrap mb-[34px] flex items-end justify-between">
          <Heading a={t.sections.news1} b={t.sections.news2} />
          <Link to="/news" className="text-[14px] font-bold uppercase tracking-[.08em] text-orange">{t.sections.viewNews} →</Link>
        </div>
        <div className="wrap"><NewsCarousel items={news.slice(0, 8)} /></div>
      </section>

      {/* ---------- SHOP / RENTALS ---------- */}
      <section className="wrap pt-[110px]">
        <div className="mb-[34px] flex items-end justify-between">
          <Heading a={t.sections.shop1} b={t.sections.shop2} />
          <Link to="/rentals" className="text-[14px] font-bold uppercase tracking-[.08em] text-orange">{t.sections.viewShop} →</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {rentals.slice(0, 4).map(r => (
            <div key={r.id} className="card pop flex flex-col overflow-hidden rounded-[18px]">
              <div className="relative h-[170px]">
                <RentalImage src={r.image} />
                <span className="glass absolute left-3 top-3 rounded-full px-3 py-[6px] text-[11px] font-extrabold uppercase tracking-[.1em] text-white">{r.price}</span>
              </div>
              <div className="flex flex-1 flex-col px-[18px] pb-5 pt-4">
                <div className="disp text-[30px]">{r.name}</div>
                <div className="mt-2 flex-1 text-[13px] text-dim">{r.blurb}</div>
                <Link to="/rentals" className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-orange px-4 py-[9px] text-[12px] font-bold text-[#111]">{t.rentals.quote} →</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* partners + newsletter + footer: rendered by <Footer finale /> over a photo (Layout) */}
    </>
  )
}

// ---------- pieces ----------
function StackCard({ tone, label, badge, big, title, meta, cta, right }: { tone: 'orange' | 'blue' | 'slate'; label: string; badge?: string; big: React.ReactNode; title: string; meta: string; cta: { label: string; to: string }; right: string }) {
  const bg = { orange: 'bg-orange text-[#111]', blue: 'bg-blue text-white', slate: 'bg-slate text-white' }[tone]
  return (
    <div className={cn('relative flex min-h-[380px] flex-col justify-between rounded-[24px] p-6 shadow-[0_-12px_40px_rgba(0,0,0,.45)] sm:p-8 md:min-h-[440px] md:p-10', bg)}>
      {badge && <span className="absolute right-4 top-4 rounded-[5px] bg-white px-2 py-1 text-[10px] font-extrabold tracking-[.14em] text-[#111]">{badge}</span>}
      <div>
        <div className="text-[12px] font-extrabold uppercase tracking-[.16em] opacity-85">{label}</div>
        <div className="disp my-3 break-words text-[40px] sm:text-[72px] md:text-[104px]">{big}</div>
        <div className="text-[22px] font-bold uppercase tracking-[.02em] md:text-[26px]">{title}</div>
        <div className="mt-2 text-[14px] opacity-85">{meta}</div>
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        {/* BIFA-style entry button: white pill with a round arrow */}
        <Link to={cta.to} className="pop inline-flex items-center gap-3 rounded-full bg-white py-[6px] pl-5 pr-[6px] text-[13px] font-bold uppercase tracking-[.06em] text-[#111] shadow-[0_6px_20px_rgba(0,0,0,.25)]">
          {cta.label.replace(/\s*→$/, '')}<span className="grid h-8 w-8 place-items-center rounded-full bg-[#111] text-[16px] text-white" aria-hidden>→</span>
        </Link>
        <span className="text-[12px] font-bold uppercase tracking-[.1em]">{right}</span>
      </div>
    </div>
  )
}

function NowCard({ m, city, venue, slug }: { m: Match; city: string; venue: string; slug: string }) {
  const { categoryById, teamById } = useData()
  const c = categoryById(m.categoryId)
  const live = m.status === 'live'
  return (
    <Link to={`/tournaments/${slug}`} className={cn('card pop flex h-[200px] w-[320px] flex-col rounded-[18px] p-5', live && 'border-orange/60')}>
      <div className="mb-3 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-[.12em]">
        <span className={live ? 'text-orange' : 'text-dim'}>{live ? '● Live' : `${m.day === 1 ? 'Σάβ' : 'Κυρ'} ${m.time}`}</span>
        <span className="text-dim">Γήπεδο {m.court}</span>
      </div>
      <div className="flex items-center justify-between py-1 text-[16px] font-semibold"><span className="truncate pr-3">{teamById(m.homeId)?.name ?? m.homeLabel}</span><b className="mono text-[22px]">{live ? m.homeScore ?? 0 : ''}</b></div>
      <div className="flex items-center justify-between py-1 text-[16px] font-semibold"><span className="truncate pr-3">{teamById(m.awayId)?.name ?? m.awayLabel}</span><b className="mono text-[22px]">{live ? m.awayScore ?? 0 : ''}</b></div>
      <div className="mt-auto border-t border-line pt-3 text-[12px] text-dim">
        <div className="flex items-center gap-2 truncate font-bold uppercase tracking-[.08em]"><i className="h-2 w-2 shrink-0 rounded-full" style={{ background: catColor[c.key] }} /><span className="truncate">{c.name} · {m.phase === 'group' ? `Φάση ομίλων · ${m.label}` : m.label}</span></div>
        <div className="mt-1 truncate">{city} · {venue}</div>
      </div>
    </Link>
  )
}
