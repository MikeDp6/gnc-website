import { useParams, Link } from 'react-router-dom'
import { useData } from '@/data/store'
import { Band } from '@/components/layout/Band'
import { Crumb } from '@/components/ui/Crumb'
import { Heading } from '@/components/ui/Heading'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Timeline } from '@/components/ui/Timeline'
import { MatchRow } from '@/components/match/MatchRow'
import { NotFound } from './NotFound'

export function Player() {
  const { id = '' } = useParams()
  const { matches, playerById, teamById, categoryById, tournaments, loading } = useData()
  const p = playerById(id)
  if (!p) return loading ? <div className="wrap py-[120px] text-dim">Φόρτωση…</div> : <NotFound />
  const team = teamById(p.teamId)
  const cat = team ? categoryById(team.categoryId) : undefined
  const tour = tournaments.find(x => x.status !== 'done') ?? tournaments[0]
  const my = team ? matches.filter(m => m.homeId === team.id || m.awayId === team.id) : []
  const [first, ...rest] = p.name.split(' ')

  return (
    <>
      <Crumb items={[{ label: 'Παίκτες' }, { label: p.name }]} />
      <Band kicker={`Παίκτης από το ${p.since ?? '—'} · ${p.city ?? ''}`} title={first} title2={rest.join(' ')}
        left={<Avatar name={p.name} tone="orange" size={132} className="border-4 border-white/15" />}
        sub={team ? `Αρχηγός της ${team.name} (${cat?.name}). Έχει παίξει σε 5 πόλεις της περιοδείας GNC.` : undefined}
        stats={[{ v: 7, l: 'Συμμετοχές' }, { v: 2, l: 'Τίτλοι' }, { v: 23, l: 'Νίκες' }, { v: 5, l: 'Πόλεις' }]} />

      <section className="wrap grid gap-5 pt-[70px] lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="mb-[26px] flex items-end justify-between"><Heading a="Οι αγώνες μου" b="σήμερα" size="md" /><Link to={`/tournaments/${tour.slug}`} className="text-[13px] font-bold uppercase tracking-[.08em] text-orange">Πρόγραμμα →</Link></div>
          {my.map(m => <MatchRow key={m.id} m={m} mine showCategory={false} />)}
          {team && (
            <>
              <div className="mb-[14px] mt-8 flex items-end justify-between"><Heading a="Η ομάδα μου" size="sm" /><Link to={`/teams/${team.id}`} className="text-[13px] font-bold uppercase tracking-[.08em] text-orange">Σελίδα ομάδας →</Link></div>
              <div className="card flex flex-wrap items-center gap-[22px] px-6 py-[22px]">
                <Avatar name={team.name} tone="red" size={72} />
                <div className="flex-1">
                  <div className="text-[22px] font-bold">{team.name}<span className="ml-2 rounded-[5px] bg-orange px-[7px] py-[3px] align-[3px] text-[10px] font-extrabold tracking-[.12em] text-[#111]">ΑΡΧΗΓΟΣ</span></div>
                  <div className="mt-1 text-[12px] font-bold uppercase tracking-[.06em] text-dim">{cat?.name} · {tour.name}</div>
                </div>
                <div className="flex gap-2"><Button variant="ghost">Πρόσκληση συμπαίκτη</Button><Button>QR check-in</Button></div>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-col gap-[14px]">
          <div className="card p-6">
            <h4 className="kicker mb-[14px]">Τίτλοι & διακρίσεις</h4>
            <div className="flex flex-col gap-2">
              {[['Νικητής', 'Πεύκη 2025 · 35+ MEN', 'text-orange'], ['Νικητής', 'Λάρισα 2022 · 18+ MEN', 'text-orange'], ['Ημιτελικός', 'Παλλήνη 2026 · 40+ MEN', 'text-blue']].map(([a, b, c]) => (
                <div key={b} className="card px-5 py-[18px]"><b className={`disp block text-[44px] ${c}`}>{a}</b><span className="text-[11px] font-bold uppercase tracking-[.12em] text-dim">{b}</span></div>
              ))}
            </div>
          </div>
          <div className="card p-6">
            <h4 className="kicker mb-[14px]">Πόλεις</h4>
            {[['Πεύκη', '2025, 2026'], ['Παλλήνη', '2026'], ['Καλαμάτα', '2024'], ['Λάρισα', '2022'], ['Θεσσαλονίκη', '2019, 2021']].map(([k, v]) => (
              <div key={k} className="flex justify-between border-t border-line py-[11px] text-[14px]"><span className="text-dim">{k}</span><b className="font-semibold">{v}</b></div>
            ))}
          </div>
          <div className="card border-dashed p-6">
            <h4 className="kicker mb-[14px]">Στατιστικά παίκτη</h4>
            <div className="text-[13px] text-dim">Πόντοι, ρεκόρ, MVP ανά αγώνα — <b className="text-white">Φάση 2</b> (απαιτεί καταγραφή από τη γραμματεία).</div>
          </div>
        </div>
      </section>

      <section className="wrap pt-[70px]">
        <Heading a="Ιστορικό" b="συμμετοχών" size="md" className="mb-[26px]" />
        <Timeline items={[
          { year: '2026', month: 'ΣΕΠ', title: 'Λυκόβρυση–Πεύκη 2026 · Erasitechnes BC · 35+ MEN', sub: '1η Ομίλου Α · 3–0 · νοκ-άουτ Κυριακή', result: 'Σε εξέλιξη', tone: 'live' },
          { year: '2026', month: 'ΙΟΥΝ', title: 'Παλλήνη 2026 · Erasitechnes BC · 40+ MEN', sub: 'Ημιτελικός · 3 νίκες, 2 ήττες', result: 'Ημιτελικός', tone: 'sf' },
          { year: '2025', month: 'ΣΕΠ', title: 'Πεύκη 2025 · Erasitechnes BC · 35+ MEN', sub: 'Τελικός 21–15 vs RAFINA WARRIORS · 5 νίκες, 0 ήττες', result: 'Νικητής', tone: 'gold' },
          { year: '2024', month: 'ΜΑΪ', title: 'Καλαμάτα 2024 · Erasitechnes BC · 35+ MEN', sub: 'Όμιλοι · 1 νίκη, 2 ήττες', result: 'Όμιλοι' },
          { year: '2022', month: 'ΑΠΡ', title: 'Λάρισα 2022 · Οι Απροπόνητοι · 18+ MEN', sub: 'Τελικός 21–18 · 6 νίκες, 0 ήττες', result: 'Νικητής', tone: 'gold' },
          { year: '2019', month: 'ΙΟΥΝ', title: 'Θεσσαλονίκη 2019 · Οι Απροπόνητοι · 18+ MEN', sub: 'Όμιλοι · πρώτη συμμετοχή', result: 'Όμιλοι' },
        ]} />
      </section>
    </>
  )
}
