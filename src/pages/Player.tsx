import { useParams, Link } from 'react-router-dom'
import { useData } from '@/data/store'
import { useI18n } from '@/i18n'
import { useMeta } from '@/lib/meta'
import { Band } from '@/components/layout/Band'
import { Crumb } from '@/components/ui/Crumb'
import { Heading } from '@/components/ui/Heading'
import { Avatar } from '@/components/ui/Avatar'
import { Reveal } from '@/components/ui/Reveal'
import { Timeline } from '@/components/ui/Timeline'
import { MatchRow } from '@/components/match/MatchRow'
import { NotFound } from './NotFound'

export function Player() {
  const { id = '' } = useParams()
  const { t } = useI18n()
  const { matches, playerById, teamById, categoryById, tournaments, groups, loading } = useData()
  const p = playerById(id)
  const team = teamById(p?.teamId)
  const cat = team ? categoryById(team.categoryId) : undefined
  const tour = tournaments.find(x => x.id === team?.tournamentId) ?? tournaments.find(x => x.status !== 'done') ?? tournaments[0]
  useMeta(p?.name, team ? `${team.name} · ${cat?.name ?? ''}` : undefined, tour?.cover)
  if (!p) return loading ? <div className="wrap py-[120px] text-dim">{t.loading}</div> : <NotFound />
  const my = team ? matches.filter(m => m.homeId === team.id || m.awayId === team.id) : []
  const played = my.filter(m => m.status === 'final')
  const wins = team ? played.filter(m => (m.homeId === team.id ? (m.homeScore ?? 0) > (m.awayScore ?? 0) : (m.awayScore ?? 0) > (m.homeScore ?? 0))).length : 0
  const isCap = !!team && team.captainId === p.id
  const group = team ? groups.find(g => g.rows.some(r => r.teamId === team.id)) : undefined
  const row = group?.rows.find(r => r.teamId === team!.id)
  const [first, ...rest] = p.name.split(' ')

  return (
    <>
      <Crumb items={[{ label: t.player.kicker }, { label: p.name }]} />
      <Band kicker={`${t.player.kicker}${p.city ? ` · ${p.city}` : ''}${p.since ? ` · GNC ${p.since}` : ''}`} title={first} title2={rest.join(' ') || undefined} cover={tour?.cover}
        left={<Avatar name={p.name} tone="orange" size={132} className="border-4 border-white/15" />}
        sub={team ? `${isCap ? t.team.captain : t.team.player} · ${team.name} (${cat?.name})` : undefined}
        stats={[{ v: 1, l: t.player.participations }, { v: my.length, l: t.player.matches }, { v: wins, l: t.player.wins }]} />

      <section className="wrap grid gap-5 pt-[70px] lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="mb-[26px] flex items-end justify-between"><Heading a={t.player.myMatches1} b={t.player.myMatches2} size="md" />{tour && <Link to={`/tournaments/${tour.slug}`} className="text-[13px] font-bold uppercase tracking-[.08em] text-orange">{t.player.schedule}</Link>}</div>
          {my.map(m => <MatchRow key={m.id} m={m} mine showCategory={false} />)}
          {!my.length && <div className="card p-6 text-[14px] text-dim">{t.team.noNext}</div>}
          {team && (
            <>
              <div className="mb-[14px] mt-8 flex items-end justify-between"><Heading a={t.player.myTeam} size="sm" /><Link to={`/teams/${team.id}`} className="text-[13px] font-bold uppercase tracking-[.08em] text-orange">{t.player.teamPage}</Link></div>
              <Reveal>
                <Link to={`/teams/${team.id}`} className="card pop flex flex-wrap items-center gap-[22px] px-6 py-[22px]">
                  <Avatar name={team.name} tone="red" size={72} />
                  <div className="flex-1">
                    <div className="text-[22px] font-bold">{team.name}{isCap && <span className="ml-2 rounded-[5px] bg-orange px-[7px] py-[3px] align-[3px] text-[10px] font-extrabold tracking-[.12em] text-[#111]">{t.team.captain.toUpperCase()}</span>}</div>
                    <div className="mt-1 text-[12px] font-bold uppercase tracking-[.06em] text-dim">{cat?.name}{group ? ` · ${group.name}` : ''}{row ? ` · ${row.wins}–${row.losses}` : ''} · {tour?.name}</div>
                  </div>
                </Link>
              </Reveal>
            </>
          )}
        </div>
        <div className="flex flex-col gap-[14px]">
          <Reveal className="card border-dashed p-6">
            <h4 className="kicker mb-[14px]">{t.player.stats}</h4>
            <div className="text-[13px] text-dim">{t.player.statsSoon}</div>
          </Reveal>
        </div>
      </section>

      {tour && team && cat && (
        <section className="wrap pt-[70px]">
          <Heading a={t.player.history1} b={t.player.history2} size="md" className="mb-[26px]" />
          <Timeline items={[{ year: String(new Date(tour.startsAt).getFullYear()), month: tour.dates.split(' ').slice(-2, -1)[0]?.slice(0, 3).toUpperCase(), title: `${tour.name} · ${team.name} · ${cat.name}`, sub: row ? `${group!.name} · ${row.wins}–${row.losses}` : `${played.length} ${t.team.matches.toLowerCase()}`, result: tour.status === 'done' ? t.status.done : t.team.inProgress, tone: tour.status === 'done' ? 'plain' : 'live' }]} />
        </section>
      )}
    </>
  )
}
