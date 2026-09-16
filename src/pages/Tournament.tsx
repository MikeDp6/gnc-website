import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useData } from '@/data/store'
import { catColor } from '@/lib/categories'
import { useI18n } from '@/i18n'
import { Band } from '@/components/layout/Band'
import { SubTabs } from '@/components/layout/SubTabs'
import { Crumb } from '@/components/ui/Crumb'
import { Heading } from '@/components/ui/Heading'
import { Chip } from '@/components/ui/Chip'
import { Button } from '@/components/ui/Button'
import { MatchRow } from '@/components/match/MatchRow'
import { StandingsTable } from '@/components/standings/StandingsTable'
import { BracketGrid } from '@/components/bracket/BracketGrid'
import { NotFound } from './NotFound'
import { PrintSchedule } from '@/components/PrintSchedule'

const TABS = ['Πρόγραμμα', 'Όμιλοι', 'Νοκ-άουτ', 'Ομάδες', 'Πληροφορίες']

export function Tournament() {
  const { slug = '' } = useParams()
  const { t } = useI18n()
  const { categories, categoryById, groups, matches, teams, tournamentBySlug, loading } = useData()
  const [params] = useSearchParams()
  const tour = tournamentBySlug(slug)
  const [tab, setTab] = useState(params.get('tab') === 'teams' ? 'Ομάδες' : TABS[0])
  const [day, setDay] = useState<1 | 2>(1)
  const [cat, setCat] = useState<string>('all')
  const list = useMemo(() => matches.filter(m => m.tournamentId === tour?.id && m.day === day && (cat === 'all' || m.categoryId === cat)), [matches, tour, day, cat])
  if (!tour) return loading ? <div className="wrap py-[120px] text-dim">Φόρτωση…</div> : <NotFound />
  const cats = categories.filter(c => tour.categoryIds.includes(c.id))
  const koCat = matches.find(m => m.tournamentId === tour.id && m.phase !== 'group')?.categoryId

  // group rows by start time so the schedule reads like the paper programme
  const byTime = list.reduce<Record<string, typeof list>>((acc, m) => { (acc[m.time] ??= []).push(m); return acc }, {})
  const ko = matches.filter(m => m.tournamentId === tour.id && m.categoryId === koCat && m.phase !== 'group')

  return (
    <>
      <Crumb items={[{ label: t.nav.tournaments, to: '/' }, { label: tour.name }]} />
      <Band kicker={`${tour.dates} · ${tour.venue}`} title={tour.name.split('–')[0]} title2={tour.name.split('–')[1]}
        sub={`${tour.days.join(' και ')}, ${tour.courts} γήπεδα. Όμιλοι και νοκ-άουτ σε ${tour.categoryIds.length} κατηγορίες.`}
        stats={[{ v: tour.teamsCount, l: 'Ομάδες' }, { v: tour.categoryIds.length, l: 'Κατηγορίες' }, { v: matches.filter(m => m.tournamentId === tour.id).length, l: 'Αγώνες' }, { v: tour.courts, l: 'Γήπεδα' }]} />
      <SubTabs tabs={TABS} active={tab} onChange={setTab} right={<Button variant="ghost" className="border-orange text-orange" onClick={() => window.print()}>↓ {t.misc.schedulePdf}</Button>} />
      <PrintSchedule tour={tour} />

      {tab === 'Πρόγραμμα' && (
        <section className="wrap pt-[70px]">
          <div className="mb-[26px] flex flex-wrap items-end justify-between gap-4">
            <Heading a={t.nav.schedule} b={(tour.days[day - 1] ?? '').split(' ')[0]} size="md" />
            <div className="flex flex-wrap gap-2">
              {tour.days.map((dn, i) => <Chip key={dn} active={day === i + 1} onClick={() => setDay((i + 1) as 1 | 2)}>{dn}</Chip>)}
              <span className="w-2" />
              <Chip active={cat === 'all'} onClick={() => setCat('all')}>{t.misc.all}</Chip>
              {cats.map(c => <Chip key={c.id} active={cat === c.id} color={catColor[c.key]} onClick={() => setCat(c.id)}>{c.short}</Chip>)}
            </div>
          </div>
          {Object.entries(byTime).map(([time, ms]) => (
            <div key={time}>
              <div className="disp mb-3 mt-[26px] flex items-baseline gap-[14px] text-[32px]">{time}<span className="font-sans text-[12px] font-bold uppercase tracking-[.12em] text-dim">{ms[0].phase === 'group' ? 'Φάση ομίλων' : 'Νοκ-άουτ'}</span></div>
              {ms.map(m => <MatchRow key={m.id} m={m} />)}
            </div>
          ))}
          {!list.length && <div className="card p-8 text-[14px] text-dim">Δεν υπάρχουν αγώνες με αυτά τα φίλτρα.</div>}
        </section>
      )}

      {tab === 'Όμιλοι' && (
        <section className="wrap pt-[70px]">
          <Heading a="Όμιλοι" b="ανά κατηγορία" size="md" className="mb-[26px]" />
          <div className="grid gap-5 lg:grid-cols-2">
            {groups.map(g => <StandingsTable key={g.id} g={g} subtitle={`${categoryById(g.categoryId).name} · ${tour.city}`} />)}
          </div>
        </section>
      )}

      {tab === 'Νοκ-άουτ' && (
        <section className="wrap pt-[70px]">
          {ko.length ? <><Heading a={t.sections.ko} b={categoryById(ko[0].categoryId).name} size="md" className="mb-[26px]" /><BracketGrid matches={ko} /></> : <div className="card p-8 text-[14px] text-dim">Τα νοκ-άουτ ανακοινώνονται μετά τους ομίλους.</div>}
        </section>
      )}

      {tab === 'Ομάδες' && (
        <section className="wrap pt-[70px]">
          <Heading a="Ομάδες" b={`${teams.filter(x => x.tournamentId === tour.id).length || tour.teamsCount}`} size="md" className="mb-[26px]" />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {cats.map(c => {
              const list = teams.filter(x => x.categoryId === c.id)
              return (
                <div key={c.id} className="card p-5">
                  <div className="mb-3 flex items-center justify-between"><b className="disp text-[28px]">{c.name}</b><span className="text-[12px] font-bold uppercase tracking-[.1em] text-dim">{list.length} ομάδες</span></div>
                  {list.map(x => <Link key={x.id} to={`/teams/${x.id}`} className="flex items-center gap-3 border-t border-line py-[10px] text-[14px] font-semibold hover:text-orange"><i className="h-2 w-2 rounded-full" style={{ background: catColor[c.key] }} />{x.name}</Link>)}
                  {!list.length && <div className="text-[13px] text-dim">Καμία δήλωση ακόμη.</div>}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {tab === 'Πληροφορίες' && (
        <section className="wrap grid gap-5 pt-[70px] lg:grid-cols-[2fr_1fr]">
          <div className="card p-6">
            <h4 className="kicker mb-[14px]">Πληροφορίες</h4>
            {[['Γήπεδο', tour.venue], ['Διεύθυνση', tour.address ?? '—'], ['Ώρες', 'Σάβ–Κυρ 17:00–23:30'], ['Αγώνας', '10΄ ή πρώτος στους 21'], ['Check-in', 'QR ομάδας στην είσοδο']].map(([k, v]) => (
              <div key={k} className="flex justify-between border-t border-line py-[11px] text-[14px]"><span className="text-dim">{k}</span><b className="font-semibold">{v}</b></div>
            ))}
            <div className="mt-[18px]"><Button className="w-full">Οδηγίες στον χάρτη →</Button></div>
          </div>
        </section>
      )}
    </>
  )
}
