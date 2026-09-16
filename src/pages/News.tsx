import { Link, useParams } from 'react-router-dom'
import { useData } from '@/data/store'
import { Heading } from '@/components/ui/Heading'
import { Crumb } from '@/components/ui/Crumb'
import { cn } from '@/lib/cn'
import { NotFound } from './NotFound'

const tintCls = (t: string) => t === 'orange' ? '[filter:sepia(1)_saturate(2.2)_hue-rotate(-10deg)]' : t === 'blue' ? '[filter:saturate(1.6)] bg-[20%_80%]' : t === 'mono' ? '[filter:grayscale(1)_contrast(1.15)] bg-[80%_60%]' : '[filter:sepia(1)_saturate(1.4)_hue-rotate(160deg)] bg-[40%_90%]'

export function NewsList() {
  const { news } = useData()
  const [first, ...rest] = news
  return (
    <>
      <Crumb items={[{ label: 'News' }]} />
      <section className="wrap pt-6">
        <Heading a="Latest" b="news" className="mb-[34px]" />
        {first && (
          <Link to={`/news/${first.slug}`} className="card pop mb-6 grid overflow-hidden rounded-band md:grid-cols-[1.3fr_1fr]">
            <div className={cn('h-[260px] bg-cover bg-[center_70%] md:h-[420px]', tintCls(first.tint))} style={{ backgroundImage: `url(${first.image ?? '/img/hero-dark.jpg'})` }} />
            <div className="flex flex-col justify-center p-8 md:p-12">
              <div className="mb-3 flex gap-[10px] text-[11px] font-extrabold uppercase tracking-[.1em] text-dim"><b className="text-orange">{first.tag}</b><span>{first.date}</span></div>
              <div className="disp text-[48px] md:text-[64px]">{first.title}</div>
              <p className="mt-4 text-[15px] text-dim">{first.excerpt}</p>
              <span className="mt-6 text-[13px] font-bold uppercase tracking-[.08em] text-orange">Διάβασε →</span>
            </div>
          </Link>
        )}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rest.map(a => (
            <Link to={`/news/${a.slug}`} key={a.id} className="card pop overflow-hidden rounded-[18px]">
              <div className={cn('h-[190px] bg-cover bg-[center_70%]', tintCls(a.tint))} style={{ backgroundImage: `url(${a.image ?? '/img/hero-dark.jpg'})` }} />
              <div className="px-[18px] pb-5 pt-4">
                <div className="mb-2 flex gap-[10px] text-[11px] font-extrabold uppercase tracking-[.1em] text-dim"><b className="text-orange">{a.tag}</b><span>{a.date}</span></div>
                <div className="disp text-[32px]">{a.title}</div>
                <div className="mt-[10px] text-[13px] text-dim">{a.excerpt}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}

export function NewsArticle() {
  const { slug = '' } = useParams()
  const { news } = useData()
  const a = news.find(x => x.slug === slug)
  if (!a) return <NotFound />
  const more = news.filter(x => x.id !== a.id).slice(0, 3)
  return (
    <>
      <Crumb items={[{ label: 'News', to: '/news' }, { label: a.title }]} />
      <section className="wrap pt-6">
        <div className={cn('h-[300px] overflow-hidden rounded-band bg-cover bg-[center_60%] md:h-[460px]', tintCls(a.tint))} style={{ backgroundImage: `url(${a.image ?? '/img/hero-dark.jpg'})` }} />
        <div className="mx-auto max-w-[760px] py-12">
          <div className="mb-4 flex gap-[10px] text-[11px] font-extrabold uppercase tracking-[.1em] text-dim"><b className="text-orange">{a.tag}</b><span>{a.date}</span></div>
          <h1 className="disp text-[48px] md:text-[80px]">{a.title}</h1>
          <p className="mt-6 text-[19px] leading-relaxed text-[#d9d8d3]">{a.excerpt}</p>
          <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-dim">
            <p>Το πλήρες κείμενο του άρθρου μπαίνει από το admin panel (CMS). Υποστηρίζει παραγράφους, φωτογραφίες, λίστες και συνδέσμους προς πρόγραμμα, ομάδες και αποτελέσματα.</p>
            <p>Κάθε άρθρο έχει ελληνική και αγγλική εκδοχή, ημερομηνία, ετικέτα (Πρόγραμμα, Δηλώσεις, Αποτελέσματα, Νέο) και προαιρετική σύνδεση με διοργάνωση, ώστε να εμφανίζεται και στη σελίδα της.</p>
          </div>
          <div className="mt-10 flex gap-3 border-t border-line pt-6 text-[13px] font-bold uppercase tracking-[.08em] text-dim"><span>Κοινοποίηση:</span><span className="text-white">Facebook</span><span className="text-white">Instagram</span><span className="text-white">Αντιγραφή συνδέσμου</span></div>
        </div>
        {more.length > 0 && (
          <>
            <div className="kicker mb-4">Περισσότερα</div>
            <div className="grid gap-4 md:grid-cols-3">
              {more.map(x => <Link key={x.id} to={`/news/${x.slug}`} className="card pop p-5"><div className="mb-2 text-[11px] font-extrabold uppercase tracking-[.1em] text-orange">{x.tag}</div><div className="disp text-[28px]">{x.title}</div></Link>)}
            </div>
          </>
        )}
      </section>
    </>
  )
}
