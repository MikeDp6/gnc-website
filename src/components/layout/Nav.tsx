import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { Button } from '@/components/ui/Button'
import { Logo } from './Logo'
import { useData } from '@/data/store'
import { cn } from '@/lib/cn'

export function Nav({ overlay = false }: { overlay?: boolean }) {
  const { t, lang, setLang } = useI18n()
  const [open, setOpen] = useState(false)
  const { tournaments } = useData()
  const next = tournaments.find(x => x.status !== 'done') ?? tournaments[0]
  const links = [
    { to: '/', label: t.nav.tournaments, end: true },
    { to: `/tournaments/${next?.slug ?? ''}`, label: t.nav.schedule },
    { to: `/tournaments/${next?.slug ?? ''}?tab=teams`, label: t.nav.teams },
    { to: '/news', label: 'News' },
    { to: '/rentals', label: 'Ενοικιάσεις' },
    { to: '/contact', label: t.nav.contact },
  ]
  const item = (l: typeof links[number]) => (
    <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)}
      className={({ isActive }) => cn('pb-[3px] text-[14px] font-semibold uppercase tracking-[.06em] text-[#d9d8d3] hover:text-white', isActive && 'border-b-2 border-orange text-white')}>
      {l.label}
    </NavLink>
  )
  return (
    <header className={cn('wrap flex items-center justify-between py-5', overlay && 'absolute left-0 right-0 top-[38px] z-20 py-4')}>
      <Logo />
      <nav className="hidden gap-9 lg:flex">{links.map(item)}</nav>
      <div className="hidden items-center gap-[22px] text-[13px] font-semibold lg:flex">
        <div>
          <button type="button" onClick={() => setLang('el')} className={lang === 'el' ? 'text-white' : 'text-dim'}>EL</button>
          <span className="text-dim"> / </span>
          <button type="button" onClick={() => setLang('en')} className={lang === 'en' ? 'text-white' : 'text-dim'}>EN</button>
        </div>
        <Button to="/register">{t.nav.register} →</Button>
      </div>
      <button type="button" aria-label="Menu" onClick={() => setOpen(o => !o)} className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-lg border border-line lg:hidden">
        <span className={cn('block h-[2px] w-5 bg-white transition-transform', open && 'translate-y-[7px] rotate-45')} />
        <span className={cn('block h-[2px] w-5 bg-white transition-opacity', open && 'opacity-0')} />
        <span className={cn('block h-[2px] w-5 bg-white transition-transform', open && '-translate-y-[7px] -rotate-45')} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-[110px] z-50 flex flex-col gap-5 border-b border-line bg-bg px-4 pb-6 pt-4 lg:hidden">
          {links.map(item)}
          <Button to="/register">{t.nav.register} →</Button>
        </div>
      )}
    </header>
  )
}
