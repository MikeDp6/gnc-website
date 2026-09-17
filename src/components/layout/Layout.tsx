import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useData } from '@/data/store'
import { Ticker } from './Ticker'
import { Nav } from './Nav'
import { Footer } from './Footer'
import { PageSkeleton } from './Skeleton'

export function Layout() {
  const { pathname } = useLocation()
  const { loading, source } = useData()
  useEffect(() => { window.scrollTo({ top: 0 }) }, [pathname])
  const home = pathname === '/'
  // first load from Supabase: show the skeleton instead of flashing the built-in sample data
  const booting = loading && source === 'mock'
  return (
    <div className="relative min-h-screen bg-bg text-ink">
      <Ticker overlay={home && !booting} />
      <Nav overlay={home && !booting} />
      <main>{booting ? <PageSkeleton /> : <Outlet />}</main>
      {!booting && <Footer finale={home} />}
    </div>
  )
}
