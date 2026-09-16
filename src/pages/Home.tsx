import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { useData } from '@/data/store'
import { catColor } from '@/lib/categories'
import { cn } from '@/lib/cn'
import { Heading } from '@/components/ui/Heading'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Reveal } from '@/components/ui/Reveal'
import { Countdown } from '@/components/ui/Countdown'
import { Marquee } from '@/components/ui/Marquee'
import { MatchCard } from '@/components/match/MatchCard'
import { StandingsTable } from '@/components/standings/StandingsTable'
import { BracketGrid } from '@/components/bracket/BracketGrid'
import { GreeceMap } from '@/components/GreeceMap'

export function Home() {
  const { t } = useI18n()
  const { archive, categories, categoryById, groups, matches, sponsors, stops, tournaments, teamById } = useData()
  const next = tournaments.find(x => x.status !== 'done') ?? tournaments[0]
  const [cat, setCat] = useState('o35_men')
  const live = matches.find(m => m.status === 'live')
  const upcoming = matches.filter(m => m.status === 'scheduled').slice(0, 4)
  const lastDone = [...tournaments].reverse().find(x => x.status === 'done')
  if (!next) return null
  const catGroups = groups.filter(g => g.categoryId === cat)
  const koCat = matches.find(m => m.phase !== 'group')?.categoryId
  const ko = matches.filter(m => m.categoryId === koCat && m.phase !== 'group')

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="wrap">
        <Reveal className="relative h-[520px] overflow-hidden rounded-band md:h-[720px]">
          <img src={next.cover} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_55%]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,11,.15)_0%,rgba(10,10,11,.25)_45%,rgba(10,10,11,.96)_100%)]" />
          <div className="absolute bottom-6 left-5 right-5 z-[2] lg:bottom-[190px] lg:left-12 lg:right-auto">
            <div className="mb-3 text-[13px] font-bold uppercase tracking-[.18em] text-orange-soft">{t.hero.kicker} · {next.name} · {next.dates}</div>
            <h1 className="disp text-[56px] text-white md:text-[96px] xl:text-[128px]">{t.hero.title1}<br /><span className="text-orange">{t.hero.title2}</span></h1>
            <div className="mt-[22px] flex flex-wrap gap-3">
              <Button variant="orange" to="/register">{t.hero.cta1}</Button>
              <Button variant="ghost" to={`/tournaments/${next.slug}`}>{t.hero.cta2}</Button>
            </div>
          </div>
          <div className="absolute bottom-6 left-6 right-6 z-[2] hidden grid-cols-4 gap-3 lg:grid">
            {upcoming.map(m => <MatchCard key={m.id} m={m} />)}
          </div>
        </Reveal>
        {/* mobile / tablet: the same strip as a horizontal scroll under the hero */}
        <div className="-mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-1 lg:hidden">
          {upcoming.map(m => <div key={m.id} className="w-[260px] shrink-0 snap-start"><MatchCard m={m} /></div>)}
        </div>
      </section>

      {/* ---------- MATCH DAY ---------- */}
      <section className="wrap pt-[110px]">
        <Heading a={t.sections.matchday1} b={t.sections.matchday2} className="mb-[34px]" />
        <div className="grid gap-[18px] md:grid-cols-3">
          <Reveal className="relative flex min-h-[290px] flex-col justify-between rounded-[20px] bg-orange p-[26px] pb-[22px] text-[#111]">
            <span className="absolute right-[14px] top-[14px] rounded-[5px] bg-white px-2 py-1 text-[10px] font-extrabold tracking-[.14em] text-[#111]">{t.status.optional}</span>
            <div>
              <div className="text-[12px] font-extrabold uppercase tracking-[.16em] opacity-85">● {t.status.live} · {t.misc.court} {live?.court}</div>
              <div className="disp my-2 text-[64px]">{live?.homeScore} – {live?.awayScore}</div>
              <div className="text-[20px] font-bold uppercase tracking-[.02em]">{live ? `${teamById(live.homeId)?.name} vs ${teamById(live.awayId)?.name}` : '—'}</div>
              <div className="mt-[6px] text-[13px] opacity-85">{live && categoryById(live.categoryId).name} · {live?.label} · 19 Σεπ, {live?.time}</div>
            </div>
            <div className="mt-[22px] flex items-center justify-between text-[12px] font-bold uppercase tracking-[.1em]"><span className="rounded-lg bg-black/15 px-3 py-2">Δες live →</span><span>{next.venue}</span></div>
          </Reveal>
          <Reveal delay={80} className="flex min-h-[290px] flex-col justify-between rounded-[20px] bg-blue p-[26px] pb-[22px] text-white">
            <div>
              <div className="text-[12px] font-extrabold uppercase tracking-[.16em] opacity-85">{t.status.startsIn}</div>
              <Countdown to={next.startsAt} className="mono my-2 block text-[44px] font-extrabold tracking-[-.02em] md:text-[56px]" />
              <div className="text-[20px] font-bold uppercase tracking-[.02em]">{next.name}</div>
              <div className="mt-[6px] text-[13px] opacity-90">{next.days[0]}, 17:00 · {next.teamsCount} ομάδες · {next.categoryIds.length} κατηγορίες</div>
            </div>
            <div className="mt-[22px] flex items-center justify-between text-[12px] font-bold uppercase tracking-[.1em]"><Link to={`/tournaments/${next.slug}`} className="rounded-lg bg-black/20 px-3 py-2">Πρόγραμμα →</Link><span>{next.courts} γήπεδα</span></div>
          </Reveal>
          <Reveal delay={160} className="flex min-h-[290px] flex-col justify-between rounded-[20px] bg-slate p-[26px] pb-[22px] text-white">
            <div>
              <div className="text-[12px] font-extrabold uppercase tracking-[.16em] opacity-85">{t.status.done}</div>
              <div className="disp my-2 text-[64px]">{lastDone?.city ?? 'Παλλήνη'}</div>
              <div className="text-[20px] font-bold uppercase tracking-[.02em]">Νικητές ανά κατηγορία</div>
              <div className="mt-[6px] text-[13px] opacity-85">18+ GOONLANDERS · 40+ PINK ROSES · U18 ΘΥΜΙΟΛΑΣ · U15 COURT KINGS</div>
            </div>
            <div className="mt-[22px] flex items-center justify-between text-[12px] font-bold uppercase tracking-[.1em]"><Link to="/archive" className="rounded-lg bg-black/20 px-3 py-2">Αποτελέσματα →</Link><span>{lastDone ? `${lastDone.teamsCount} ομάδες` : '66 ομάδες'}</span></div>
          </Reveal>
        </div>
      </section>

      {/* ---------- STANDINGS (light) ---------- */}
      <section className="mt-[70px] bg-chalk text-bg">
        <div className="wrap py-[90px]">
          <Heading a={t.sections.standings1} b={t.sections.standings2} dark={false} className="mb-[26px]" />
          <div className="mb-[26px] flex flex-wrap gap-2">
            {categories.filter(c => c.id !== 'o18_women').map(c => (
              <Chip key={c.id} light active={cat === c.id} color={catColor[c.key]} onClick={() => setCat(c.id)}>{c.short}</Chip>
            ))}
          </div>
          {catGroups.length
            ? <div className="grid gap-5 lg:grid-cols-2">{catGroups.map(g => <StandingsTable key={g.id} g={g} solid subtitle={`${categoryById(g.categoryId).name} · ${next.city}`} />)}</div>
            : <div className="rounded-[20px] bg-bg p-8 text-[14px] text-dim">Οι όμιλοι της κατηγορίας ανακοινώνονται με το πρόγραμμα.</div>}
        </div>
      </section>

      {/* ---------- KNOCKOUT ---------- */}
      <section className="wrap pt-[100px]">
        {ko.length > 0 && <><Heading a={t.sections.ko} b={categoryById(ko[0].categoryId).name} className="mb-[34px]" />
        <BracketGrid matches={ko} /></>}
      </section>

      {/* ---------- TOUR ---------- */}
      <section className="wrap pt-[100px]">
        <Heading a={t.sections.tour1} b="2026" className="mb-[34px]" />
        <div className="grid gap-[22px] lg:grid-cols-[1.15fr_1fr]">
          <div className="card relative min-h-[420px] rounded-band p-[26px] md:min-h-[600px]">
            <div className="kicker absolute left-[26px] top-[26px]">25 πόλεις · 2018–2026</div>
            <GreeceMap className="h-[380px] md:h-[560px]" />
          </div>
          <div className="flex flex-col gap-[10px]">
            {stops.map(s => (
              <div key={s.id} className={cn('card pop grid grid-cols-[72px_1fr_auto] items-center gap-[18px] px-[18px] py-4 md:grid-cols-[92px_1fr_auto]', s.status === 'next' && 'border-orange')}>
                <div className="disp text-[34px]">{s.dateShort.day}<span className="block font-sans text-[14px] font-bold tracking-[.1em] text-dim">{s.dateShort.month}</span></div>
                <div><div className="text-[17px] font-bold">{s.name}</div><div className="mt-[3px] text-[13px] text-dim">{s.detail}</div></div>
                <span className={cn('rounded-lg border border-line px-3 py-2 text-[11px] font-extrabold uppercase tracking-[.12em]',
                  s.status === 'next' && 'border-orange bg-orange text-[#111]', s.status === 'registration' && 'border-blue bg-blue')}>
                  {s.status === 'next' ? 'Πρόγραμμα' : s.status === 'registration' ? 'Δηλώσεις' : 'Σύντομα'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- ARCHIVE ---------- */}
      <section className="wrap pt-[100px]">
        <div className="mb-[34px] flex items-end justify-between">
          <Heading a={t.sections.archive1} b={t.sections.archive2} />
          <Link to="/archive" className="text-[14px] font-bold uppercase tracking-[.08em] text-orange">{t.misc.viewAll} →</Link>
        </div>
        <div className="flex snap-x gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible">
          {archive.map(a => (
            <Link to="/archive" key={a.id} className="card pop w-[280px] shrink-0 snap-start overflow-hidden rounded-[18px] lg:w-auto">
              <div className={cn('h-[190px] bg-cover bg-[center_70%]',
                a.tint === 'orange' && '[filter:sepia(1)_saturate(2.2)_hue-rotate(-10deg)]', a.tint === 'blue' && '[filter:saturate(1.6)] bg-[20%_80%]',
                a.tint === 'mono' && '[filter:grayscale(1)_contrast(1.15)] bg-[80%_60%]', a.tint === 'teal' && '[filter:sepia(1)_saturate(1.4)_hue-rotate(160deg)] bg-[40%_90%]')}
                style={{ backgroundImage: 'url(/img/hero-dark.jpg)' }} />
              <div className="px-[18px] pb-5 pt-4">
                <div className="mb-2 flex gap-[10px] text-[11px] font-extrabold uppercase tracking-[.1em] text-dim"><b className="text-orange">{a.city}</b><span>{a.when}</span></div>
                <div className="disp text-[36px]">{a.title}</div>
                <div className="mt-[10px] text-[13px] text-dim">{a.blurb}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- SPONSORS ---------- */}
      <section className="pt-[100px]">
        <div className="wrap kicker mb-[22px]">{t.sections.sponsors}</div>
        <Marquee duration={30} className="border-y border-line py-[26px]">
          {sponsors.map(s => <span key={s} className="disp whitespace-nowrap text-[34px] font-bold tracking-[.04em] text-[#6b6f73]">{s}</span>)}
        </Marquee>
      </section>
    </>
  )
}
