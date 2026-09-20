import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { Logo } from './Logo'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/cn'

/**
 * Floating glass pill (BIFA): on the home page it hangs over the hero below the ticker and slides up
 * to the top edge once you scroll; on every other page it is a sticky pill at the top.
 */
export function Nav({ overlay = false }: { overlay?: boolean }) {
  const { t, lang, setLang } = useI18n()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { session, isAdmin } = useAuth()
  const { pathname } = useLocation()
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 60)
    f(); window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])
  useEffect(() => { setOpen(false) }, [pathname])
  const onTour = pathname.startsWith('/tournaments/')
  const links = [
    { to: '/', label: t.nav.tournaments, end: true },
    { to: '/tournaments', label: t.nav.schedule, active: pathname === '/tournaments' || onTour },
    { to: '/rankings', label: t.nav.rankings },
    { to: '/news', label: t.nav.news },
    { to: '/rentals', label: t.nav.rentals },
    { to: '/contact', label: t.nav.contact },
  ] as Array<{ to: string; label: string; end?: boolean; active?: boolean }>
  const item = (l: { to: string; label: string; end?: boolean; active?: boolean }) => (
    <NavLink key={l.to} to={l.to} end={l.end}
      className={({ isActive }) => cn('rounded-full px-[12px] py-[7px] text-[12px] font-semibold uppercase tracking-[.06em] text-[#d9d8d3] transition-colors hover:bg-white/8 hover:text-white', (l.active ?? isActive) && 'bg-white/12 text-white')}>
      {l.label}
    </NavLink>
  )
  const langSwitch = (
    <div className="text-[12px] font-semibold">
      <button type="button" onClick={() => setLang('el')} className={lang === 'el' ? 'text-white' : 'text-dim'}>EL</button>
      <span className="text-dim"> / </span>
      <button type="button" onClick={() => setLang('en')} className={lang === 'en' ? 'text-white' : 'text-dim'}>EN</button>
    </div>
  )
  // an admin is signed in with the same Supabase session as a player would be, so without this the
  // icon sent them to a player account that does not exist
  const accountTo = isAdmin ? '/admin' : session ? '/me' : '/login'
  const accountLabel = isAdmin ? 'Διαχείριση' : session ? t.account.mine : t.account.signIn
  const register = (
    <div className="flex items-center gap-2">
      <NavLink to={accountTo} title={accountLabel}
        className={({ isActive }) => cn('pop grid h-9 w-9 place-items-center rounded-full border text-[14px]', session ? 'border-orange/60 text-orange' : 'border-white/15 text-[#d9d8d3]', isActive && 'border-orange text-orange')}>
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="8" r="3.6" /><path d="M4.8 20c.9-3.7 3.8-5.6 7.2-5.6s6.3 1.9 7.2 5.6" />
        </svg>
        <span className="sr-only">{accountLabel}</span>
      </NavLink>
      <NavLink to="/register" className="pop inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-blue px-[18px] py-[9px] text-[12px] font-bold text-white">{t.nav.register} <span aria-hidden>→</span></NavLink>
    </div>
  )
  const big = overlay && !scrolled
  return (
    <header className={cn('z-30', overlay ? 'fixed left-0 right-0 transition-[top] duration-300' : 'sticky top-0 py-3')} style={overlay ? { top: scrolled ? 10 : 46 } : undefined}>
      <div className="wrap">
        <div className={cn('glass flex items-center justify-between rounded-full pl-3 pr-2 transition-[padding] duration-300', big ? 'py-[8px]' : 'py-[5px]')}>
          <Logo height={big ? 54 : 42} className="[&>img]:transition-[height] [&>img]:duration-300" />
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
