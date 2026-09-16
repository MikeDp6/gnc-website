import { Link, useParams } from 'react-router-dom'
import { useData } from '@/data/store'
import { Heading } from '@/components/ui/Heading'
import { Crumb } from '@/components/ui/Crumb'
import { GreeceMap } from '@/components/GreeceMap'
import { cn } from '@/lib/cn'
import { NotFound } from './NotFound'

/** City page: every GNC tournament held in this city (upcoming + past). */
export function City() {
  const { id = '' } = useParams()
  const { cities, tournaments, archive } = useData()
  const city = cities.find(c => c.id === id)
  if (!city) return <NotFound />
  const mine = tournaments.filter(t => t.cityId === city.id || t.city === city.name)
  const upcoming = mine.filter(t => t.status !== 'done'), past = mine.filter(t => t.status === 'done')
  const pastArchive = archive.filter(a => a.city === city.name)
  return (
    <>
      <Crumb items={[{ label: 'Περιοδεία', to: '/archive' }, { label: city.name }]} />
      <section className="wrap grid gap-8 pt-6 lg:grid-cols-[1fr_1fr]">
        <div>
          <div className="kicker mb-3">Στάση της περιοδείας</div>
          <Heading a={city.name} size="xl" />
          <p className="mt-4 max-w-[520px] text-[16px] text-dim">{mine.length ? `${mine.length} διοργάνωση${mine.length > 1 ? 'εις' : ''} της GNC σε αυτή την πόλη.` : 'Η GNC έχει παίξει εδώ — τα αρχεία των διοργανώσεων προστίθενται σταδιακά.'}</p>
          <div className="mt-8 flex flex-col gap-3">
            {upcoming.map(t => (
              <Link key={t.id} to={`/tournaments/${t.slug}`} className="card pop flex items-center justify-between gap-4 border-orange px-5 py-4">
                <div><div className="text-[17px] font-bold">{t.name}</div><div className="text-[13px] text-dim">{t.dates} · {t.venue} · {t.teamsCount} ομάδες</div></div>
                <span className="rounded-lg bg-orange px-3 py-2 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#111]">{t.status === 'registration' ? 'Δηλώσεις' : 'Πρόγραμμα'}</span>
              </Link>
            ))}
            {past.map(t => (
              <Link key={t.id} to={`/tournaments/${t.slug}`} className="card pop flex items-center justify-between gap-4 px-5 py-4">
                <div><div className="text-[17px] font-bold">{t.name}</div><div className="text-[13px] text-dim">{t.dates} · {t.venue}</div></div>
                <span className="rounded-lg border border-line px-3 py-2 text-[11px] font-extrabold uppercase tracking-[.12em] text-dim">Αρχείο</span>
              </Link>
            ))}
            {pastArchive.filter(a => !mine.some(t => t.id === a.id)).map(a => (
              <div key={a.id} className="card flex items-center justify-between gap-4 px-5 py-4"><div><div className="text-[17px] font-bold">{a.title}</div><div className="text-[13px] text-dim">{a.when} · {a.blurb}</div></div></div>
            ))}
            {!mine.length && !pastArchive.length && <div className="card p-6 text-dim">Δεν υπάρχει ακόμη καταχωρημένη διοργάνωση για αυτή την πόλη.</div>}
          </div>
          <Link to="/register" className={cn('mt-8 inline-block text-[13px] font-bold uppercase tracking-[.08em] text-orange')}>Θες τουρνουά στην πόλη σου; Πρότεινέ το →</Link>
        </div>
        <div className="card rounded-band p-4"><GreeceMap className="h-[420px] md:h-[600px]" nextCityId={city.id} /></div>
      </section>
    </>
  )
}
