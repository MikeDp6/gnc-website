import { Link, useParams } from 'react-router-dom'
import { useData } from '@/data/store'
import { useI18n } from '@/i18n'
import { useMeta } from '@/lib/meta'
import { Band } from '@/components/layout/Band'
import { Crumb } from '@/components/ui/Crumb'
import { Reveal } from '@/components/ui/Reveal'
import { GreeceMap } from '@/components/GreeceMap'
import { PhotoGrid } from '@/components/PhotoGrid'
import { Photo as Img } from '@/components/ui/Photo'
import { cityOf } from '@/lib/cityMatch'
import { NotFound } from './NotFound'

/** City page: tournaments held here (upcoming + this season + archive) and the videos from gnc3on3.gr. */
export function City() {
  const { id = '' } = useParams()
  const { lang } = useI18n()
  const { cities, tournaments, season, photos, news } = useData()
  const city = cities.find(c => c.id === id)
  const name = city ? (lang === 'en' && city.nameEn ? city.nameEn : city.name) : ''
  useMeta(city ? `GNC 3on3 ${name}` : undefined, city ? `Οι διοργανώσεις GNC 3on3 στην πόλη ${city.name}.` : undefined, city?.image)
  if (!city) return <NotFound />
  const mine = tournaments.filter(t => t.cityId === city.id || t.city === city.name)
  const upcoming = mine.filter(t => t.status !== 'done')
  const events = season.filter(e => e.cityId === city.id)
  const yt = (city.videos ?? []).filter(v => v.kind === 'youtube'), ig = (city.videos ?? []).filter(v => v.kind === 'instagram')
  const years = city.years?.length ? city.years.slice().sort() : []
  const mineIds = new Set(mine.map(t => t.id))
  const shots = photos.filter(p => p.cityId === city.id || (p.tournamentId && mineIds.has(p.tournamentId)))
  const stories = news.filter(a => cityOf(`${a.slug} ${a.title}`) === city.id).slice(0, 6)
  const partners = city.partners ?? []
  return (
    <>
      <Crumb items={[{ label: 'Περιοδεία', to: '/archive' }, { label: name }]} />
      <Band kicker={`Στάση της περιοδείας${years.length ? ` · ${years.join(' · ')}` : ''}`} title={name} cover={city.image ?? mine[0]?.cover}
        stats={[{ v: years.length || events.length || '—', l: 'Διοργανώσεις' }, ...(shots.length ? [{ v: shots.length, l: 'Φωτογραφίες' }] : []), { v: (yt.length + ig.length) || '—', l: 'Βίντεο' }, ...(upcoming[0] ? [{ v: upcoming[0].dates.split(' ')[0], l: 'Επόμενη', accent: '#FF8700' }] : [])]} />
      <section className="wrap grid gap-8 pt-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          {upcoming.length > 0 && (
            <div className="flex flex-col gap-3">
              {upcoming.map(t => (
                <Link key={t.id} to={`/tournaments/${t.slug}`} className="card pop flex items-center justify-between gap-4 border-orange px-5 py-4">
                  <div><div className="text-[17px] font-bold">{t.name}</div><div className="text-[13px] text-dim">{t.dates} · {t.venue} · {t.teamsCount} ομάδες</div></div>
                  <span className="rounded-full bg-orange px-3 py-2 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#111]">{t.status === 'registration' ? 'Δηλώσεις' : 'Πρόγραμμα'}</span>
                </Link>
              ))}
            </div>
          )}
          {events.length > 0 && (
            <Reveal>
              <div className="kicker mb-3 mt-8">Σεζόν 2026</div>
              <div className="flex flex-col gap-2">
                {events.map(e => (
                  <div key={e.id} className="card flex items-center justify-between gap-4 px-5 py-4">
                    <div><div className="text-[16px] font-bold">{e.label || `GNC 3on3 ${city.name}`}</div><div className="text-[13px] text-dim">{e.dates} · {e.venue}</div></div>
                    <span className={`rounded-full border px-3 py-2 text-[11px] font-extrabold uppercase tracking-[.12em] ${e.done ? 'border-line text-dim' : 'border-blue bg-blue'}`}>{e.done ? 'Ολοκληρώθηκε' : 'Δηλώσεις'}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          )}
          {(yt.length > 0 || ig.length > 0) && (
            <Reveal>
              <div className="kicker mb-3 mt-10">Βίντεο</div>
              {yt.length > 0 && <div className="grid gap-4 md:grid-cols-2">{yt.map(v => <div key={v.id} className="card overflow-hidden rounded-[16px]"><iframe className="aspect-video w-full" src={`https://www.youtube.com/embed/${v.id}`} title={`GNC 3on3 ${city.name}`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>)}</div>}
              {ig.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{ig.map((v, i) => <a key={v.id} href={`https://www.instagram.com/reel/${v.id}/`} target="_blank" rel="noreferrer" className="pop rounded-full border border-line px-4 py-2 text-[12px] font-bold hover:border-orange hover:text-orange">▶ Reel {i + 1}</a>)}</div>}
            </Reveal>
          )}
          {shots.length > 0 && (
            <Reveal>
              <div className="mb-3 mt-10 flex items-end justify-between">
                <span className="kicker">Φωτογραφίες</span>
                <span className="text-[12px] text-mute">{shots.length}</span>
              </div>
              <PhotoGrid photos={shots} />
            </Reveal>
          )}
          {stories.length > 0 && (
            <Reveal>
              <div className="mb-3 mt-10 flex items-end justify-between">
                <span className="kicker">Από τα νέα</span>
                <Link to="/news" className="text-[12px] font-bold uppercase tracking-[.08em] text-orange">Όλα τα νέα →</Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {stories.map(a => (
                  <Link key={a.id} to={`/news/${a.slug}`} className="card pop grid grid-cols-[104px_1fr] items-stretch overflow-hidden rounded-[16px]">
                    <Img src={a.image} />
                    <div className="px-4 py-3">
                      <div className="mb-[5px] flex gap-[10px] text-[10px] font-extrabold uppercase tracking-[.1em] text-dim"><b className="text-orange">{a.tag}</b><span>{a.date}</span></div>
                      <div className="line-clamp-3 text-[14px] font-bold leading-[1.25]">{a.title}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </Reveal>
          )}
          {!mine.length && !events.length && !yt.length && !ig.length && !shots.length && !stories.length && <div className="card p-6 text-dim">Δεν υπάρχει ακόμη καταχωρημένη διοργάνωση για αυτή την πόλη.</div>}
          <Link to="/contact" className="mt-8 inline-block text-[13px] font-bold uppercase tracking-[.08em] text-orange">Θες τουρνουά στην πόλη σου; Πρότεινέ το →</Link>
        </div>

        <div className="flex flex-col gap-4 self-start">
          <div className="card rounded-band p-4"><GreeceMap className="h-[380px] md:h-[460px]" nextCityId={city.id} /></div>
          {partners.length > 0 && (
            <Reveal className="card p-6">
              <h4 className="kicker mb-4">Μαζί στη διοργάνωση</h4>
              <div className="flex flex-col gap-3">
                {partners.map(p => {
                  const body = (
                    <>
                      <div className="text-[15px] font-bold leading-tight">{p.name}</div>
                      {p.role && <div className="mt-[2px] text-[12px] uppercase tracking-[.08em] text-dim">{p.role}</div>}
                    </>
                  )
                  return p.url
                    ? <a key={p.name} href={p.url} target="_blank" rel="noreferrer" className="pop block border-l-[3px] border-orange pl-3 hover:text-orange">{body}</a>
                    : <div key={p.name} className="border-l-[3px] border-line pl-3">{body}</div>
                })}
              </div>
            </Reveal>
          )}
        </div>
      </section>
    </>
  )
}
