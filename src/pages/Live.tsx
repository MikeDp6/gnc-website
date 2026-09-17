import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useData } from '@/data/store'
import { useI18n } from '@/i18n'
import { useMeta } from '@/lib/meta'
import { catColor } from '@/lib/categories'
import { Logo } from '@/components/layout/Logo'
import { Marquee } from '@/components/ui/Marquee'
import { cn } from '@/lib/cn'
import type { Match } from '@/data/types'

/**
 * Venue screen (/live or /live/:slug): one panel per court with the live game and its score, otherwise the next game
 * on that court; a marquee of what follows at the bottom. No nav, no footer — meant for a TV or projector at the venue.
 * Updates itself through the realtime subscription of the data store.
 */
export function Live() {
  const { slug } = useParams()
  const { t } = useI18n()
  const { tournaments, tournamentBySlug, matches, teamById, categoryById } = useData()
  const tour = (slug && tournamentBySlug(slug)) || tournaments.find(x => x.status === 'live') || tournaments.find(x => x.status !== 'done') || tournaments[0]
  const [now, setNow] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000 * 15); return () => clearInterval(id) }, [])
  useMeta(tour ? `Live · ${tour.name}` : 'Live')
  if (!tour) return null
  const all = matches.filter(m => m.tournamentId === tour.id)
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const today = ((): 1 | 2 => { const d0 = new Date(tour.startsAt); const diff = Math.round((new Date(now.toDateString()).getTime() - new Date(d0.toDateString()).getTime()) / 86400000); return diff >= 1 ? 2 : 1 })()
  const courts = Array.from({ length: tour.courts }, (_, i) => i + 1)
  const onCourt = (c: number): { m: Match; live: boolean } | null => {
    const live = all.find(m => m.court === c && m.status === 'live')
    if (live) return { m: live, live: true }
    const next = all.filter(m => m.court === c && m.status === 'scheduled' && (m.day > today || (m.day === today && m.time >= hhmm))).sort((a, b) => a.day - b.day || a.time.localeCompare(b.time))[0]
      ?? all.filter(m => m.court === c && m.status === 'scheduled').sort((a, b) => a.day - b.day || a.time.localeCompare(b.time))[0]
    return next ? { m: next, live: false } : null
  }
  const upcoming = all.filter(m => m.status === 'scheduled' && (m.day > today || (m.day === today && m.time >= hhmm))).sort((a, b) => a.day - b.day || a.time.localeCompare(b.time) || a.court - b.court).slice(0, 12)
  const name = (id?: string, label?: string) => teamById(id)?.name ?? label ?? 'TBD'
  const cols = tour.courts <= 1 ? 'grid-cols-1' : tour.courts === 2 ? 'grid-cols-2' : tour.courts <= 4 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <div className="flex h-[100svh] flex-col bg-bg text-ink">
      <header className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-5"><Logo height={56} /><div><div className="disp text-[34px] leading-none">{tour.name}</div><div className="text-[12px] font-bold uppercase tracking-[.16em] text-dim">{tour.venue} · {tour.days[today - 1]}</div></div></div>
        <div className="mono text-[44px] font-extrabold tabular-nums">{hhmm}</div>
      </header>
      <main className={cn('grid flex-1 gap-4 px-8 pb-4', cols)}>
        {courts.map(c => {
          const x = onCourt(c)
          const m = x?.m; const cat = m ? categoryById(m.categoryId) : undefined
          return (
            <section key={c} className={cn('glass relative flex flex-col justify-between overflow-hidden rounded-[24px] p-6', x?.live && 'border-orange/70')}>
              <div className="flex items-center justify-between text-[12px] font-extrabold uppercase tracking-[.16em]">
                <span className="text-dim">{t.live.court} {c}</span>
                {x?.live ? <span className="flex items-center gap-2 rounded-full bg-orange px-3 py-1 text-[#111]"><i className="live-dot h-2 w-2 rounded-full bg-[#111]" />LIVE</span>
                  : m ? <span className="rounded-full border border-line px-3 py-1 text-dim">{t.live.next} · {m.time}</span> : null}
              </div>
              {m ? (
                <div className="my-4 flex flex-1 flex-col justify-center gap-3">
                  {[[m.homeId, m.homeLabel, m.homeScore], [m.awayId, m.awayLabel, m.awayScore]].map(([id, label, score], i) => {
                    const fin = false; const s = typeof score === 'number' ? score : x?.live ? 0 : undefined
                    return (
                      <div key={i} className="flex items-center justify-between gap-6">
                        <span className={cn('disp truncate text-[clamp(28px,4vw,64px)] leading-none', !teamById(id as string) && 'text-dim')}>{name(id as string, label as string)}</span>
                        <b className={cn('mono text-[clamp(40px,6vw,96px)] font-extrabold leading-none tabular-nums', x?.live ? 'text-orange' : 'text-mute', fin && 'text-white')}>{s ?? '–'}</b>
                      </div>
                    )
                  })}
                </div>
              ) : <div className="my-4 flex flex-1 items-center justify-center text-[18px] text-dim">{t.live.noLive}</div>}
              {m && cat && <div className="flex items-center gap-3 text-[13px] font-bold uppercase tracking-[.1em] text-dim"><i className="h-3 w-3 rounded-full" style={{ background: catColor[cat.key] }} />{cat.name} · {m.label}</div>}
            </section>
          )
        })}
      </main>
      {upcoming.length > 0 && (
        <footer className="border-t border-line py-3 text-[15px] font-semibold uppercase tracking-[.04em]">
          <Marquee duration={Math.max(30, upcoming.length * 6)} gap={56}>
            {upcoming.map(m => <span key={m.id} className="whitespace-nowrap"><b className="mono text-orange">{m.time}</b> · {t.misc.courtShort}{m.court} · {categoryById(m.categoryId).short} · {name(m.homeId, m.homeLabel)} – {name(m.awayId, m.awayLabel)}</span>)}
          </Marquee>
        </footer>
      )}
    </div>
  )
}
