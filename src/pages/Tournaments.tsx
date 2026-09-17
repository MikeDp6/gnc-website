import { Link } from 'react-router-dom'
import { useData } from '@/data/store'
import { useI18n } from '@/i18n'
import { useMeta } from '@/lib/meta'
import { Heading } from '@/components/ui/Heading'
import { Crumb } from '@/components/ui/Crumb'
import { Reveal } from '@/components/ui/Reveal'
import { Photo } from '@/components/ui/Photo'
import { Countdown } from '@/components/ui/Countdown'
import { cn } from '@/lib/cn'

type Row = {
  key: string
  name: string
  city: string
  dates: string
  venue: string
  cover?: string
  teams?: number
  cats?: number
  startsAt?: string
  /** what a visitor can do with it right now */
  kind: 'live' | 'schedule' | 'registration' | 'soon' | 'done'
  to?: string
}

const STATE: Record<Row['kind'], { label: string; cta: string; cls: string; badge?: string }> = {
  live: { label: 'Σε εξέλιξη', cta: 'Δες το live', cls: 'border-orange text-orange', badge: 'border-orange bg-orange text-[#111]' },
  schedule: { label: 'Πρόγραμμα έτοιμο', cta: 'Δες το πρόγραμμα', cls: 'border-white/35 text-white' },
  registration: { label: 'Ανοιχτές δηλώσεις', cta: 'Δήλωσε ομάδα', cls: 'border-blue bg-blue text-white' },
  soon: { label: 'Σύντομα', cta: 'Οι δηλώσεις δεν άνοιξαν ακόμη', cls: 'border-line text-dim' },
  done: { label: 'Ολοκληρώθηκε', cta: 'Αποτελέσματα', cls: 'border-line text-dim' },
}
const ORDER: Row['kind'][] = ['live', 'registration', 'schedule', 'soon', 'done']

/**
 * The programme page: the tour, one card per stop, instead of one tournament's timetable.
 * What a card does depends on where the stop is: a live one opens its timetable, one with the
 * entry list open goes straight to the form, and a date that is only pencilled in is not a link
 * at all — there is nothing behind it yet.
 */
export function Tournaments() {
  const { tournaments, season, matches, cities } = useData()
  const { t } = useI18n()
  useMeta('Πρόγραμμα διοργανώσεων', 'Όλες οι στάσεις της περιοδείας GNC 3on3: πρόγραμμα αγώνων, ανοιχτές δηλώσεις συμμετοχής και αποτελέσματα.')

  const cityName = (id?: string) => cities.find(c => c.id === id)?.name
  const rows: Row[] = tournaments.map(x => {
    const mine = matches.filter(m => m.tournamentId === x.id)
    const live = mine.some(m => m.status === 'live')
    const kind: Row['kind'] = x.status === 'done' ? 'done'
      : live || x.status === 'live' ? 'live'
      : x.status === 'registration' ? 'registration'
      : mine.length > 0 ? 'schedule' : 'soon'
    return {
      key: x.id, name: x.name, city: x.city, dates: x.dates, venue: x.venue, cover: x.cover,
      teams: x.teamsCount, cats: x.categoryIds.length, startsAt: x.startsAt, kind,
      to: kind === 'registration' ? `/register?t=${x.slug}` : kind === 'soon' ? undefined : `/tournaments/${x.slug}`,
    }
  })

  // stops that are on the calendar but not yet set up in the system: shown, not clickable
  const known = new Set(tournaments.map(x => x.cityId).filter(Boolean))
  for (const e of season) {
    if (known.has(e.cityId)) continue
    rows.push({
      key: 'season-' + e.id, name: e.label || `GNC 3on3 ${e.city || cityName(e.cityId) || ''}`.trim(),
      city: e.city || cityName(e.cityId) || '', dates: e.dates, venue: e.venue,
      kind: e.done ? 'done' : 'soon',
      to: e.done && e.cityId ? `/cities/${e.cityId}` : undefined,
    })
  }

  const groups = ORDER.map(k => [k, rows.filter(r => r.kind === k)] as const).filter(([, r]) => r.length)
  const openNow = rows.filter(r => r.kind === 'live' || r.kind === 'registration' || r.kind === 'schedule').length

  return (
    <>
      <Crumb items={[{ label: 'Πρόγραμμα' }]} />
      <section className="wrap pt-6">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <Heading a="Πρόγραμμα" b="διοργανώσεων" as="h1" />
            <p className="mt-4 max-w-[560px] text-[16px] text-dim">
              Κάθε στάση της περιοδείας με τη σειρά της. Όπου το πρόγραμμα έχει ανέβει, το ανοίγεις από εδώ·
              όπου οι δηλώσεις είναι ανοιχτές, δηλώνεις ομάδα· οι υπόλοιπες ημερομηνίες είναι κλεισμένες και περιμένουν.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <div className="glass min-w-[112px] rounded-[16px] px-[18px] py-[14px]"><b className="disp block text-[40px] leading-none text-orange">{openNow}</b><span className="mt-1 block text-[11px] font-bold uppercase tracking-[.12em] text-dim">Ανοιχτές τώρα</span></div>
            <div className="glass min-w-[112px] rounded-[16px] px-[18px] py-[14px]"><b className="disp block text-[40px] leading-none">{rows.length}</b><span className="mt-1 block text-[11px] font-bold uppercase tracking-[.12em] text-dim">Στάσεις</span></div>
          </div>
        </div>

        {groups.map(([kind, list]) => (
          <div key={kind} className="mt-12">
            <div className="mb-4 flex items-center gap-3">
              <span className={cn('rounded-full border px-3 py-[6px] text-[11px] font-extrabold uppercase tracking-[.12em]', STATE[kind].cls)}>{STATE[kind].label}</span>
              <span className="h-px flex-1 bg-line" />
              <span className="text-[12px] text-mute">{list.length}</span>
            </div>
            <div className="flex flex-col gap-3">
              {list.map((r, i) => <Card key={r.key} r={r} delay={Math.min(i, 4) * 50} loading={t.loading} />)}
            </div>
          </div>
        ))}

        {!rows.length && <div className="card mt-10 p-8 text-dim">{t.loading}</div>}

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 rounded-band border border-dashed border-line px-6 py-6">
          <div>
            <div className="disp text-[28px]">Δεν βλέπεις την πόλη σου;</div>
            <p className="mt-1 text-[14px] text-dim">Η περιοδεία κλείνει ημερομηνίες όλη τη χρονιά. Πες μας πού θέλεις να έρθουμε.</p>
          </div>
          <Link to="/contact" className="pop inline-flex items-center gap-3 rounded-full bg-white py-[6px] pl-5 pr-[6px] text-[13px] font-bold uppercase tracking-[.06em] text-[#111]">
            Πρότεινε πόλη<span className="grid h-8 w-8 place-items-center rounded-full bg-[#111] text-[16px] text-white" aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </>
  )
}

function Card({ r, delay }: { r: Row; delay: number; loading: string }) {
  const s = STATE[r.kind]
  const inner = (
    <>
      {/* photo on the left, a strip on a phone */}
      <div className="relative h-[96px] w-full shrink-0 overflow-hidden sm:h-auto sm:w-[180px] md:w-[230px]">
        <Photo src={r.cover} alt={r.name} sizes="(min-width:768px) 230px, 100vw"
          className={cn('transition-transform duration-700', r.to && 'group-hover:scale-[1.05]')} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,11,.1),rgba(10,10,11,.75))] sm:bg-[linear-gradient(90deg,rgba(10,10,11,.15),rgba(10,10,11,.8))]" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:gap-6 md:py-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-[.12em] text-orange">{r.city}</span>
            <span className={cn('rounded-full border px-[10px] py-[3px] text-[10px] font-extrabold uppercase tracking-[.12em]', s.badge ?? s.cls)}>
              {r.kind === 'live' && <i className="live-dot mr-[6px] inline-block h-[6px] w-[6px] rounded-full bg-[#111] align-middle" />}{s.label}
            </span>
          </div>
          <div className="mt-[6px] truncate text-[19px] font-bold leading-tight md:text-[21px]">{r.name}</div>
          <div className="mt-[6px] text-[13px] text-dim">{r.dates}{r.venue ? ` · ${r.venue}` : ''}</div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-1 text-[12px] text-mute md:justify-end">
          {!!r.teams && <span><b className="mono text-[15px] text-white">{r.teams}</b> ομάδες</span>}
          {!!r.cats && <span><b className="mono text-[15px] text-white">{r.cats}</b> κατηγορίες</span>}
          {r.kind === 'registration' && r.startsAt && <span className="mono text-[13px] text-blue"><Countdown to={r.startsAt} /></span>}
        </div>

        <div className={cn('flex shrink-0 items-center gap-2 border-t border-line pt-3 text-[12px] font-bold uppercase tracking-[.08em] md:w-[230px] md:justify-end md:border-l md:border-t-0 md:pl-6 md:pt-0',
          r.to ? 'text-orange' : 'text-mute')}>
          <span className="md:text-right">{s.cta}</span>
          {r.to && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-orange text-[15px] transition-colors group-hover:bg-orange group-hover:text-[#111]" aria-hidden>→</span>}
        </div>
      </div>
    </>
  )
  const base = 'card flex w-full flex-col overflow-hidden rounded-[18px] sm:flex-row sm:items-stretch'
  return (
    <Reveal delay={delay}>
      {r.to
        ? <Link to={r.to} className={cn(base, 'pop group', r.kind === 'live' && 'border-orange/60', r.kind === 'registration' && 'border-blue/60')}>{inner}</Link>
        : <div className={cn(base, 'opacity-70')} aria-disabled>{inner}</div>}
    </Reveal>
  )
}
