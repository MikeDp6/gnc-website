import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { useMeta } from '@/lib/meta'
import { useData } from '@/data/store'
import { fetchRankings } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Band } from '@/components/layout/Band'
import { Crumb } from '@/components/ui/Crumb'
import { Chip } from '@/components/ui/Chip'
import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/cn'
import type { PlayerRank, TeamRank } from '@/data/types'

const medal = (i: number) => i === 0 ? 'text-orange' : i === 1 ? 'text-cement' : i === 2 ? 'text-orange-soft' : 'text-dim'

/** All-time table across every tournament: 2 points per win, 1 per loss, plus a bonus for finishing 1st/2nd/3rd. */
export function Rankings() {
  const { t } = useI18n()
  const { tournaments, stats, source, matches, players, teamById } = useData()
  const [tab, setTab] = useState<'teams' | 'players'>('teams')
  const [data, setData] = useState<{ teams: TeamRank[]; players: PlayerRank[] } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [qs, setQs] = useState('')
  useMeta(t.rankings.title1 + ' ' + t.rankings.title2, t.rankings.blurb, tournaments[0]?.cover)
  // The DB views (migration 009) hold every tournament ever; if they are not there yet — or the site is running
  // offline on the built-in data — the same table is computed from whatever the bundle already has.
  const local = useMemo(() => {
    const T = new Map<string, TeamRank>()
    const P = new Map<string, PlayerRank>()
    const add = (id: string | undefined, pf: number, pa: number) => {
      const team = teamById(id); if (!team) return
      const key = team.name.trim().toLowerCase()
      const e = T.get(key) ?? { key, name: team.name, teamId: team.id, tournaments: 0, played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, gold: 0, silver: 0, bronze: 0, points: 0 }
      e.played++; e.pointsFor += pf; e.pointsAgainst += pa
      if (pf > pa) e.wins++; else if (pf < pa) e.losses++
      e.points = e.wins * 2 + e.losses
      e.tournaments = 1
      T.set(key, e)
      for (const pid of team.playerIds ?? []) {
        const pl = players.find(x => x.id === pid); if (!pl) continue
        const q = P.get(pid) ?? { id: pid, name: pl.name, city: pl.city, tournaments: 1, teams: 1, played: 0, wins: 0, losses: 0, gold: 0, silver: 0, bronze: 0, points: 0 }
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
  const rows = useMemo(() => {
    const q = qs.trim().toLowerCase()
    const list: Array<TeamRank | PlayerRank> = tab === 'teams' ? view.teams : view.players
    return q ? list.filter(r => r.name.toLowerCase().includes(q)) : list
  }, [view, tab, qs])
  const empty = rows.length === 0

  return (
    <>
      <Crumb items={[{ label: t.rankings.title1 }]} />
      <Band kicker={`${stats.teams} ${t.tour.teamsN} · ${stats.tournaments} ${t.rankings.tournaments} · ${t.rankings.since} ${stats.sinceYear}`}
        title={t.rankings.title1} title2={t.rankings.title2} cover={tournaments[0]?.cover} sub={t.rankings.blurb} />

      <section className="wrap pt-[50px]">
        <div className="glass z-20 mb-[22px] flex flex-col gap-3 rounded-[20px] px-4 py-3 md:sticky md:top-[86px] md:flex-row md:items-center md:justify-between md:rounded-full md:px-5">
          <div className="flex gap-2">
            <Chip active={tab === 'teams'} onClick={() => setTab('teams')}>{t.nav.teams}</Chip>
            <Chip active={tab === 'players'} onClick={() => setTab('players')}>{t.rankings.players}</Chip>
          </div>
          <input value={qs} onChange={e => setQs(e.target.value)} placeholder={t.rankings.search}
            className="w-full rounded-full border border-white/15 bg-black/25 px-4 py-[9px] text-[14px] outline-none placeholder:text-mute focus:border-white/35 md:w-[280px]" />
        </div>

        {err && <div className="card mb-4 p-5 text-[14px] text-dim">{t.rankings.soon}</div>}
        {empty && <div className="card p-8 text-[14px] text-dim">{qs ? t.rankings.none : t.rankings.empty}</div>}

        {!empty && (
          <Reveal className="card overflow-x-auto rounded-[18px]">
            <table className="w-full min-w-[720px] text-[14px]">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase tracking-[.12em] text-dim">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">{tab === 'teams' ? t.table.team : t.rankings.player}</th>
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
