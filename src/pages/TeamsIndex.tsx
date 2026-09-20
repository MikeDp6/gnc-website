import { useData } from '@/data/store'
import { useMeta } from '@/lib/meta'
import { Heading } from '@/components/ui/Heading'
import { Crumb } from '@/components/ui/Crumb'
import { Empty } from '@/components/ui/Empty'
import { TourCard, type TourCardData } from '@/components/TourCard'

/**
 * Teams, one stop at a time. The menu used to jump straight into the next tournament's team
 * list, which stops making sense the moment there is more than one stop with entries. Same
 * cards as the programme page; the button goes to that tournament's Ομάδες tab.
 */
export function TeamsIndex() {
  const { tournaments, teams, matches } = useData()
  useMeta('Ομάδες', 'Οι ομάδες κάθε διοργάνωσης GNC 3on3, ανά κατηγορία.')

  const listed = tournaments
    .map(x => {
      const mine = teams.filter(y => y.tournamentId === x.id)
      const count = mine.length || x.teamsCount
      const live = x.status === 'live' || matches.some(m => m.tournamentId === x.id && m.status === 'live')
      return { x, count, live }
    })
    .filter(r => r.count > 0)
    .sort((a, b) => (b.live ? 1 : 0) - (a.live ? 1 : 0) || +new Date(b.x.startsAt) - +new Date(a.x.startsAt))
  const total = listed.reduce((a, r) => a + r.count, 0)
  const rows: TourCardData[] = listed
    .map(({ x, live }) => ({
      key: x.id, name: x.name, city: x.city, dates: x.dates, venue: x.venue, cover: x.cover, poster: x.poster, startsAt: x.startsAt,
      badge: live
        ? { label: 'Σε εξέλιξη', cls: 'border-orange bg-orange text-[#111]', live: true }
        : x.status === 'done' ? { label: 'Ολοκληρώθηκε', cls: 'border-line text-dim' }
        : x.status === 'registration' ? { label: 'Ανοιχτές δηλώσεις', cls: 'border-blue bg-blue text-white' }
        : undefined,
      cta: 'Δες τις ομάδες',
      to: `/tournaments/${x.slug}?tab=teams`,
    }))

  return (
    <>
      <Crumb items={[{ label: 'Ομάδες' }]} />
      <section className="wrap pt-6">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <Heading a="Ομάδες" b="ανά διοργάνωση" as="h1" />
            <p className="mt-4 max-w-[560px] text-[16px] text-dim">
              Διάλεξε στάση και δες ποιοι δήλωσαν, ανά κατηγορία. Οι ομάδες ανανεώνονται όσο είναι ανοιχτές οι δηλώσεις.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <div className="glass min-w-[112px] rounded-[16px] px-[18px] py-[14px]"><b className="disp block text-[40px] leading-none text-orange">{total}</b><span className="mt-1 block text-[11px] font-bold uppercase tracking-[.12em] text-dim">Ομάδες</span></div>
            <div className="glass min-w-[112px] rounded-[16px] px-[18px] py-[14px]"><b className="disp block text-[40px] leading-none">{rows.length}</b><span className="mt-1 block text-[11px] font-bold uppercase tracking-[.12em] text-dim">Διοργανώσεις</span></div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-5">
          {rows.map((r, i) => <TourCard key={r.key} d={r} delay={Math.min(i, 4) * 60} />)}
        </div>

        {!rows.length && <Empty title="Καμία δήλωση ακόμη." text="Μόλις ανοίξουν οι δηλώσεις, οι ομάδες θα εμφανιστούν εδώ." cta="Δες το πρόγραμμα" to="/tournaments" />}
      </section>
    </>
  )
}
