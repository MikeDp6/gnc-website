import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useData } from '@/data/store'
import { useI18n } from '@/i18n'
import { useJsonLd, useMeta } from '@/lib/meta'
import { Heading } from '@/components/ui/Heading'
import { Crumb } from '@/components/ui/Crumb'
import { Reveal } from '@/components/ui/Reveal'
import { Photo } from '@/components/ui/Photo'
import { Markdown } from '@/components/ui/Markdown'
import { NotFound } from './NotFound'

export function NewsList() {
  const { news } = useData()
  const { t } = useI18n()
  const [first, ...rest] = news
  const [shown, setShown] = useState(12)
  useMeta('News', 'Νέα, αποτελέσματα και ανακοινώσεις από τα τουρνουά GNC 3on3.')
  return (
    <>
      <Crumb items={[{ label: 'News' }]} />
      <section className="wrap pt-6">
        <Heading a={t.sections.news1} b={t.sections.news2} className="mb-[34px]" as="h1" />
        {first && (
          <Link to={`/news/${first.slug}`} className="card pop relative mb-6 block min-h-[420px] overflow-hidden rounded-band md:min-h-[560px]">
            <Photo src={first.image} className="hero-in" position={first.imagePos ?? 'center 30%'} eager />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,11,0)_30%,rgba(10,10,11,.85)_100%)]" />
            <div className="glass absolute bottom-4 left-4 right-4 rounded-[18px] p-5 md:bottom-6 md:left-6 md:right-6 md:max-w-[820px] md:p-8">
              <div className="mb-3 flex gap-[10px] text-[11px] font-extrabold uppercase tracking-[.1em] text-dim"><b className="text-orange">{first.tag}</b><span>{first.date}</span></div>
              <div className="disp line-clamp-3 text-[38px] leading-[.92] text-white md:text-[56px]">{first.title}</div>
              <p className="mt-3 line-clamp-2 text-[15px] text-cement">{first.excerpt}</p>
              <span className="mt-4 inline-block text-[13px] font-bold uppercase tracking-[.08em] text-orange">{t.news.read}</span>
            </div>
          </Link>
        )}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rest.slice(0, shown).map((a, i) => (
            <Reveal key={a.id} delay={(i % 3) * 70}>
              <Link to={`/news/${a.slug}`} className="card pop block overflow-hidden rounded-[18px]">
                <div className="relative h-[220px]"><Photo src={a.image} position={a.imagePos ?? 'center 30%'} /></div>
                <div className="px-[18px] pb-5 pt-4">
                  <div className="mb-2 flex gap-[10px] text-[11px] font-extrabold uppercase tracking-[.1em] text-dim"><b className="text-orange">{a.tag}</b><span>{a.date}</span></div>
                  <div className="disp line-clamp-3 text-[30px] leading-[.95]">{a.title}</div>
                  <div className="mt-[10px] line-clamp-3 text-[13px] text-dim">{a.excerpt}</div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
        {rest.length > shown && (
          <div className="mt-8 flex justify-center">
            <button type="button" onClick={() => setShown(n => n + 12)} className="rounded-full border border-line px-6 py-3 text-[13px] font-bold uppercase tracking-[.08em] text-white hover:border-white/40">{t.news.more} · {rest.length - shown}</button>
          </div>
        )}
      </section>
    </>
  )
}

export function NewsArticle() {
  const { slug = '' } = useParams()
  const { news } = useData()
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const a = news.find(x => x.slug === slug)
  useMeta(a?.title, a?.excerpt, a?.image)
  useJsonLd(a ? {
    '@context': 'https://schema.org', '@type': 'NewsArticle', headline: a.title, description: a.excerpt,
    datePublished: a.publishedOn, image: a.image ? new URL(a.image, window.location.origin).href : undefined,
    publisher: { '@type': 'Organization', name: 'GNC 3on3', url: window.location.origin },
    mainEntityOfPage: window.location.origin + window.location.pathname,
  } : null)
  if (!a) return <NotFound />
  const more = news.filter(x => x.id !== a.id).slice(0, 3)
  const url = typeof window !== 'undefined' ? window.location.href : ''
  const copy = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* ignore */ } }
  return (
    <>
      <Crumb items={[{ label: 'News', to: '/news' }, { label: a.title }]} />
      <section className="wrap pt-6">
        <div className="relative min-h-[320px] overflow-hidden rounded-band md:min-h-[560px]">
          <Photo src={a.image} className="hero-in" position={a.imagePos ?? 'center 30%'} eager />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,11,.1)_30%,rgba(10,10,11,.9)_100%)]" />
          <div className="absolute bottom-6 left-6 right-6 md:bottom-10 md:left-12 md:right-12">
            <div className="rise-in mb-4 flex gap-[10px] text-[11px] font-extrabold uppercase tracking-[.1em] text-dim" style={{ animationDelay: '.4s' }}><b className="text-orange">{a.tag}</b><span>{a.date}</span></div>
            <h1 className="rise-in disp max-w-[1000px] text-[40px] text-white md:text-[76px]" style={{ animationDelay: '.5s' }}>{a.title}</h1>
          </div>
        </div>
        <div className="mx-auto max-w-[760px] py-12">
          <p className="text-[19px] leading-relaxed text-[#d9d8d3] md:text-[21px]">{a.excerpt}</p>
          {a.body && <div className="mt-8 text-[16px] leading-[1.75] text-[#d9d8d3] [&_h2]:disp [&_h2]:mt-10 [&_h2]:text-[36px] [&_h2]:text-white [&_h3]:mt-8 [&_h3]:text-[20px] [&_h3]:font-bold [&_h3]:text-white [&_a]:text-orange [&_p]:my-4"><Markdown text={a.body} /></div>}
          {a.source && <a href={a.source} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-full border border-orange px-5 py-3 text-[13px] font-bold uppercase tracking-[.08em] text-orange hover:bg-orange hover:text-[#111]">{t.news.full}</a>}
          <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-6 text-[12px] font-bold uppercase tracking-[.08em] text-dim">
            <span>{t.news.share}</span>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="rounded-full border border-line px-4 py-2 text-white hover:border-white/40">Facebook</a>
            <a href={`https://wa.me/?text=${encodeURIComponent(`${a.title} ${url}`)}`} target="_blank" rel="noreferrer" className="rounded-full border border-line px-4 py-2 text-white hover:border-white/40">WhatsApp</a>
            <a href={`viber://forward?text=${encodeURIComponent(`${a.title} ${url}`)}`} className="rounded-full border border-line px-4 py-2 text-white hover:border-white/40">Viber</a>
            <button type="button" onClick={copy} className="rounded-full border border-line px-4 py-2 text-white hover:border-white/40">{copied ? t.news.copied : t.news.copy}</button>
          </div>
        </div>
        {more.length > 0 && (
          <>
            <div className="kicker mb-4">{t.news.more}</div>
            <div className="grid gap-4 md:grid-cols-3">
              {more.map(x => (
                <Link key={x.id} to={`/news/${x.slug}`} className="card pop grid grid-cols-[110px_1fr] overflow-hidden rounded-[16px]">
                  <div className="relative"><Photo src={x.image} position={x.imagePos ?? 'center 30%'} /></div>
                  <div className="p-4"><div className="mb-1 text-[11px] font-extrabold uppercase tracking-[.1em] text-orange">{x.tag}</div><div className="disp line-clamp-3 text-[24px] leading-[.95]">{x.title}</div></div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  )
}
