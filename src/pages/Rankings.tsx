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
import type { PlayerRank, TeamRank } from '@/data/types'

const medal = (i: number) => i === 0 ? 'text-orange' : i === 1 ? 'text-cement' : i === 2 ? 'text-orange-soft' : 'text-dim'

/** All-time table across every tournament: 2 points per win, 1 per loss, plus a bonus for finishing 1st/2nd/3rd. */
export function Rankings() {
  const { t } = useI18n()
  const { tournaments, stats, source, matches, players, teamById, categories, categoryById } = useData()
  const [tab, setTab] = useState<'teams' | 'players'>('teams')
  const [data, setData] = useState<{ teams: TeamRank[]; players: PlayerRank[] } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [qs, setQs] = useState('')
  const [cat, setCat] = useState('all')
  useMeta(t.rankings.title1 + ' ' + t.rankings.title2, t.rankings.blurb, tournaments[0]?.cover)
  // The DB views (migration 009) hold every tournament ever; if they are not there yet — or the site is running
  // offline on the built-in data — the same table is computed from whatever the bundle already has.
  const local = useMemo(() => {
    const T = new Map<string, TeamRank>()
    const P = new Map<string, PlayerRank>()
    const add = (id: string | undefined, pf: number, pa: number) => {
      const team = teamById(id); if (!team) return
      const key = team.name.trim().toLowerCase()
      const e = T.get(key + '|' + team.categoryId) ?? { key: key + '|' + team.categoryId, name: team.name, teamId: team.id, categoryId: team.categoryId, tournaments: 0, played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, gold: 0, silver: 0, bronze: 0, points: 0 }
      e.played++; e.pointsFor += pf; e.pointsAgainst += pa
      if (pf > pa) e.wins++; else if (pf < pa) e.losses++
      e.points = e.wins * 2 + e.losses
      e.tournaments = 1
      T.set(key + '|' + team.categoryId, e)
      for (const pid of team.playerIds ?? []) {
        const pl = players.find(x => x.id === pid); if (!pl) continue
        const q = P.get(pid) ?? { id: pid, name: pl.name, city: pl.city, categoryId: team.categoryId, tournaments: 1, teams: 1, played: 0, wins: 0, losses: 0, gold: 0, silver: 0, bronze: 0, points: 0 }
        q.played++; if (pf > pa) q.wins++; else if (pf < pa) q.losses++
        q.points = q.wins * 2 + q.losses
        P.set(pid, q)
      }
    }
    for (const m of matches) {
      if (m.status !== 'final' || m.homeScore == null || m.awayScore == null) continue
      add(m.homeId, m.homeScore, m.awayScore)
      add(m.awayId, m.awayScore, m.homeScore)
    }
    const by = <T extends { points: number; wins: number },>(a: T, b: T) => b.points - a.points || b.wins - a.wins
    return { teams: [...T.values()].sort(by), players: [...P.values()].sort(by) }
  }, [matches, players, teamById])

  useEffect(() => {
    if (!supabase) return
    fetchRankings().then(r => setData(r.teams.length || r.players.length ? r : null)).catch(e => setErr((e as Error).message))
  }, [])
  const view = data ?? local
  // categories that actually appear in the table, in the order the site lists them
  const usedCats = useMemo(() => {
    const ids = new Set([...view.teams, ...view.players].map(r => r.categoryId).filter(Boolean) as string[])
    return categories.filter(c => ids.has(c.id))
  }, [view, categories])

  const rows = useMemo(() => {
    const list: Array<TeamRank | PlayerRank> = tab === 'teams' ? view.teams : view.players
    let out = list
    if (cat !== 'all') out = list.filter(r => r.categoryId === cat)
    else {
      // one row per team (or player) with every category added together
      const m = new Map<string, TeamRank | PlayerRank>()
      for (const r of list) {
        const id = 'key' in r ? (r as TeamRank).key.split('|')[0] : (r as PlayerRank).id
        const prev = m.get(id)
        if (!prev) { m.set(id, { ...r, ...('key' in r ? { key: id } : {}), categoryId: undefined } as TeamRank | PlayerRank); continue }
        prev.tournaments += r.tournaments; prev.played += r.played; prev.wins += r.wins; prev.losses += r.losses
        prev.gold += r.gold; prev.silver += r.silver; prev.bronze += r.bronze; prev.points += r.points
        if ('pointsFor' in prev && 'pointsFor' in r) { prev.pointsFor += r.pointsFor; prev.pointsAgainst += r.pointsAgainst }
      }
      out = [...m.values()]
    }
    const q = qs.trim().toLowerCase()
    if (q) out = out.filter(r => r.name.toLowerCase().includes(q))
    return [...out].sort((a, b) => b.points - a.points || b.wins - a.wins)
  }, [view, tab, qs, cat])
  const empty = rows.length === 0
  /** which categories an aggregated row is made of, for the «Όλες» column */
  const catsOf = (r: TeamRank | PlayerRank) => {
    const list: Array<TeamRank | PlayerRank> = tab === 'teams' ? view.teams : view.players
    const id = 'key' in r ? (r as TeamRank).key : (r as PlayerRank).id
    const mine = list.filter(x => ('key' in x ? (x as TeamRank).key.split('|')[0] : (x as PlayerRank).id) === id)
    const names = [...new Set(mine.map(x => x.categoryId).filter(Boolean))].map(cid => categoryById(cid!).short)
    return names.length ? names.join(' · ') : '—'
  }

  return (
    <>
      <Crumb items={[{ label: t.rankings.title1 }]} />
      <Band kicker={`${stats.teams} ${t.tour.teamsN} · ${stats.tournaments} ${t.rankings.tournaments} · ${t.rankings.since} ${stats.sinceYear}`}
        title={t.rankings.title1} title2={t.rankings.title2} cover={tournaments[0]?.cover} sub={t.rankings.blurb} />

      <section className="wrap pt-[50px]">
        <div className="glass z-20 mb-[22px] flex flex-col gap-3 rounded-[24px] px-4 py-3 md:sticky md:top-[86px] md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-y-2 md:rounded-[34px] md:px-5 md:py-[10px]">
          <div className="flex gap-2">
            <Chip active={tab === 'teams'} onClick={() => setTab('teams')}>{t.nav.teams}</Chip>
            <Chip active={tab === 'players'} onClick={() => setTab('players')}>{t.rankings.players}</Chip>
          </div>
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
          ? <Empty mark="?" title={t.rankings.none} text="Δοκίμασε μέρος του ονόματος — η αναζήτηση πιάνει ομάδες και παίκτες." />
          : <Empty mark="0" title={t.rankings.empty}
              text="Η κατάταξη γεμίζει μόνη της με το πρώτο τελικό σκορ. Μέχρι τότε, δες πού πάει η περιοδεία."
              cta="Πρόγραμμα διοργανώσεων" to="/tournaments" />)}

        {!empty && (
          <Reveal className="card overflow-x-auto rounded-[18px]">
            <table className="w-full min-w-[720px] text-[14px]">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase tracking-[.12em] text-dim">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">{tab === 'teams' ? t.table.team : t.rankings.player}</th>
                  {cat === 'all' && <th className="px-3 py-3">Κατηγορίες</th>}
                  <th className="px-3 py-3 text-right">{t.rankings.tours}</th>
                  <th className="px-3 py-3 text-right">{t.table.gp}</th>
                  <th className="px-3 py-3 text-right">{t.table.wl}</th>
                  <th className="px-3 py-3 text-center">🥇</th>
                  <th className="px-4 py-3 text-right">{t.table.points}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const isTeam = 'key' in r
                  const id = isTeam ? (r as TeamRank).teamId : (r as PlayerRank).id
                  const to = isTeam ? (id ? `/teams/${id}` : undefined) : `/players/${id}`
                  const name = <span className="font-semibold">{r.name}</span>
                  return (
                    <tr key={isTeam ? (r as TeamRank).key : (r as PlayerRank).id} className="border-t border-line hover:bg-white/[.03]">
                      <td className={cn('mono px-4 py-3 font-bold', medal(i))}>{i + 1}</td>
                      <td className="px-4 py-3">{to ? <Link to={to} className="hover:text-orange">{name}</Link> : name}{!isTeam && (r as PlayerRank).city && <span className="ml-2 text-[12px] text-dim">{(r as PlayerRank).city}</span>}</td>
                      {cat === 'all' && <td className="px-3 py-3 text-[12px] text-dim">{catsOf(r)}</td>}
                      <td className="mono px-3 py-3 text-right text-dim">{r.tournaments}</td>
                      <td className="mono px-3 py-3 text-right text-dim">{r.played}</td>
                      <td className="mono px-3 py-3 text-right">{r.wins}–{r.losses}</td>
                      <td className="px-3 py-3 text-center text-[13px]">{r.gold ? '🥇'.repeat(Math.min(r.gold, 3)) : r.silver ? '🥈' : r.bronze ? '🥉' : <span className="text-mute">—</span>}</td>
                      <td className="mono px-4 py-3 text-right text-[16px] font-extrabold">{r.points}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Reveal>
        )}
        <p className="mt-4 max-w-[720px] text-[12px] text-mute">{t.rankings.note}{(source === 'mock' || !data) ? ` · ${t.rankings.partial}` : ''}</p>
      </section>
    </>
  )
}
