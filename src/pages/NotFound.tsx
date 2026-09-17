import { Link, Navigate, useLocation } from 'react-router-dom'
import { useData } from '@/data/store'
import { useI18n } from '@/i18n'
import { useMeta } from '@/lib/meta'
import { Button } from '@/components/ui/Button'

/**
 * 404 that first tries to rescue old WordPress links: articles used to live at the site root (/<slug>/),
 * so if the path matches a news slug, a city or a tournament we send the visitor there instead of a dead end.
 */
export function NotFound() {
  const { pathname } = useLocation()
  const { t } = useI18n()
  const { news, cities, tournaments, loading } = useData()
  useMeta('404')
  const slug = decodeURIComponent(pathname.replace(/^\/+|\/+$/g, '')).toLowerCase()
  if (loading) return <div className="wrap py-[120px] text-dim">{t.loading}</div>

  const article = news.find(n => n.slug.toLowerCase() === slug)
  if (article) return <Navigate to={`/news/${article.slug}`} replace />
  const city = cities.find(c => c.id === slug || slug === `${c.id}-vinteo`)
  if (city) return <Navigate to={`/cities/${city.id}`} replace />
  const tour = tournaments.find(x => x.slug.toLowerCase() === slug)
  if (tour) return <Navigate to={`/tournaments/${tour.slug}`} replace />

  return (
    <div className="wrap py-[120px] text-center">
      <div className="disp text-[120px] leading-none text-orange md:text-[180px]">404</div>
      <p className="mt-4 text-[16px] text-dim">{t.notFound.text}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button to="/">{t.notFound.home}</Button>
        <Button variant="ghost" to="/archive">{t.notFound.tour}</Button>
        <Button variant="ghost" to="/news">News</Button>
      </div>
      <Link to="/contact" className="mt-8 inline-block text-[13px] font-bold uppercase tracking-[.08em] text-orange">{t.notFound.contact} →</Link>
    </div>
  )
}
