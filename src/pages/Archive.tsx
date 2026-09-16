import { Link } from 'react-router-dom'
import { useData } from '@/data/store'
import { Heading } from '@/components/ui/Heading'
import { Crumb } from '@/components/ui/Crumb'
import { GreeceMap } from '@/components/GreeceMap'
import { cn } from '@/lib/cn'

const tintCls = (t: string) => t === 'orange' ? '[filter:sepia(1)_saturate(2.2)_hue-rotate(-10deg)]' : t === 'blue' ? '[filter:saturate(1.6)] bg-[20%_80%]' : t === 'mono' ? '[filter:grayscale(1)_contrast(1.15)] bg-[80%_60%]' : '[filter:sepia(1)_saturate(1.4)_hue-rotate(160deg)] bg-[40%_90%]'

export function Archive() {
  const { archive, tournaments, cities } = useData()
  const byYear = archive.reduce<Record<string, typeof archive>>((acc, a) => { const y = a.when.slice(-4); (acc[y] ??= []).push(a); return acc }, {})
  return (
    <>
      <Crumb items={[{ label: 'Αρχείο διοργανώσεων' }]} />
      <section className="wrap pt-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <Heading a="Αρχείο" b="διοργανώσεων" />
            <p className="mt-4 max-w-[520px] text-[16px] text-dim">Κάθε στάση της περιοδείας από το 2018: ομάδες, όμιλοι, brackets, νικητές ανά κατηγορία και φωτογραφίες.</p>
            <div className="mt-6 flex gap-6"><div><b className="disp block text-[48px] text-orange">{cities.length}</b><span className="kicker">Πόλεις</span></div><div><b className="disp block text-[48px] text-orange">{tournaments.length}+</b><span className="kicker">Διοργανώσεις</span></div><div><b className="disp block text-[48px] text-orange">2018</b><span className="kicker">Από</span></div></div>
          </div>
          <div className="card rounded-band p-4"><GreeceMap className="h-[320px]" /></div>
        </div>
        {Object.entries(byYear).sort((a, b) => b[0].localeCompare(a[0])).map(([year, items]) => (
          <div key={year} className="mt-14">
            <div className="disp mb-4 text-[44px]">{year}</div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {items.map(a => {
                const tour = tournaments.find(x => x.id === a.id)
                const inner = (
                  <>
                    <div className={cn('h-[190px] bg-cover bg-[center_70%]', tintCls(a.tint))} style={{ backgroundImage: 'url(/img/hero-dark.jpg)' }} />
                    <div className="px-[18px] pb-5 pt-4">
                      <div className="mb-2 flex gap-[10px] text-[11px] font-extrabold uppercase tracking-[.1em] text-dim"><b className="text-orange">{a.city}</b><span>{a.when}</span></div>
                      <div className="disp text-[32px]">{a.title}</div>
                      <div className="mt-[10px] text-[13px] text-dim">{a.blurb}</div>
                    </div>
                  </>
                )
                return tour ? <Link key={a.id} to={`/tournaments/${tour.slug}`} className="card pop overflow-hidden rounded-[18px]">{inner}</Link> : <div key={a.id} className="card pop overflow-hidden rounded-[18px]">{inner}</div>
              })}
            </div>
          </div>
        ))}
      </section>
    </>
  )
}
