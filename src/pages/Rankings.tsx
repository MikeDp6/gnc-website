import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { useMeta } from '@/lib/meta'
import { useData } from '@/data/store'
import { catColor } from '@/lib/categories'
import { fetchRankings } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Band } from '@/components/layout/Band'
import { Crumb } from '@/components/ui/Crumb'
import { Chip } from '@/components/ui/Chip'
import { Reveal } from '@/components/ui/Reveal'
import { Empty } from '@/components/ui/Empty'
import { cn } from '@/lib/cn'
import type { PlayerRank } from '@/data/types'

const medal = (i: number) => i === 0 ? 'text-orange' : i === 1 ? 'text-cement' : i === 2 ? 'text-orange-soft' : 'text-dim'

/**
 * Διαχρονική κατάταξη παικτών: 2 βαθμοί ανά νίκη, συν 10 / 6 / 4 για 1η, 2η και 3η θέση κατηγορίας.
 *
 * Μετράει ανθρώπους, όχι ονόματα ομάδων — το ίδιο όνομα μπορεί να είναι άλλη παρέα του χρόνου, ενώ
 * ο παίκτης παραμένει ο ίδιος και κουβαλάει το ιστορικό του από τουρνουά σε τουρνουά.
 */
export function Rankings() {
  const { t } = useI18n()
  const { tournaments, stats, source, matches, players, teamById, categories, categoryById } = useData()
  const [data, setData] = useState<PlayerRank[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [qs, setQs] = useState('')
  const [cat, setCat] = useState('all')
  useMeta(t.rankings.title1 + ' ' + t.rankings.title2, t.rankings.blurb, tournaments[0]?.cover)

  // Εφεδρεία: αν οι όψεις της βάσης λείπουν ή το site τρέχει χωρίς σύνδεση, η κατάταξη βγαίνει από
  // όσα έχει ήδη το πακέτο δεδομένων. Χωρίς τελικές θέσεις εδώ, οπότε μόνο οι βαθμοί των νικών.
  const local = useMemo(() => {
    const P = new Map<string, PlayerRank>()
    const add = (id: string | undefined, pf: number, pa: number) => {
      const team = teamById(id); if (!team) return
      for (const pid of team.playerIds ?? []) {
        const pl = players.find(x => x.id === pid); if (!pl) continue
        const q = P.get(pid) ?? { id: pid, name: pl.name, city: pl.city, categoryId: team.categoryId, tournaments: 1, teams: 1, played: 0, wins: 0, losses: 0, gold: 0, silver: 0, bronze: 0, points: 0 }
        q.played++; if (pf > pa) q.wins++; else if (pf < pa) q.losses++
        q.points = q.wins * 2
        P.set(pid, q)
      }
    }
    for (const m of matches) {
      if (m.status !== 'final' || m.homeScore == null || m.awayScore == null) continue
      add(m.homeId, m.homeScore, m.awayScore)
      add(m.awayId, m.awayScore, m.homeScore)
    }
    return [...P.values()].sort((a, b) => b.points - a.points || b.wins - a.wins)
  }, [matches, players, teamById])

  useEffect(() => {
    if (!supabase) return
    fetchRankings().then(r => setData(r.length ? r : null)).catch(e => setErr((e as Error).message))
  }, [])
  const view = data ?? local

  const usedCats = useMemo(() => {
    const ids = new Set(view.map(r => r.categoryId).filter(Boolean) as string[])
    return categories.filter(c => ids.has(c.id))
  }, [view, categories])

  const rows = useMemo(() => {
    let out = view
    if (cat !== 'all') out = view.filter(r => r.categoryId === cat)
    else {
      // μία γραμμή ανά παίκτη, με όλες τις κατηγορίες αθροισμένες
      const m = new Map<string, PlayerRank>()
      for (const r of view) {
        const prev = m.get(r.id)
        if (!prev) { m.set(r.id, { ...r, categoryId: undefined }); continue }
        prev.tournaments += r.tournaments; prev.teams += r.teams
        prev.played += r.played; prev.wins += r.wins; prev.losses += r.losses
        prev.gold += r.gold; prev.silver += r.silver; prev.bronze += r.bronze; prev.points += r.points
      }
      out = [...m.values()]
    }
    const q = qs.trim().toLowerCase()
    if (q) out = out.filter(r => r.name.toLowerCase().includes(q))
    return [...out].sort((a, b) => b.points - a.points || b.wins - a.wins)
  }, [view, qs, cat])
  const empty = rows.length === 0

  /** από ποιες κατηγορίες φτιάχνεται μια αθροισμένη γραμμή, για τη στήλη στο «Όλες» */
  const catsOf = (r: PlayerRank) => {
    const names = [...new Set(view.filter(x => x.id === r.id).map(x => x.categoryId).filter(Boolean))]
      .map(cid => categoryById(cid!).short)
    return names.length ? names.join(' · ') : '—'
  }

  return (
    <>
      <Crumb items={[{ label: t.rankings.title1 }]} />
      <Band kicker={`${stats.tournaments} ${t.rankings.tournaments} · ${t.rankings.since} ${stats.sinceYear}`}
        title={t.rankings.title1} title2={t.rankings.title2} cover={tournaments[0]?.cover} sub={t.rankings.blurb} />

      <section className="wrap pt-[50px]">
        <div className="glass z-20 mb-[22px] flex flex-col gap-3 rounded-[24px] px-4 py-3 md:sticky md:top-[86px] md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-y-2 md:rounded-[34px] md:px-5 md:py-[10px]">
          {usedCats.length > 0 && (
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
              <Chip active={cat === 'all'} onClick={() => setCat('all')}>{t.misc.all}</Chip>
              {usedCats.map(c => <Chip key={c.id} active={cat === c.id} color={catColor[c.key]} onClick={() => setCat(c.id)}>{c.short}</Chip>)}
            </div>
          )}
          <input value={qs} onChange={e => setQs(e.target.value)} placeholder={t.rankings.search}
            className="w-full rounded-full border border-white/15 bg-black/25 px-4 py-[9px] text-[14px] outline-none placeholder:text-mute focus:border-white/35 md:w-[240px]" />
        </div>

        {err && <div className="card mb-4 p-5 text-[14px] text-dim">{t.rankings.soon}</div>}
        {empty && (qs
          ? <Empty mark="?" title={t.rankings.none} text="Δοκίμασε μέρος του ονόματος." />
          : <Empty mark="0" title={t.rankings.empty}
              text="Η κατάταξη γεμίζει μόνη της με το πρώτο τελικό σκορ. Μέχρι τότε, δες πού πάει η περιοδεία."
              cta="Πρόγραμμα διοργανώσεων" to="/tournaments" />)}

        {!empty && (
          <Reveal className="card overflow-x-auto rounded-[18px]">
            <table className="w-full min-w-[720px] text-[14px]">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase tracking-[.12em] text-dim">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">{t.rankings.player}</th>
                  {cat === 'all' && <th className="px-3 py-3">Κατηγορίες</th>}
                  <th className="px-3 py-3 text-right">{t.rankings.tours}</th>
                  <th className="px-3 py-3 text-right">{t.table.gp}</th>
                  <th className="px-3 py-3 text-right">{t.table.wl}</th>
                  <th className="px-3 py-3 text-center">🥇</th>
                  <th className="px-4 py-3 text-right">{t.table.points}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className="border-t border-line hover:bg-white/[.03]">
                    <td className={cn('mono px-4 py-3 font-bold', medal(i))}>{i + 1}</td>
                    <td className="px-4 py-3">
                      <Link to={`/players/${r.id}`} className="font-semibold hover:text-orange">{r.name}</Link>
                      {r.city && <span className="ml-2 text-[12px] text-dim">{r.city}</span>}
                    </td>
                    {cat === 'all' && <td className="px-3 py-3 text-[12px] text-dim">{catsOf(r)}</td>}
                    <td className="mono px-3 py-3 text-right text-dim">{r.tournaments}</td>
                    <td className="mono px-3 py-3 text-right text-dim">{r.played}</td>
                    <td className="mono px-3 py-3 text-right">{r.wins}–{r.losses}</td>
                    <td className="px-3 py-3 text-center text-[13px]">{r.gold ? '🥇'.repeat(Math.min(r.gold, 3)) : r.silver ? '🥈' : r.bronze ? '🥉' : <span className="text-mute">—</span>}</td>
                    <td className="mono px-4 py-3 text-right text-[16px] font-extrabold">{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        )}
        <p className="mt-4 max-w-[720px] text-[12px] text-mute">{t.rankings.note}{(source === 'mock' || !data) ? ` · ${t.rankings.partial}` : ''}</p>
      </section>
    </>
  )
}
