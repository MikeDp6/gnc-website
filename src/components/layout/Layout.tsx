import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Ticker } from './Ticker'
import { Nav } from './Nav'
import { Footer } from './Footer'

export function Layout() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0 }) }, [pathname])
  return (
    <div className="relative min-h-screen bg-bg text-ink">
      <Ticker />
      <Nav />
      <main><Outlet /></main>
      <Footer newsletter={pathname === '/'} />
    </div>
  )
}
