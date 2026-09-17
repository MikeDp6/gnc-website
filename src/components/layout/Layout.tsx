import { Outlet, useLocation } from 'react-router-dom'
import { Suspense, useEffect } from 'react'
import { useData } from '@/data/store'
import { Ticker } from './Ticker'
import { Nav } from './Nav'
import { Footer } from './Footer'
import { PageSkeleton } from './Skeleton'
import { scrollToTop, useSmoothScroll } from '@/lib/smoothScroll'

export function Layout() {
  const { pathname } = useLocation()
  const { loading, source } = useData()
  useSmoothScroll()
  useEffect(() => { scrollToTop() }, [pathname])
  const home = pathname === '/'
  // first load from Supabase: show the skeleton instead of flashing the built-in sample data
  const booting = loading && source === 'mock'
  return (
    <div className="relative min-h-screen bg-bg text-ink">
      <Ticker overlay={home && !booting} />
      <Nav overlay={home && !booting} />
      {/* every page but the home page is a separate chunk, so the skeleton covers the fetch too */}
      <main>{booting ? <PageSkeleton /> : <Suspense fallback={<PageSkeleton />}><Outlet /></Suspense>}</main>
      {!booting && <Footer finale={home} />}
    </div>
  )
}
