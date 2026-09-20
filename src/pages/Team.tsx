import { useParams, Link } from 'react-router-dom'
import { useData } from '@/data/store'
import { catColor } from '@/lib/categories'
import { useI18n } from '@/i18n'
import { useMeta } from '@/lib/meta'
import { Band } from '@/components/layout/Band'
import { Crumb } from '@/components/ui/Crumb'
import { Heading } from '@/components/ui/Heading'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Reveal } from '@/components/ui/Reveal'
import { Timeline, type TimelineItem } from '@/components/ui/Timeline'
import { MatchRow } from '@/components/match/MatchRow'
import { StandingsTable } from '@/components/standings/StandingsTable'
import { NotFound } from './NotFound'

export function Team() {
  const { id = '' } = useParams()
  const { t } = useI18n()
  const { categoryById, groups, matches, playerById, teamById, tournaments, loading } = useData()
  const team = teamById(id)
  const tour = tournaments.find(x => x.id === team?.tournamentId) ?? tournaments.find(x => x.status !== 'done') ?? tournaments[0]
  const cat = team ? categoryById(team.categoryId) : undefined
  useMeta(team?.name, team && cat ? `${cat.name} · ${tour?.name ?? ''}` : undefined, tour?.cover)
  if (!team || !cat || !tour) return loading ? <div className="wrap py-[120px] text-dim">{t.loading}</div> : <NotFound />
  const my = matches.filter(m => m.homeId === team.id || m.awayId === team.id)
  const next = my.find(m => m.status === 'live') ?? my.find(m => m.status === 'scheduled')
  const played = my.filter(m => m.status === 'final')
  const group = groups.find(g => g.rows.some(r => r.teamId === team.id))
  const row = group?.rows.find(r => r.teamId === team.id)
  const pos = group ? group.rows.findIndex(r => r.teamId === team.id) + 1 : undefined
  const captain = playerById(team.captainId)
  const roster = (team.playerIds ?? []).map(pid => playerById(pid)).filter((p): p is NonNullable<typeof p> => !!p)
  const [a, ...rest] = team.name.split(' ')
  const koMatch = my.find(m => m.phase !== 'group')
  const history: TimelineItem[] = [{
    year: String(new Date(tour.startsAt).getFullYear()), month: tour.dates.split(' ').slice(-2, -1)[0]?.slice(0, 3).toUpperCase(),
    title: `${tour.name} · ${cat.name}`,
    sub: row ? `${pos}η ${group!.name} · ${row.wins}–${row.losses}${row.qualifies ? ` · ${t.team.qualified}` : ''}` : `${played.length} ${t.team.matches.toLowerCase()}`,
    result: tour.status === 'done' ? (koMatch?.phase === 'final' && koMatch.status === 'final' ? koMatch.label : t.status.done) : t.team.inProgress, tone: tour.status === 'done' ? 'plain' : 'live',
  }]

  return (
    <>
      <Crumb items={[{ label: t.nav.teams }, { label: tour.name, to: `/tournaments/${tour.slug}` }, { label: cat.name }, { label: team.name }]} />
      <Band kicker={<><i className="mr-2 inline-block h-[10px] w-[10px] rounded-full align-[-1px]" style={{ background: catColor[cat.key] }} />{cat.name}{group ? ` · ${group.name}` : ''} · {tour.name}</>}
        title={a} title2={rest.join(' ') || undefined} cover={tour.cover}
        sub={[team.city, captain ? `${t.team.captain}: ${captain.name}` : null].filter(Boolean).join(' · ') || undefined}
        />

      <section className="wrap pt-[70px]">
        <div className="mb-[26px] flex items-end justify-between"><Heading a={t.team.next1} b={t.team.next2} size="md" /><Link to={`/tournaments/${tour.slug}`} className="text-[13px] font-bold uppercase tracking-[.08em] text-orange">{t.team.allMatches} →</Link></div>
        <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
          {next ? (
            <Reveal className={`flex min-h-[220px] flex-col justify-between rounded-[20px] p-[26px] text-white ${next.status === 'live' ? 'bg-orange text-[#111]' : 'bg-blue'}`}>
              <div>
                <div className="text-[12px] font-extrabold uppercase tracking-[.16em] opacity-85">{next.status === 'live' ? '● LIVE · ' : ''}{next.label} · {next.day === 1 ? tour.days[0] : tour.days[1]} {next.time} · {t.misc.court} {next.court}</div>
                <div className="disp my-2 text-[44px] md:text-[64px]">{teamById(next.homeId)?.name ?? next.homeLabel} <span className="opacity-60">vs</span> {teamById(next.awayId)?.name ?? next.awayLabel}</div>
                {next.status === 'live' ? <div className="mono text-[40px] font-extrabold">{next.homeScore ?? 0} – {next.awayScore ?? 0}</div> : <div className="text-[14px] opacity-90">{t.team.notify}</div>}
              </div>
              <div className="mt-[22px] flex flex-wrap gap-[10px]"><Button variant="white" to={`/tournaments/${tour.slug}`}>{t.team.bracket}</Button></div>
            </Reveal>
          ) : <div className="card p-8 text-dim">{t.team.noNext}</div>}
          <Reveal className="card p-6" delay={80}>
            <h4 className="kicker mb-[14px]">{t.team.theTeam}</h4>
            {[[t.team.category, cat.name], [t.team.city, team.city ?? '—'], [t.team.group, group?.name ?? '—'], [t.team.captain, captain?.name ?? '—'], [t.team.matches, `${played.length} / ${my.length}`]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-t border-line py-[11px] text-[14px]"><span className="text-dim">{k}</span><b className="text-right font-semibold">{v}</b></div>
            ))}
          </Reveal>
        </div>
      </section>

      {my.length > 0 && (
        <section className="wrap pt-[70px]">
          <Heading a={t.team.matches} b={tour.city} size="md" className="mb-[26px]" />
          {my.map(m => <MatchRow key={m.id} m={m} mine showCategory={false} />)}
        </section>
      )}

      <section className="wrap grid gap-5 pt-[70px] lg:grid-cols-2">
        {group && <Reveal><StandingsTable g={{ ...group, note: t.team.legend }} meId={team.id} subtitle={`${cat.name} · ${tour.city}`} /></Reveal>}
        <div>
          <div className="mb-[14px] flex items-end justify-between"><Heading a={t.team.roster} size="sm" /></div>
          {roster.length ? (
            <div className="grid gap-[14px] sm:grid-cols-2">
              {roster.map((p, i) => {
                const isCap = p.id === team.captainId
                return (
                  <Reveal key={p.id} delay={i * 60}>
                    <Link to={`/players/${p.id}`} className="card pop flex items-center gap-4 p-5">
                      <Avatar name={p.name} tone={isCap ? 'orange' : 'blue'} />
                      <div>
                        <div className="text-[17px] font-bold">{p.name}{isCap && <span className="ml-2 rounded-[5px] bg-orange px-[7px] py-[3px] align-[2px] text-[10px] font-extrabold tracking-[.12em] text-[#111]">{t.team.captain.toUpperCase()}</span>}</div>
                        <div className="mt-1 text-[12px] font-bold uppercase tracking-[.06em] text-dim">{isCap ? t.team.captain : t.team.player}{p.city ? ` · ${p.city}` : ''}</div>
                      </div>
                    </Link>
                  </Reveal>
                )
              })}
            </div>
          ) : <div className="card p-6 text-[14px] text-dim">{t.team.noRoster}</div>}
        </div>
      </section>

      <section className="wrap pt-[70px]">
        <Heading a={t.team.history1} b={t.team.history2} size="md" className="mb-[26px]" />
        <Timeline items={history} />
      </section>
    </>
  )
}
