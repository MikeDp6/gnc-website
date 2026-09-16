import { Link } from 'react-router-dom'
import { useData } from '@/data/store'
import { Heading } from '@/components/ui/Heading'
import { Crumb } from '@/components/ui/Crumb'
import { GreeceMap } from '@/components/GreeceMap'
import { cn } from '@/lib/cn'

export function Archive() {
  const { archive, tournaments, cities, season } = useData()
  const withVideo = cities.filter(c => c.videos?.length || c.image)
  return (
    <>
      <Crumb items={[{ label: 'Περιοδεία & αρχείο' }]} />
      <section className="wrap pt-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <Heading a="Η περιοδεία" b="& το αρχείο" />
            <p className="mt-4 max-w-[520px] text-[16px] text-dim">Κάθε καλοκαίρι, σε κάθε γωνιά της χώρας, δωρεάν. Από την Αθήνα και τη Θεσσαλονίκη έως την Κρήτη και την Πάτρα — η κορυφαία διοργάνωση street basketball της Ελλάδας.</p>
            <div className="mt-6 flex gap-8"><div><b className="disp block text-[48px] text-orange">{cities.length}</b><span className="kicker">Πόλεις</span></div><div><b className="disp block text-[48px] text-orange">{season.length}</b><span className="kicker">Διοργανώσεις 2026</span></div><div><b className="disp block text-[48px] text-orange">2018</b><span className="kicker">Από</span></div></div>
          </div>
          <div className="card rounded-band p-4"><GreeceMap className="h-[360px]" /></div>
        </div>

        <div className="mt-14 flex items-end justify-between"><Heading a="Σεζόν" b="2026" size="md" /><span className="text-[12px] text-dim">#NEXTSTOPYOURCITY</span></div>
        <div className="mt-6 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {season.map(e => (
            <Link key={e.id} to={`/cities/${e.cityId}`} className={cn('card pop grid grid-cols-[56px_1fr_auto] items-center gap-3 px-4 py-3', !e.done && 'border-blue')}>
              <div className="disp text-[24px] leading-none">{e.month}</div>
              <div className="min-w-0"><div className="truncate text-[15px] font-bold">{e.label || e.city}</div><div className="truncate text-[12px] text-dim">{e.dates} · {e.venue}</div></div>
              <span className={cn('rounded-md border px-2 py-1 text-[10px] font-extrabold uppercase tracking-[.1em]', e.done ? 'border-line text-dim' : 'border-blue bg-blue')}>{e.done ? '✓' : 'Δηλώσεις'}</span>
            </Link>
          ))}
        </div>

        <div className="mt-14"><Heading a="Οι πόλεις" b="σε βίντεο" size="md" /></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {withVideo.map(c => (
            <Link key={c.id} to={`/cities/${c.id}`} className="card pop overflow-hidden rounded-[18px]">
              {c.image ? <div className="h-[160px] bg-cover bg-center" style={{ backgroundImage: `url(${c.image})` }} /> : <div className="flex h-[160px] items-center justify-center bg-[linear-gradient(135deg,rgba(16,114,255,.25),rgba(255,135,0,.18))]"><span className="disp text-[44px] text-white/20">GNC</span></div>}
              <div className="px-4 pb-4 pt-3"><div className="disp text-[28px]">{c.name}</div><div className="text-[12px] text-dim">{c.years?.length ? c.years.slice().reverse().join(' · ') : ''}{c.videos?.length ? ` · ${c.videos.length} βίντεο` : ''}</div></div>
            </Link>
          ))}
        </div>

        {archive.length > 0 && (
          <>
            <div className="mt-14"><Heading a="Με το" b="σύστημα" size="md" /><p className="mt-2 text-[13px] text-dim">Διοργανώσεις με πλήρες αρχείο ομάδων, ομίλων και αποτελεσμάτων.</p></div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {archive.map(a => { const tour = tournaments.find(x => x.id === a.id); const inner = <div className="px-[18px] py-5"><div className="mb-2 flex gap-[10px] text-[11px] font-extrabold uppercase tracking-[.1em] text-dim"><b className="text-orange">{a.city}</b><span>{a.when}</span></div><div className="disp text-[32px]">{a.title}</div><div className="mt-[10px] text-[13px] text-dim">{a.blurb}</div></div>
                return tour ? <Link key={a.id} to={`/tournaments/${tour.slug}`} className="card pop rounded-[18px]">{inner}</Link> : <div key={a.id} className="card rounded-[18px]">{inner}</div> })}
            </div>
          </>
        )}
      </section>
    </>
  )
}
