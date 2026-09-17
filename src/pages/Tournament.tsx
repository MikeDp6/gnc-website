import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useData } from '@/data/store'
import { catColor } from '@/lib/categories'
import { useI18n } from '@/i18n'
import { useJsonLd, useMeta } from '@/lib/meta'
import { Band } from '@/components/layout/Band'
import { SubTabs } from '@/components/layout/SubTabs'
import { Crumb } from '@/components/ui/Crumb'
import { Heading } from '@/components/ui/Heading'
import { Chip } from '@/components/ui/Chip'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { Photo } from '@/components/ui/Photo'
import { MatchRow } from '@/components/match/MatchRow'
import { StandingsTable } from '@/components/standings/StandingsTable'
import { BracketGrid } from '@/components/bracket/BracketGrid'
import { NotFound } from './NotFound'
import { PrintSchedule } from '@/components/PrintSchedule'

type TabKey = 'schedule' | 'groups' | 'ko' | 'teams' | 'photos' | 'info'
const ALL_KEYS: TabKey[] = ['schedule', 'groups', 'ko', 'teams', 'photos', 'info']

export function Tournament() {
  const { slug = '' } = useParams()
  const { t } = useI18n()
  const { categories, categoryById, groups, matches, teams, tournamentBySlug, loading, photos } = useData()
  const [params, setParams] = useSearchParams()
  const tour = tournamentBySlug(slug)
  // the tab lives in the address, so the menu can link straight to Ομάδες and the highlight follows
  const asked = params.get('tab') as TabKey | null
  const tab: TabKey = asked && ALL_KEYS.includes(asked) ? asked : 'schedule'
  const setTab = (k: TabKey) => setParams(prev => {
    const n = new URLSearchParams(prev)
    if (k === 'schedule') n.delete('tab'); else n.set('tab', k)
    return n
  }, { replace: true })
  const [day, setDay] = useState<1 | 2>(1)
  const [cat, setCat] = useState<string>('all')
  const list = useMemo(() => matches.filter(m => m.tournamentId === tour?.id && m.day === day && (cat === 'all' || m.categoryId === cat)), [matches, tour, day, cat])
  useMeta(tour?.name, tour ? `${tour.dates} · ${tour.venue}. ${t.tour.sub(tour.days.join(' & '), tour.courts, tour.categoryIds.length)}` : undefined, tour?.cover)
  useJsonLd(tour ? {
    '@context': 'https://schema.org', '@type': 'SportsEvent', name: tour.name, sport: '3x3 Basketball',
    startDate: tour.startsAt, eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: { '@type': 'Place', name: tour.venue, address: { '@type': 'PostalAddress', addressLocality: tour.city, addressCountry: 'GR', streetAddress: tour.address } },
    image: tour.cover ? new URL(tour.cover, window.location.origin).href : undefined,
    organizer: { '@type': 'Organization', name: 'GNC 3on3', url: window.location.origin },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url: `${window.location.origin}/register` },
  } : null)
  if (!tour) return loading ? <div className="wrap py-[120px] text-dim">{t.loading}</div> : <NotFound />
  const cats = categories.filter(c => tour.categoryIds.includes(c.id))
  const all = matches.filter(m => m.tournamentId === tour.id)
  const liveNow = all.filter(m => m.status === 'live').length

  // group rows by start time so the schedule reads like the paper programme
  const byTime = list.reduce<Record<string, typeof list>>((acc, m) => { (acc[m.time] ??= []).push(m); return acc }, {})
  // knockout per category (every category that has one)
  const koByCat = cats.map(c => ({ c, ms: all.filter(m => m.categoryId === c.id && m.phase !== 'group') })).filter(x => x.ms.length)
  const gallery = photos.filter(p => p.tournamentId === tour.id)
  const TAB_KEYS = ALL_KEYS.filter(k => k !== 'photos' || gallery.length > 0)
  const tabLabels = TAB_KEYS.map(k => t.tour.tabs[k])
  const tabOf = (label: string) => TAB_KEYS[tabLabels.indexOf(label)] ?? 'schedule'

  return (
    <>
      <Crumb items={[{ label: t.nav.tournaments, to: '/' }, { label: tour.name }]} />
      <Band kicker={<>{liveNow > 0 && <span className="mr-3 inline-flex items-center gap-2 rounded-full bg-orange px-3 py-1 text-[11px] text-[#111]"><i className="live-dot h-2 w-2 rounded-full bg-[#111]" />LIVE · {liveNow}</span>}{tour.dates} · {tour.venue}</>}
        title={tour.name.split('–')[0]} title2={tour.name.split('–')[1]} cover={tour.cover}
        sub={t.tour.sub(tour.days.join(' & '), tour.courts, tour.categoryIds.length)}
        actions={tour.status === 'registration' ? <Button variant="orange" to="/register">{t.hero.cta1} →</Button> : undefined}
        stats={[{ v: tour.teamsCount, l: t.status.teams }, { v: tour.categoryIds.length, l: t.status.cats }, { v: all.length, l: t.team.matches }, { v: tour.courts, l: t.status.courts }]} />
      <SubTabs tabs={tabLabels} active={t.tour.tabs[tab]} onChange={l => setTab(tabOf(l))} right={<Button variant="ghost" className="border-orange text-orange" onClick={() => window.print()}>↓ {t.misc.schedulePdf}</Button>} />
      <PrintSchedule tour={tour} />

      {tab === 'schedule' && (
        <section className="wrap pt-[50px]">
          {/* filters stay in view while you scroll the day (glass bar under the nav) */}
          <div className="glass z-20 mb-[22px] flex flex-col gap-3 rounded-[20px] px-4 py-3 md:sticky md:top-[86px] md:flex-row md:flex-wrap md:items-center md:justify-between md:rounded-full md:px-5">
            <Heading a={t.nav.schedule} b={(tour.days[day - 1] ?? '').split(' ')[0]} size="sm" />
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
              {tour.days.map((dn, i) => <Chip key={dn} active={day === i + 1} onClick={() => setDay((i + 1) as 1 | 2)}>{dn}</Chip>)}
              <span className="w-2 shrink-0" />
              <Chip active={cat === 'all'} onClick={() => setCat('all')}>{t.misc.all}</Chip>
              {cats.map(c => <Chip key={c.id} active={cat === c.id} color={catColor[c.key]} onClick={() => setCat(c.id)}>{c.short}</Chip>)}
            </div>
          </div>
          {Object.entries(byTime).map(([time, ms]) => (
            <Reveal key={time}>
              <div className="disp mb-3 mt-[26px] flex items-baseline gap-[14px] text-[32px]">{time}<span className="font-sans text-[12px] font-bold uppercase tracking-[.12em] text-dim">{ms[0].phase === 'group' ? t.tour.groupPhase : t.tour.koPhase}</span></div>
              {ms.map(m => <MatchRow key={m.id} m={m} />)}
            </Reveal>
          ))}
          {!list.length && <div className="card p-8 text-[14px] text-dim">{t.tour.noMatches}</div>}
        </section>
      )}

      {tab === 'groups' && (
        <section className="wrap pt-[70px]">
          <div className="mb-[26px] flex flex-wrap items-end justify-between gap-4">
            <Heading a={t.tour.tabs.groups} b={t.tour.groupsBy} size="md" />
            <div className="flex flex-wrap gap-2">
              <Chip active={cat === 'all'} onClick={() => setCat('all')}>{t.misc.all}</Chip>
              {cats.map(c => <Chip key={c.id} active={cat === c.id} color={catColor[c.key]} onClick={() => setCat(c.id)}>{c.short}</Chip>)}
            </div>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {groups.filter(g => cat === 'all' || g.categoryId === cat).map((g, i) => <Reveal key={g.id} delay={(i % 2) * 80}><StandingsTable g={g} subtitle={`${categoryById(g.categoryId).name} · ${tour.city}`} /></Reveal>)}
          </div>
          {!groups.length && <div className="card p-8 text-[14px] text-dim">{t.hero.soon}</div>}
        </section>
      )}

      {tab === 'ko' && (
        <section className="wrap pt-[70px]">
          {koByCat.length ? koByCat.map(({ c, ms }, i) => (
            <Reveal key={c.id} className={i > 0 ? 'mt-14' : ''}>
              <div className="mb-[22px] flex items-center gap-3"><i className="h-3 w-3 rounded-full" style={{ background: catColor[c.key] }} /><Heading a={t.sections.ko} b={c.name} size="md" /></div>
              <BracketGrid matches={ms} />
            </Reveal>
          )) : <div className="card p-8 text-[14px] text-dim">{t.tour.koSoon}</div>}
        </section>
      )}

      {tab === 'teams' && (
        <section className="wrap pt-[70px]">
          <Heading a={t.tour.tabs.teams} b={`${teams.filter(x => x.tournamentId === tour.id).length || tour.teamsCount}`} size="md" className="mb-[26px]" />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {cats.map((c, i) => {
              const list = teams.filter(x => x.categoryId === c.id && (!x.tournamentId || x.tournamentId === tour.id))
              return (
                <Reveal key={c.id} delay={(i % 3) * 70} className="card p-5">
                  <div className="mb-3 flex items-center justify-between"><b className="disp text-[28px]" style={{ color: catColor[c.key] }}>{c.name}</b><span className="text-[12px] font-bold uppercase tracking-[.1em] text-dim">{list.length} {t.tour.teamsN}</span></div>
                  {list.map(x => <Link key={x.id} to={`/teams/${x.id}`} className="flex items-center gap-3 border-t border-line py-[10px] text-[14px] font-semibold hover:text-orange"><i className="h-2 w-2 rounded-full" style={{ background: catColor[c.key] }} />{x.name}</Link>)}
                  {!list.length && <div className="text-[13px] text-dim">{t.tour.noTeams}</div>}
                </Reveal>
              )
            })}
          </div>
        </section>
      )}

      {tab === 'photos' && (
        <section className="wrap pt-[70px]">
          <Heading a={t.tour.tabs.photos} b={String(gallery.length)} size="md" className="mb-[26px]" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((p, i) => (
              <Reveal key={p.id} delay={(i % 3) * 60}>
                <a href={p.url} target="_blank" rel="noreferrer" className="card pop relative block h-[240px] overflow-hidden rounded-[16px]">
                  <Photo src={p.url} className="transition-transform duration-700 hover:scale-[1.04]" position="center" />
                  {(p.caption || p.credit) && (
                    <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(10,10,11,.85))] p-3 text-[12px]">
                      {p.caption}{p.credit && <span className="ml-2 text-mute">© {p.credit}</span>}
                    </div>
                  )}
                </a>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {tab === 'info' && (
        <section className="wrap grid gap-5 pt-[70px] lg:grid-cols-[2fr_1fr]">
          <div className="card p-6">
            <h4 className="kicker mb-[14px]">{t.tour.info}</h4>
            {[[t.tour.venue, tour.venue], [t.tour.address, tour.address ?? '—'], [t.tour.hours, tour.days.join(' · ')], [t.tour.game, '10΄ ή πρώτος στους 21'], [t.tour.checkin, 'QR ομάδας στην είσοδο']].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-t border-line py-[11px] text-[14px]"><span className="text-dim">{k}</span><b className="text-right font-semibold">{v}</b></div>
            ))}
            <div className="mt-[18px] flex flex-col gap-2"><Button className="w-full" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tour.address ?? `${tour.venue} ${tour.city}`)}`}>{t.tour.directions}</Button><Button variant="ghost" className="w-full" to={`/live/${tour.slug}`}>📺 {t.live.title} · TV</Button></div>
          </div>
        </section>
      )}
    </>
  )
}
