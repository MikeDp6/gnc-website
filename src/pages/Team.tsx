import { useParams, Link } from 'react-router-dom'
import { useData } from '@/data/store'
import { catColor } from '@/lib/categories'
import { useI18n } from '@/i18n'
import { Band } from '@/components/layout/Band'
import { Crumb } from '@/components/ui/Crumb'
import { Heading } from '@/components/ui/Heading'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Timeline } from '@/components/ui/Timeline'
import { MatchRow } from '@/components/match/MatchRow'
import { StandingsTable } from '@/components/standings/StandingsTable'
import { NotFound } from './NotFound'

export function Team() {
  const { id = '' } = useParams()
  const { t } = useI18n()
  const { categoryById, groups, matches, playerById, teamById, tournaments, loading } = useData()
  const team = teamById(id)
  if (!team) return loading ? <div className="wrap py-[120px] text-dim">Φόρτωση…</div> : <NotFound />
  const cat = categoryById(team.categoryId)
  const tour = tournaments.find(x => x.status !== 'done') ?? tournaments[0]
  const my = matches.filter(m => m.homeId === team.id || m.awayId === team.id)
  const next = my.find(m => m.status === 'scheduled')
  const group = groups.find(g => g.rows.some(r => r.teamId === team.id))
  const row = group?.rows.find(r => r.teamId === team.id)
  const pos = group ? group.rows.findIndex(r => r.teamId === team.id) + 1 : undefined
  const captain = playerById(team.captainId)
  const [a, ...rest] = team.name.split(' ')

  return (
    <>
      <Crumb items={[{ label: t.nav.teams }, { label: tour.name, to: `/tournaments/${tour.slug}` }, { label: cat.name }, { label: team.name }]} />
      <Band kicker={<><i className="mr-2 inline-block h-[10px] w-[10px] rounded-full align-[-1px]" style={{ background: catColor[cat.key] }} />{cat.name} · {group?.name} · {tour.name}</>}
        title={a} title2={rest.join(' ') || undefined}
        sub={`${team.city ?? ''}${captain ? ` · Αρχηγός: ${captain.name}` : ''} · 3η συμμετοχή σε τουρνουά GNC`}
        stats={row ? [{ v: `${row.wins}–${row.losses}`, l: 'Νίκες–Ήττες' }, { v: `${pos}η`, l: group!.name }, { v: `${row.pointsFor - row.pointsAgainst > 0 ? '+' : ''}${row.pointsFor - row.pointsAgainst}`, l: 'Διαφορά' }, { v: team.playerIds?.length ?? 4, l: 'Παίκτες' }] : undefined} />

      <section className="wrap pt-[70px]">
        <div className="mb-[26px] flex items-end justify-between"><Heading a="Επόμενος" b="αγώνας" size="md" /><a className="text-[13px] font-bold uppercase tracking-[.08em] text-orange">Όλοι οι αγώνες →</a></div>
        <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
          {next ? (
            <div className="flex min-h-[220px] flex-col justify-between rounded-[20px] bg-blue p-[26px] text-white">
              <div>
                <div className="text-[12px] font-extrabold uppercase tracking-[.16em] opacity-85">{next.label} · {next.day === 1 ? 'Σάββατο' : 'Κυριακή'} {next.time} · {t.misc.court} {next.court}</div>
                <div className="disp my-2 text-[44px] md:text-[64px]">{teamById(next.homeId)?.name ?? next.homeLabel} <span className="opacity-60">vs</span> {teamById(next.awayId)?.name ?? next.awayLabel}</div>
                <div className="text-[14px] opacity-90">Ειδοποίηση 15΄ πριν σε όλους τους παίκτες της ομάδας.</div>
              </div>
              <div className="mt-[22px] flex flex-wrap gap-[10px]"><Button variant="white">Προσθήκη στο ημερολόγιο</Button><Button variant="ghost" className="border-white/40" to={`/tournaments/${tour.slug}`}>Δες το bracket</Button></div>
            </div>
          ) : <div className="card p-8 text-dim">Δεν υπάρχει προγραμματισμένος αγώνας.</div>}
          <div className="card p-6">
            <h4 className="kicker mb-[14px]">Η ομάδα</h4>
            {[['Κατηγορία', cat.name], ['Πόλη', team.city ?? '—'], ['Συμμετοχές GNC', '3 (2024–2026)'], ['Καλύτερη θέση', 'Νικητής · Πεύκη 2025']].map(([k, v]) => (
              <div key={k} className="flex justify-between border-t border-line py-[11px] text-[14px]"><span className="text-dim">{k}</span><b className="font-semibold">{v}</b></div>
            ))}
            <div className="flex justify-between border-t border-line py-[11px] text-[14px]"><span className="text-dim">Check-in</span><b className="font-semibold text-ok">✓ Έγινε 16:42</b></div>
          </div>
        </div>
      </section>

      <section className="wrap pt-[70px]">
        <Heading a="Αγώνες" b={tour.city} size="md" className="mb-[26px]" />
        {my.map(m => <MatchRow key={m.id} m={m} mine showCategory={false} />)}
      </section>

      <section className="wrap grid gap-5 pt-[70px] lg:grid-cols-2">
        {group && <StandingsTable g={{ ...group, note: 'Μπλε = προκρίνονται · Πορτοκαλί = η ομάδα σου' }} meId={team.id} subtitle={`${cat.name} · ${tour.city}`} />}
        <div>
          <div className="mb-[14px] flex items-end justify-between"><Heading a="Ρόστερ" size="sm" /><a className="text-[13px] font-bold uppercase tracking-[.08em] text-orange">Αλλαγή ρόστερ έως Παρ 18/9 →</a></div>
          <div className="grid gap-[14px] sm:grid-cols-2">
            {(team.playerIds ?? []).map(pid => {
              const p = playerById(pid)!
              const isCap = pid === team.captainId
              return (
                <Link to={`/players/${p.id}`} key={pid} className="card pop flex items-center gap-4 p-5">
                  <Avatar name={p.name} tone={isCap ? 'orange' : 'blue'} />
                  <div>
                    <div className="text-[17px] font-bold">{p.name}{isCap && <span className="ml-2 rounded-[5px] bg-orange px-[7px] py-[3px] align-[2px] text-[10px] font-extrabold tracking-[.12em] text-[#111]">ΑΡΧΗΓΟΣ</span>}</div>
                    <div className="mt-1 text-[12px] font-bold uppercase tracking-[.06em] text-dim">{isCap ? '7 συμμετοχές · 2 τίτλοι' : 'Παίκτης'}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="wrap pt-[70px]">
        <Heading a="Ιστορικό" b="ομάδας" size="md" className="mb-[26px]" />
        <Timeline items={[
          { year: '2026', month: 'ΣΕΠ', title: 'Λυκόβρυση–Πεύκη 2026 · 35+ MEN', sub: '1η Ομίλου Α · 3–0 · προκρίθηκε στα νοκ-άουτ', result: 'Σε εξέλιξη', tone: 'live' },
          { year: '2026', month: 'ΙΟΥΝ', title: 'Παλλήνη 2026 · 40+ MEN', sub: '2ος Ομίλου Β · ήττα στον ημιτελικό από PINK ROSES 17–19', result: 'Ημιτελικός', tone: 'sf' },
          { year: '2025', month: 'ΣΕΠ', title: 'Πεύκη 2025 · 35+ MEN', sub: 'Νίκη στον τελικό 21–15 vs RAFINA WARRIORS', result: 'Νικητής', tone: 'gold' },
          { year: '2024', month: 'ΜΑΪ', title: 'Καλαμάτα 2024 · 35+ MEN', sub: '3ος Ομίλου Α', result: 'Όμιλοι' },
        ]} />
      </section>
    </>
  )
}
