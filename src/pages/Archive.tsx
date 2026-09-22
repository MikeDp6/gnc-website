import { Link } from 'react-router-dom'
import { useData } from '@/data/store'
import { useI18n } from '@/i18n'
import { useMeta } from '@/lib/meta'
import { Heading } from '@/components/ui/Heading'
import { Crumb } from '@/components/ui/Crumb'
import { Reveal } from '@/components/ui/Reveal'
import { Photo } from '@/components/ui/Photo'
import { GreeceMapLazy as GreeceMap } from '@/components/GreeceMapLazy'
import { cn } from '@/lib/cn'

export function Archive() {
  const { archive, tournaments, cities, season } = useData()
  const { lang } = useI18n()
  // the archive reads newest first: season stops by date, cities by their latest year, results by date
  const seasonDesc = season.map((e, i) => ({ e, i })).sort((a, b) => (b.e.startsOn ?? '').localeCompare(a.e.startsOn ?? '') || b.i - a.i).map(x => x.e)
  const last = (c: { years?: number[] }) => Math.max(0, ...(c.years ?? []))
  const withVideo = cities.filter(c => c.videos?.length || c.image).map((c, i) => ({ c, i })).sort((a, b) => last(b.c) - last(a.c) || a.i - b.i).map(x => x.c)
  const archiveDesc = archive.map(a => ({ a, d: tournaments.find(t => t.id === a.id)?.startsAt ?? '' })).sort((x, y) => String(y.d).localeCompare(String(x.d))).map(x => x.a)
  useMeta('Η περιοδεία & το αρχείο', `${cities.length} πόλεις, ${season.length} διοργανώσεις το 2026 — όλες οι στάσεις της περιοδείας GNC 3on3.`)
  const cname = (c: { name: string; nameEn?: string }) => lang === 'en' && c.nameEn ? c.nameEn : c.name
  return (
    <>
      <Crumb items={[{ label: 'Περιοδεία & αρχείο' }]} />
      <section className="wrap pt-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <Heading a="Η περιοδεία" b="& το αρχείο" as="h1" />
            <p className="mt-4 max-w-[520px] text-[16px] text-dim">Κάθε καλοκαίρι, σε κάθε γωνιά της χώρας, δωρεάν. Από την Αθήνα και τη Θεσσαλονίκη έως την Κρήτη και την Πάτρα — η κορυφαία διοργάνωση street basketball της Ελλάδας.</p>
          </div>
          <div className="card rounded-band p-4"><GreeceMap className="h-[360px]" /></div>
        </div>

        <div className="mt-14 flex items-end justify-between"><Heading a="Σεζόν" b="2026" size="md" /><span className="text-[12px] text-dim">#NEXTSTOPYOURCITY</span></div>
        <div className="mt-6 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {seasonDesc.map((e, i) => (
            <Reveal key={e.id} delay={(i % 3) * 40}>
              <Link to={`/cities/${e.cityId}`} className={cn('card pop grid grid-cols-[56px_1fr_auto] items-center gap-3 px-4 py-3', !e.done && 'border-blue')}>
                <div className="disp text-[24px] leading-none">{e.month}</div>
                <div className="min-w-0"><div className="truncate text-[15px] font-bold">{e.label || e.city}</div><div className="truncate text-[12px] text-dim">{e.dates} · {e.venue}</div></div>
                <span className={cn('rounded-full border px-[10px] py-1 text-[10px] font-extrabold uppercase tracking-[.1em]', e.done ? 'border-line text-dim' : 'border-blue bg-blue')}>{e.done ? '✓' : 'Δηλώσεις'}</span>
              </Link>
            </Reveal>
          ))}
        </div>

        <div className="mt-14"><Heading a="Οι πόλεις" b="σε βίντεο" size="md" /></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {withVideo.map((c, i) => (
            <Reveal key={c.id} delay={(i % 4) * 50}>
              <Link to={`/cities/${c.id}`} className="card pop relative block h-[220px] overflow-hidden rounded-[18px]">
                <Photo src={c.image} alt={`GNC 3on3 ${cname(c)}`} sizes="(min-width:1024px) 300px, (min-width:640px) 46vw, 92vw" className="transition-transform duration-700 hover:scale-[1.04]" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,11,0)_30%,rgba(10,10,11,.9)_100%)]" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="disp text-[30px] text-white">{cname(c)}</div>
                  <div className="text-[12px] text-cement">{c.years?.length ? c.years.slice().sort().join(' · ') : ''}{c.videos?.length ? ` · ${c.videos.length} βίντεο` : ''}</div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        {archive.length > 0 && (
          <>
            <div className="mt-14"><Heading a="Με το" b="σύστημα" size="md" /><p className="mt-2 text-[13px] text-dim">Διοργανώσεις με πλήρες αρχείο ομάδων, ομίλων και αποτελεσμάτων.</p></div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {archiveDesc.map((a, i) => {
                const tour = tournaments.find(x => x.id === a.id)
                const inner = (
                  <>
                    <div className="relative h-[150px]"><Photo src={tour?.cover} alt={`${a.title} — ${a.city}`} sizes="(min-width:1280px) 300px, (min-width:768px) 46vw, 92vw" /><div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,11,0),rgba(10,10,11,.7))]" /></div>
                    <div className="px-[18px] py-5"><div className="mb-2 flex gap-[10px] text-[11px] font-extrabold uppercase tracking-[.1em] text-dim"><b className="text-orange">{a.city}</b><span>{a.when}</span></div><div className="disp text-[32px] leading-[.95]">{a.title}</div><div className="mt-[10px] text-[13px] text-dim">{a.blurb}</div></div>
                  </>
                )
                return <Reveal key={a.id} delay={(i % 4) * 50}>{tour ? <Link to={`/tournaments/${tour.slug}`} className="card pop block overflow-hidden rounded-[18px]">{inner}</Link> : <div className="card overflow-hidden rounded-[18px]">{inner}</div>}</Reveal>
              })}
            </div>
          </>
        )}
      </section>
    </>
  )
}
