import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { Logo } from './Logo'
import { useData } from '@/data/store'
import { cn } from '@/lib/cn'

/**
 * Floating glass pill (BIFA): on the home page it hangs over the hero below the ticker and slides up
 * to the top edge once you scroll; on every other page it is a sticky pill at the top.
 */
export function Nav({ overlay = false }: { overlay?: boolean }) {
  const { t, lang, setLang } = useI18n()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { tournaments } = useData()
  const { pathname } = useLocation()
  const next = tournaments.find(x => x.status !== 'done') ?? tournaments[0]
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 60)
    f(); window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])
  useEffect(() => { setOpen(false) }, [pathname])
  const links = [
    { to: '/', label: t.nav.tournaments, end: true },
    { to: `/tournaments/${next?.slug ?? ''}`, label: t.nav.schedule },
    { to: `/tournaments/${next?.slug ?? ''}?tab=teams`, label: t.nav.teams },
    { to: '/news', label: t.nav.news },
    { to: '/rentals', label: t.nav.rentals },
    { to: '/contact', label: t.nav.contact },
  ]
  const item = (l: typeof links[number]) => (
    <NavLink key={l.to} to={l.to} end={l.end}
      className={({ isActive }) => cn('rounded-full px-[14px] py-[8px] text-[13px] font-semibold uppercase tracking-[.06em] text-[#d9d8d3] transition-colors hover:bg-white/8 hover:text-white', isActive && 'bg-white/12 text-white')}>
      {l.label}
    </NavLink>
  )
  const langSwitch = (
    <div className="text-[13px] font-semibold">
      <button type="button" onClick={() => setLang('el')} className={lang === 'el' ? 'text-white' : 'text-dim'}>EL</button>
      <span className="text-dim"> / </span>
      <button type="button" onClick={() => setLang('en')} className={lang === 'en' ? 'text-white' : 'text-dim'}>EN</button>
    </div>
  )
  const register = <NavLink to="/register" className="pop inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-blue px-5 py-[11px] text-[13px] font-bold text-white">{t.nav.register} <span aria-hidden>→</span></NavLink>
  const big = overlay && !scrolled
  return (
    <header className={cn('z-30', overlay ? 'fixed left-0 right-0 transition-[top] duration-300' : 'sticky top-0 py-3')} style={overlay ? { top: scrolled ? 10 : 50 } : undefined}>
      <div className="wrap">
        <div className={cn('glass flex items-center justify-between rounded-full pl-4 pr-2 transition-[padding] duration-300', big ? 'py-[10px]' : 'py-[6px]')}>
          <Logo height={big ? 64 : 48} className="[&>img]:transition-[height] [&>img]:duration-300" />
          <nav className="hidden items-center gap-1 lg:flex">{links.map(item)}</nav>
          <div className="hidden items-center gap-4 lg:flex">
            <div className="pl-2">{langSwitch}</div>
            {register}
          </div>
          <button type="button" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(o => !o)} className="mr-1 flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-full border border-white/15 lg:hidden">
            <span className={cn('block h-[2px] w-5 bg-white transition-transform', open && 'translate-y-[7px] rotate-45')} />
            <span className={cn('block h-[2px] w-5 bg-white transition-opacity', open && 'opacity-0')} />
            <span className={cn('block h-[2px] w-5 bg-white transition-transform', open && '-translate-y-[7px] -rotate-45')} />
          </button>
        </div>
        {open && (
          <div className="glass mt-2 flex flex-col gap-1 rounded-[24px] p-3 lg:hidden">
            {links.map(item)}
            <div className="mt-2 flex items-center justify-between px-[14px] pb-1">{langSwitch}{register}</div>
          </div>
        )}
      </div>
    </header>
  )
}
