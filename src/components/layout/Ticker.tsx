import { useMemo } from 'react'
import { Marquee } from '@/components/ui/Marquee'
import { useData } from '@/data/store'
import { useI18n } from '@/i18n'
import type { TickerItem } from '@/data/types'

const L = {
  el: { live: 'LIVE', now: 'ΤΩΡΑ', next: 'ΕΠΟΜΕΝΟ', entries: 'ΔΗΛΩΣΕΙΣ', schedule: 'ΠΡΟΓΡΑΜΜΑ', open: 'ανοιχτές δηλώσεις', posted: 'το πρόγραμμα αναρτήθηκε' },
  en: { live: 'LIVE', now: 'NOW', next: 'NEXT', entries: 'ENTRIES', schedule: 'SCHEDULE', open: 'entries open', posted: 'schedule published' },
}

/**
 * The strip writes itself. What is live, which stop is running or comes next, where entries are
 * open and whose schedule has gone up all come from the data — nobody retypes them. Whatever the
 * admin adds by hand rides along after, for the things the data cannot know.
 */
export function Ticker({ overlay = false }: { overlay?: boolean }) {
  const { ticker, tournaments, matches, teams, categoryById } = useData()
  const { lang } = useI18n()

  const auto = useMemo<TickerItem[]>(() => {
    const w = L[lang === 'en' ? 'en' : 'el']
    const out: TickerItem[] = []
    const nameOf = (id?: string) => teams.find(x => x.id === id)?.name

    // a match actually running right now beats everything else
    const live = matches.find(m => m.status === 'live')
    if (live) {
      const home = nameOf(live.homeId) ?? live.homeLabel ?? '—'
      const away = nameOf(live.awayId) ?? live.awayLabel ?? '—'
      const cat = categoryById(live.categoryId)
      out.push({ tag: w.live, text: `${cat.short} · ${home} – ${away}`, tone: 'orange' })
    }

    // the stop that is running, else the next one on the calendar
    const running = tournaments.find(x => x.status === 'live')
      ?? tournaments.find(x => matches.some(m => m.tournamentId === x.id && m.status === 'live'))
    const upcoming = tournaments
      .filter(x => x.status !== 'done' && x.startsAt && +new Date(x.startsAt) >= Date.now() - 864e5)
      .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))[0]
    const headline = running ?? upcoming
    if (headline) {
      out.push({
        tag: running ? w.now : w.next,
        text: `${headline.name} · ${headline.dates}`,
        tone: running ? 'orange' : 'blue',
      })
    }

    // where someone can still declare a team
    for (const x of tournaments.filter(x => x.status === 'registration')) {
      out.push({ tag: w.entries, text: `${x.name} · ${w.open}`, tone: 'blue' })
    }

    // schedules that have gone up, for stops that have not started yet
    for (const x of tournaments) {
      if (x.id === running?.id || x.status === 'done' || x.status === 'registration') continue
      // μια διοργάνωση που κρατάει το αναλυτικό πρόγραμμα εκτός site δεν το διαφημίζει κιόλας
      if (x.schedulePublic === false) continue
      if (matches.some(m => m.tournamentId === x.id)) out.push({ tag: w.schedule, text: `${x.name} · ${w.posted}`, tone: 'blue' })
    }

    return out
  }, [tournaments, matches, teams, categoryById, lang])

  const manual = ticker.map(it => ({ ...it, text: lang === 'en' && it.textEn ? it.textEn : it.text }))
  const items = [...auto, ...manual]
  if (!items.length) return null

  return (
    <div className={(overlay ? 'absolute left-0 right-0 top-0 z-20 border-b border-white/10 bg-black/30 backdrop-blur-sm ' : 'border-b border-line ') + 'py-[9px] text-[12px] font-semibold uppercase tracking-[.06em]'}>
      <Marquee duration={45} gap={44} className="wrap">
        {items.map((it, i) => (
          <span key={i} className="whitespace-nowrap">
            <b className={it.tone === 'orange' ? 'text-orange' : 'text-blue'}>{it.tag}:</b>&nbsp;&nbsp;{it.text}
          </span>
        ))}
      </Marquee>
    </div>
  )
}
