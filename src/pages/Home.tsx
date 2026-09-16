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
import { GreeceMap } from '@/components/GreeceMap'
import type { Match } from '@/data/types'

export function Home() {
  const { t } = useI18n()
  const { categoryById, matches, sponsors, stops, tournaments, teamById, news, rentals } = useData()
  const next = tournaments.find(x => x.status !== 'done') ?? tournaments[0]
  const lastDone = [...tournaments].reverse().find(x => x.status === 'done')
  if (!next) return null
  const live = matches.filter(m => m.status === 'live')
  const upcoming = matches.filter(m => m.status === 'scheduled').slice(0, 8)
  const results = matches.filter(m => m.status === 'final').slice(-6).reverse()
  const nowCards = [...live, ...upcoming].slice(0, 10)

  return (
    <>
      {/* ---------- HERO: full screen, intro blur+scale, nav/ticker overlaid ---------- */}
      <section className="relative h-[100svh] min-h-[640px] overflow-hidden">
        <img src={next.cover} alt="" className="hero-in absolute inset-0 h-full w-full object-cover object-[center_40%]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,11,.55)_0%,rgba(10,10,11,.15)_35%,rgba(10,10,11,.35)_65%,rgba(10,10,11,.98)_100%)]" />
        <div className="wrap absolute bottom-[56px] left-0 right-0 z-10">
          <img src="/img/logo.png" alt="" className="rise-in mb-6 h-[120px] w-auto drop-shadow-[0_8px_30px_rgba(0,0,0,.6)] md:h-[170px]" style={{ animationDelay: '.35s' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          <div className="rise-in mb-3 text-[13px] font-bold uppercase tracking-[.18em] text-orange-soft" style={{ animationDelay: '.5s' }}>{t.hero.kicker} · {next.name} · {next.dates}</div>
          <h1 className="rise-in disp text-[64px] text-white md:text-[112px] xl:text-[150px]" style={{ animationDelay: '.65s' }}>{t.hero.title1}<br /><span className="text-orange">{t.hero.title2}</span></h1>
          <div className="rise-in mt-6 flex flex-wrap gap-3" style={{ animationDelay: '.85s' }}>
            <Button variant="orange" to="/register">{t.hero.cta1}</Button>
            <Button variant="ghost" className="border-white/30" to={`/tournaments/${next.slug}`}>{t.hero.cta2}</Button>
          </div>
        </div>
      </section>

      {/* ---------- THE COURT AWAITS: big cards that stack as you scroll ---------- */}
      <section className="wrap pt-[110px]">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <div className="lg:sticky lg:top-[96px] lg:self-start">
            <Heading a={t.sections.matchday1} b={t.sections.matchday2} />
            <p className="mt-4 max-w-[380px] text-[15px] text-dim">Ό,τι παίζεται τώρα, ό,τι έρχεται και ό,τι μόλις τελείωσε — σε τρεις κάρτες που ενημερώνονται ζωντανά από τη γραμματεία.</p>
          </div>
          <div className="flex flex-col gap-6">
            <div className="lg:sticky lg:top-[96px]">
              <StackCard tone="orange" label={`● ${t.status.live} · ${live[0] ? `${t.misc.court} ${live[0].court}` : next.venue}`} badge={t.status.optional}
                big={live[0] ? `${live[0].homeScore ?? 0} – ${live[0].awayScore ?? 0}` : '— : —'}
                title={live[0] ? `${teamById(live[0].homeId)?.name} vs ${teamById(live[0].awayId)?.name}` : 'Κανένας αγώνας σε εξέλιξη'}
                meta={live[0] ? `${categoryById(live[0].categoryId).name} · ${live[0].label} · ${next.city}` : `Επόμενος αγώνας ${upcoming[0]?.time ?? ''} · ${next.city}`}
                cta={{ label: 'Δες live →', to: `/tournaments/${next.slug}` }} right={next.venue} />
            </div>
            <div className="lg:sticky lg:top-[120px]">
              <StackCard tone="blue" label={t.status.startsIn}
                big={<Countdown to={next.startsAt} className="mono tracking-[-.02em]" />}
                title={next.name} meta={`${next.days[0]}, 17:00 · ${next.teamsCount} ομάδες · ${next.categoryIds.length} κατηγορίες · ${next.venue}`}
                cta={{ label: 'Πρόγραμμα →', to: `/tournaments/${next.slug}` }} right={`${next.courts} γήπεδα`} />
            </div>
            <div className="lg:sticky lg:top-[144px]">
              <StackCard tone="slate" label={t.status.done}
                big={lastDone?.city ?? 'Παλλήνη'} title="Νικητές ανά κατηγορία"
                meta="18+ GOONLANDERS · 40+ PINK ROSES · U18 ΘΥΜΙΟΛΑΣ · U15 COURT KINGS"
                cta={{ label: 'Αποτελέσματα →', to: '/archive' }} right={lastDone ? `${lastDone.teamsCount} ομάδες` : '66 ομάδες'} />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- NOW ON COURT: carousel ---------- */}
      <section className="pt-[110px]">
        <div className="wrap mb-[30px] flex items-end justify-between gap-4">
          <Heading a={t.sections.now1} b={t.sections.now2} />
          <CarouselArrows target="now-row" />
        </div>
        <div id="now-row" className="snap-row wrap pb-2">
          {nowCards.map(m => <NowCard key={m.id} m={m} city={next.city} venue={next.venue} slug={next.slug} />)}
          {!nowCards.length && <div className="card p-8 text-dim">Το πρόγραμμα ανακοινώνεται σύντομα.</div>}
        </div>
        {results.length > 0 && (
          <div className="wrap mt-10">
            <div className="kicker mb-3">{t.sections.results}</div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {results.map(m => {
                const c = categoryById(m.categoryId); const hw = (m.homeScore ?? 0) > (m.awayScore ?? 0)
                return (
                  <div key={m.id} className="card flex items-center gap-3 px-4 py-3 text-[14px]">
                    <i className="h-[10px] w-[10px] shrink-0 rounded-sm" style={{ background: catColor[c.key] }} />
                    <span className={cn('flex-1 truncate text-right font-semibold', !hw && 'text-dim')}>{teamById(m.homeId)?.name}</span>
                    <b className="mono whitespace-nowrap text-[18px]">{m.homeScore} – {m.awayScore}</b>
                    <span className={cn('flex-1 truncate font-semibold', hw && 'text-dim')}>{teamById(m.awayId)?.name}</span>
                    <span className="hidden text-[11px] font-bold uppercase tracking-[.1em] text-dim lg:block">{c.short} · {m.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* ---------- UPCOMING TOURNAMENTS (collective schedule) + map ---------- */}
      <section className="wrap pt-[110px]">
        <Heading a={t.sections.schedule1} b={t.sections.schedule2} className="mb-[34px]" />
        <div className="grid gap-[22px] lg:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col gap-[10px]">
            {stops.map(s => {
              const tour = tournaments.find(x => x.id === s.id)
              const inner = (
                <>
                  <div className="disp text-[34px]">{s.dateShort.day}<span className="block font-sans text-[14px] font-bold tracking-[.1em] text-dim">{s.dateShort.month}</span></div>
                  <div className="min-w-0">
                    <div className="truncate text-[17px] font-bold">{s.name}</div>
                    <div className="mt-[3px] text-[13px] text-dim">{s.detail}</div>
                    {tour && <div className="mt-2 flex flex-wrap gap-1">{tour.categoryIds.map(cid => { const c = categoryById(cid); return <span key={cid} className="rounded-full border border-line px-2 py-[2px] text-[10px] font-bold uppercase tracking-[.08em]"><i className="mr-1 inline-block h-[6px] w-[6px] rounded-full" style={{ background: catColor[c.key] }} />{c.short}</span> })}</div>}
                  </div>
                  <span className={cn('whitespace-nowrap rounded-lg border border-line px-3 py-2 text-[11px] font-extrabold uppercase tracking-[.12em]', s.status === 'next' && 'border-orange bg-orange text-[#111]', s.status === 'registration' && 'border-blue bg-blue')}>
                    {s.status === 'next' ? 'Πρόγραμμα' : s.status === 'registration' ? 'Δηλώσεις' : 'Σύντομα'}
                  </span>
                </>
              )
              const cls = cn('card pop grid grid-cols-[72px_1fr_auto] items-center gap-[18px] px-[18px] py-4 md:grid-cols-[92px_1fr_auto]', s.status === 'next' && 'border-orange')
              return tour ? <Link key={s.id} to={`/tournaments/${tour.slug}`} className={cls}>{inner}</Link> : <div key={s.id} className={cls}>{inner}</div>
            })}
          </div>
          <Reveal className="card relative min-h-[420px] rounded-band p-[26px] md:min-h-[600px]">
            <div className="kicker absolute left-[26px] top-[26px]">25 πόλεις · 2018–2026</div>
            <GreeceMap className="h-[380px] md:h-[560px]" />
          </Reveal>
        </div>
      </section>

      {/* ---------- LATEST NEWS ---------- */}
      <section className="pt-[110px]">
        <div className="wrap mb-[34px] flex items-end justify-between">
          <Heading a={t.sections.news1} b={t.sections.news2} />
          <Link to="/news" className="text-[14px] font-bold uppercase tracking-[.08em] text-orange">{t.sections.viewNews} →</Link>
        </div>
        <div className="snap-row wrap pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible">
          {news.map(a => (
            <Link to={`/news/${a.slug}`} key={a.id} className="card pop w-[300px] overflow-hidden rounded-[18px] lg:w-auto">
              <div className={cn('h-[190px] bg-cover bg-[center_70%]',
                a.tint === 'orange' && '[filter:sepia(1)_saturate(2.2)_hue-rotate(-10deg)]', a.tint === 'blue' && '[filter:saturate(1.6)] bg-[20%_80%]',
                a.tint === 'mono' && '[filter:grayscale(1)_contrast(1.15)] bg-[80%_60%]', a.tint === 'teal' && '[filter:sepia(1)_saturate(1.4)_hue-rotate(160deg)] bg-[40%_90%]')}
                style={{ backgroundImage: `url(${a.image ?? '/img/hero-dark.jpg'})` }} />
              <div className="px-[18px] pb-5 pt-4">
                <div className="mb-2 flex gap-[10px] text-[11px] font-extrabold uppercase tracking-[.1em] text-dim"><b className="text-orange">{a.tag}</b><span>{a.date}</span></div>
                <div className="disp text-[32px]">{a.title}</div>
                <div className="mt-[10px] text-[13px] text-dim">{a.excerpt}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- SHOP / RENTALS ---------- */}
      <section className="wrap pt-[110px]">
        <div className="mb-[34px] flex items-end justify-between">
          <Heading a={t.sections.shop1} b={t.sections.shop2} />
          <Link to="/rentals" className="text-[14px] font-bold uppercase tracking-[.08em] text-orange">{t.sections.viewShop} →</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {rentals.map(r => (
            <div key={r.id} className="card pop flex flex-col overflow-hidden rounded-[18px]">
              <div className="flex h-[170px] items-center justify-center bg-[linear-gradient(135deg,rgba(16,114,255,.25),rgba(255,135,0,.18))]"><span className="disp text-[64px] text-white/20">GNC</span></div>
              <div className="flex flex-1 flex-col px-[18px] pb-5 pt-4">
                <div className="disp text-[30px]">{r.name}</div>
                <div className="mt-2 flex-1 text-[13px] text-dim">{r.blurb}</div>
                <div className="mt-4 flex items-center justify-between"><span className="text-[13px] font-bold">{r.price}</span><Link to="/contact" className="rounded-[8px] bg-orange px-3 py-2 text-[12px] font-bold text-[#111]">Επικοινωνία</Link></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- PARTNERS ---------- */}
      <section className="pt-[110px]">
        <div className="wrap kicker mb-[22px]">{t.sections.sponsors}</div>
        <Marquee duration={30} className="border-y border-line py-[26px]">
          {sponsors.map(s => <span key={s} className="disp whitespace-nowrap text-[34px] font-bold tracking-[.04em] text-[#6b6f73]">{s}</span>)}
        </Marquee>
      </section>
    </>
  )
}

// ---------- pieces ----------
function StackCard({ tone, label, badge, big, title, meta, cta, right }: { tone: 'orange' | 'blue' | 'slate'; label: string; badge?: string; big: React.ReactNode; title: string; meta: string; cta: { label: string; to: string }; right: string }) {
  const bg = { orange: 'bg-orange text-[#111]', blue: 'bg-blue text-white', slate: 'bg-slate text-white' }[tone]
  return (
    <div className={cn('relative flex min-h-[380px] flex-col justify-between rounded-[24px] p-8 shadow-[0_-12px_40px_rgba(0,0,0,.45)] md:min-h-[440px] md:p-10', bg)}>
      {badge && <span className="absolute right-4 top-4 rounded-[5px] bg-white px-2 py-1 text-[10px] font-extrabold tracking-[.14em] text-[#111]">{badge}</span>}
      <div>
        <div className="text-[12px] font-extrabold uppercase tracking-[.16em] opacity-85">{label}</div>
        <div className="disp my-3 text-[72px] md:text-[104px]">{big}</div>
        <div className="text-[22px] font-bold uppercase tracking-[.02em] md:text-[26px]">{title}</div>
        <div className="mt-2 text-[14px] opacity-85">{meta}</div>
      </div>
      <div className="mt-8 flex items-center justify-between text-[12px] font-bold uppercase tracking-[.1em]"><Link to={cta.to} className="rounded-lg bg-black/20 px-4 py-[10px]">{cta.label}</Link><span>{right}</span></div>
    </div>
  )
}

function NowCard({ m, city, venue, slug }: { m: Match; city: string; venue: string; slug: string }) {
  const { categoryById, teamById } = useData()
  const c = categoryById(m.categoryId)
  const live = m.status === 'live'
  return (
    <Link to={`/tournaments/${slug}`} className={cn('card pop w-[320px] rounded-[18px] p-5', live && 'border-orange/60')}>
      <div className="mb-3 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-[.12em]">
        <span className={live ? 'text-orange' : 'text-dim'}>{live ? '● Live' : `${m.day === 1 ? 'Σάβ' : 'Κυρ'} ${m.time}`}</span>
        <span className="text-dim">Γήπεδο {m.court}</span>
      </div>
      <div className="flex items-center justify-between py-1 text-[16px] font-semibold"><span className="truncate pr-3">{teamById(m.homeId)?.name ?? m.homeLabel}</span><b className="mono text-[22px]">{live ? m.homeScore ?? 0 : ''}</b></div>
      <div className="flex items-center justify-between py-1 text-[16px] font-semibold"><span className="truncate pr-3">{teamById(m.awayId)?.name ?? m.awayLabel}</span><b className="mono text-[22px]">{live ? m.awayScore ?? 0 : ''}</b></div>
      <div className="mt-4 border-t border-line pt-3 text-[12px] text-dim">
        <div className="flex items-center gap-2 font-bold uppercase tracking-[.08em]"><i className="h-2 w-2 rounded-full" style={{ background: catColor[c.key] }} />{c.name} · {m.phase === 'group' ? `Φάση ομίλων · ${m.label}` : m.label}</div>
        <div className="mt-1">{city} · {venue}</div>
      </div>
    </Link>
  )
}

function CarouselArrows({ target }: { target: string }) {
  const go = (dir: -1 | 1) => { const el = document.getElementById(target); if (el) el.scrollBy({ left: dir * 340, behavior: 'smooth' }) }
  return (
    <div className="hidden gap-2 md:flex">
      <button type="button" aria-label="Previous" onClick={() => go(-1)} className="pop flex h-11 w-11 items-center justify-center rounded-full border border-line text-[18px] hover:border-white/40">←</button>
      <button type="button" aria-label="Next" onClick={() => go(1)} className="pop flex h-11 w-11 items-center justify-center rounded-full border border-line text-[18px] hover:border-white/40">→</button>
    </div>
  )
}
