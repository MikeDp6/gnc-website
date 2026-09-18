import { Link } from 'react-router-dom'
import { useData } from '@/data/store'
import { useI18n } from '@/i18n'
import { useMeta } from '@/lib/meta'
import { Heading } from '@/components/ui/Heading'
import { Crumb } from '@/components/ui/Crumb'
import { TourCard, type TourCardData } from '@/components/TourCard'
import { cn } from '@/lib/cn'

type Kind = 'live' | 'schedule' | 'registration' | 'soon' | 'done'

const STATE: Record<Kind, { label: string; cta: string; cls: string; badge?: string }> = {
  live: { label: 'Σε εξέλιξη', cta: 'Δες το live', cls: 'border-orange text-orange', badge: 'border-orange bg-orange text-[#111]' },
  schedule: { label: 'Πρόγραμμα έτοιμο', cta: 'Δες το πρόγραμμα', cls: 'border-white/35 text-white' },
  registration: { label: 'Ανοιχτές δηλώσεις', cta: 'Δήλωσε ομάδα', cls: 'border-blue bg-blue text-white' },
  soon: { label: 'Σύντομα', cta: 'Οι δηλώσεις δεν άνοιξαν ακόμη', cls: 'border-line text-dim' },
  done: { label: 'Ολοκληρώθηκε', cta: 'Αποτελέσματα', cls: 'border-line text-dim' },
}
const ORDER: Kind[] = ['live', 'registration', 'schedule', 'soon', 'done']

type Row = TourCardData & { kind: Kind }

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
    const kind: Kind = x.status === 'done' ? 'done'
      : live || x.status === 'live' ? 'live'
      : x.status === 'registration' ? 'registration'
      : mine.length > 0 ? 'schedule' : 'soon'
    const s = STATE[kind]
    return {
      key: x.id, name: x.name, city: x.city, dates: x.dates, venue: x.venue, cover: x.cover, poster: x.poster,
      startsAt: x.startsAt, countdown: kind === 'registration', kind,
      badge: { label: s.label, cls: s.badge ?? s.cls, live: kind === 'live' },
      cta: s.cta,
      stats: [
        { v: x.teamsCount, l: t.status.teams },
        { v: x.categoryIds.length, l: t.status.cats },
        ...(mine.length ? [{ v: mine.length, l: t.team.matches }] : []),
        { v: x.courts, l: t.status.courts },
      ],
      to: kind === 'registration' ? `/register?t=${x.slug}` : kind === 'soon' ? undefined : `/tournaments/${x.slug}`,
    }
  })

  // stops that are on the calendar but not yet set up in the system: shown, not clickable
  const known = new Set(tournaments.map(x => x.cityId).filter(Boolean))
  for (const e of season) {
    if (known.has(e.cityId)) continue
    const kind: Kind = e.done ? 'done' : 'soon'
    rows.push({
      key: 'season-' + e.id,
      name: e.label || `GNC 3on3 ${e.city || cityName(e.cityId) || ''}`.trim(),
      city: e.city || cityName(e.cityId) || '', dates: e.dates, venue: e.venue, poster: e.poster, kind,
      badge: { label: STATE[kind].label, cls: STATE[kind].cls },
      cta: STATE[kind].cta,
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
            <div className="flex flex-col gap-5">
              {list.map((r, i) => <TourCard key={r.key} d={r} delay={Math.min(i, 4) * 60} />)}
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
            Πρότεινε πόλη<span className="grid h-8 w-8 place-items-center rounded-full bg-[#111] text-[16px] text-white" aria-hidden>&rarr;</span>
          </Link>
        </div>
      </section>
    </>
  )
}
