import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useData } from '@/data/store'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/i18n'
import { useMeta } from '@/lib/meta'
import { fetchPlayerHistory, fetchPlayerPublic, fetchPlayerRank } from '@/lib/playerApi'
import { Band } from '@/components/layout/Band'
import { Crumb } from '@/components/ui/Crumb'
import { Heading } from '@/components/ui/Heading'
import { Avatar } from '@/components/ui/Avatar'
import { Reveal } from '@/components/ui/Reveal'
import { MatchRow } from '@/components/match/MatchRow'
import { HistoryList } from '@/components/PlayerHistory'
import { RankPanel } from '@/components/RankPanel'
import { NotFound } from './NotFound'
import type { PlayerHistoryRow, PlayerRank2 } from '@/data/types'

/** Public player page: photo, record across every tournament, the teams they played for, games today. */
export function Player() {
  const { id = '' } = useParams()
  const { t } = useI18n()
  const { session } = useAuth()
  const { matches, playerById, teamById, categoryById, tournaments, groups, loading } = useData()
  const [hist, setHist] = useState<PlayerHistoryRow[] | null>(null)
  const [rank, setRank] = useState<PlayerRank2>({ byCategory: [] })
  const [remote, setRemote] = useState<{ display_name: string; nickname: string | null; city: string | null; since_year: number | null; avatar_url: string | null } | null>(null)
  const bundled = playerById(id)

  useEffect(() => {
    let alive = true
    fetchPlayerHistory(id).then(h => alive && setHist(h))
    fetchPlayerRank(id).then(r => alive && setRank(r)).catch(() => {})
    if (!bundled) fetchPlayerPublic(id).then(p => alive && setRemote(p as never))
    return () => { alive = false }
  }, [id, bundled])

  const name = bundled?.name ?? remote?.display_name
  const nickname = bundled?.nickname ?? remote?.nickname ?? undefined
  const city = bundled?.city ?? remote?.city ?? undefined
  const avatar = bundled?.avatar ?? remote?.avatar_url ?? undefined
  useMeta(name, city ? `${city} · GNC 3on3` : undefined)

  if (!name) {
    if (loading || (hist === null && !remote)) return <div className="wrap py-[120px] text-dim">{t.loading}</div>
    return <NotFound />
  }

  const team = teamById(bundled?.teamId)
  const cat = team ? categoryById(team.categoryId) : undefined
  const tour = tournaments.find(x => x.id === team?.tournamentId) ?? tournaments.find(x => x.status !== 'done') ?? tournaments[0]
  const my = team ? matches.filter(m => m.homeId === team.id || m.awayId === team.id) : []
  const group = team ? groups.find(g => g.rows.some(r => r.teamId === team.id)) : undefined
  const row = group?.rows.find(r => r.teamId === team!.id)
  const isCap = !!team && team.captainId === id
  const H = hist ?? []
  const totals = H.reduce((a, h) => ({ w: a.w + h.wins, l: a.l + h.losses, g: a.g + (h.place === 1 ? 1 : 0) }), { w: 0, l: 0, g: 0 })
  const tourCount = new Set(H.map(h => h.tournamentId)).size
  const teamNames = [...new Set(H.map(h => h.team))]
  const [first, ...rest] = name.split(' ')

  return (
    <>
      <Crumb items={[{ label: t.player.kicker }, { label: name }]} />
      <Band kicker={[t.player.kicker, city, bundled?.since ?? remote?.since_year ? `GNC ${bundled?.since ?? remote?.since_year}` : null].filter(Boolean).join(' · ')}
        title={first} title2={rest.join(' ') || undefined} cover={tour?.cover}
        left={avatar
          ? <img src={avatar} alt="" className="h-[132px] w-[132px] rounded-full border-4 border-white/15 object-cover" />
          : <Avatar name={name} tone="orange" size={132} className="border-4 border-white/15" />}
        sub={nickname ? `«${nickname}»` : team ? `${isCap ? t.team.captain : t.team.player} · ${team.name}${cat ? ` (${cat.name})` : ''}` : undefined}
        stats={[{ v: tourCount || '—', l: t.player.participations }, { v: `${totals.w}–${totals.l}`, l: t.team.wl }, ...(totals.g ? [{ v: totals.g, l: t.account.titles, accent: '#FF8700' }] : [])]} />

      <section className="wrap grid gap-5 pt-[60px] lg:grid-cols-[1.3fr_1fr]">
        <div>
          <Heading a={t.player.history1} b={t.player.history2} size="md" className="mb-5" />
          {hist === null ? <div className="card p-6 text-[14px] text-dim">{t.loading}</div> : <HistoryList rows={H} empty={t.player.noHistory} />}

          {my.length > 0 && (
            <>
              <div className="mb-5 mt-10 flex items-end justify-between">
                <Heading a={t.player.myMatches1} b={tour?.city ?? ''} size="sm" />
                {tour && <Link to={`/tournaments/${tour.slug}`} className="text-[13px] font-bold uppercase tracking-[.08em] text-orange">{t.player.schedule}</Link>}
              </div>
              {my.map(m => <MatchRow key={m.id} m={m} showCategory={false} />)}
            </>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {team && (
            <Reveal className="card p-6">
              <h4 className="kicker mb-4">{t.player.myTeam}</h4>
              <Link to={`/teams/${team.id}`} className="flex items-center gap-4 hover:text-orange">
                <Avatar name={team.name} tone="red" size={56} />
                <div>
                  <div className="text-[18px] font-bold">{team.name}</div>
                  <div className="mt-1 text-[12px] font-bold uppercase tracking-[.06em] text-dim">{cat?.name}{group ? ` · ${group.name}` : ''}{row ? ` · ${row.wins}–${row.losses}` : ''}</div>
                </div>
              </Link>
            </Reveal>
          )}
          {teamNames.length > 0 && (
            <Reveal className="card p-6" delay={60}>
              <h4 className="kicker mb-3">{t.player.teamsPlayed}</h4>
              <div className="flex flex-wrap gap-2">
                {teamNames.map(n => <span key={n} className="rounded-full border border-line px-3 py-[6px] text-[13px] font-semibold">{n}</span>)}
              </div>
            </Reveal>
          )}
          {(rank.overall || rank.byCategory.length)
            ? <Reveal delay={120}><RankPanel rank={rank} title={t.rankings.title1} /></Reveal>
            : (
              <Reveal className="card p-6" delay={120}>
                <h4 className="kicker mb-3">{t.rankings.title1}</h4>
                <p className="text-[13px] text-dim">{t.player.rankHint}</p>
                <Link to="/rankings" className="mt-3 inline-block text-[13px] font-bold uppercase tracking-[.08em] text-orange">{t.rankings.title1} →</Link>
              </Reveal>
            )}
          {!session && (
            <Reveal className="card border-dashed p-6" delay={180}>
              <h4 className="kicker mb-3">{t.account.isThisYou}</h4>
              <p className="text-[13px] text-dim">{t.account.claimHelp}</p>
              <Link to="/login" className="mt-3 inline-block text-[13px] font-bold uppercase tracking-[.08em] text-orange">{t.account.signIn} →</Link>
            </Reveal>
          )}
        </div>
      </section>
    </>
  )
}
