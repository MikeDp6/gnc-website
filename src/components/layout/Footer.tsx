import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { useData } from '@/data/store'
import { Heading } from '@/components/ui/Heading'
import { Button } from '@/components/ui/Button'
import { Marquee } from '@/components/ui/Marquee'
import { Logo } from './Logo'
import { cn } from '@/lib/cn'

/**
 * Footer. With `finale` (home page) it becomes the BIFA-style last screen: a photo behind everything,
 * partners strip + newsletter + link columns all sitting in glass panels.
 */
export function Footer({ finale = false, photo = '/img/hero-dark.jpg' }: { finale?: boolean; photo?: string }) {
  const { t } = useI18n()
  const { sponsorList } = useData()
  const lcol = (title: string, items: Array<[string, string]>) => (
    <div>
      <b className="mb-[14px] block text-[12px] uppercase tracking-[.14em] text-white">{title}</b>
      {items.map(([i, to]) => <Link key={i} to={to} className="mb-[9px] block hover:text-white">{i}</Link>)}
    </div>
  )
  const columns = (
    <div className="grid gap-8 text-[14px] text-dim md:grid-cols-[2fr_1fr_1fr_1fr_1.2fr]">
      <div>
        <Logo className="mb-[14px]" height={72} />
        <span className="block">{t.footer.tagline}</span>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-[9px] text-[12px] font-bold text-white">▲ App Store</span>
          <span className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-[9px] text-[12px] font-bold text-white">▶ Google Play</span>
        </div>
      </div>
      {lcol('Διοργανώσεις', [['Επόμενες', '/'], ['Αρχείο & περιοδεία', '/archive'], ['News', '/news'], ['Ενοικιάσεις', '/rentals']])}
      {lcol(t.nav.teams, [['Δήλωση συμμετοχής', '/register'], ['Κανονισμοί', '/kanonismoi'], ['Όροι συμμετοχής', '/oroi']])}
      {lcol('GNC', [['Ποιοι είμαστε', '/about'], ['Γίνε εθελοντής', '/volunteer'], ['Επικοινωνία', '/contact']])}
      <div>
        <b className="mb-[14px] block text-[12px] uppercase tracking-[.14em] text-white">{t.misc.follow}</b>
        {[['Instagram', 'https://instagram.com/gnc_3on3'], ['Facebook', 'https://www.facebook.com/GNC-3on3-101368258807208'], ['TikTok', 'https://www.tiktok.com/@gnc_3on3'], ['YouTube', 'https://www.youtube.com/channel/UCdchPP-K0RjIQG9G68nd4hw']].map(([n, u]) => <a key={n} href={u} target="_blank" rel="noreferrer" className="mb-[9px] block hover:text-white">{n}</a>)}
        <a href="mailto:gnc3on3@gmail.com" className="mt-2 block text-white">gnc3on3@gmail.com</a>
      </div>
    </div>
  )
  const legal = (
    <div className={cn('flex justify-between pt-[22px] text-[12px] text-mute', finale ? 'mt-8' : 'mt-14 border-t border-line')}>
      <span>© {new Date().getFullYear()} Greek National Challenge 3on3 · <Link to="/oroi" className="hover:text-white">{t.footer.terms}</Link> · {t.footer.privacy}</span>
      <span>EL / EN</span>
    </div>
  )

  if (!finale) return <footer className="wrap pb-10 pt-[100px]">{columns}{legal}</footer>

  return (
    <footer className="relative mt-[110px] overflow-hidden">
      {/* photo behind everything */}
      <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,11,1)_0%,rgba(10,10,11,.35)_22%,rgba(10,10,11,.45)_75%,rgba(10,10,11,.96)_100%)]" />

      <div className="wrap relative z-10 pb-10 pt-[70px]">
        {/* partners strip */}
        <div className="kicker mb-[14px]">{t.sections.sponsors}</div>
        <div className="glass overflow-hidden rounded-[18px]">
          <Marquee duration={30} className="py-[22px]">
            {sponsorList.map(s => <a key={s.name} href={s.url} target="_blank" rel="noreferrer" className="disp whitespace-nowrap text-[32px] font-bold tracking-[.04em] text-[#9a9fa3] hover:text-white">{s.logo ? <img src={s.logo} alt={s.name} className="h-[44px] w-auto opacity-80 hover:opacity-100" /> : s.name}</a>)}
          </Marquee>
        </div>

        {/* newsletter */}
        <div className="glass mt-6 grid items-center gap-8 rounded-band p-7 md:grid-cols-[1.2fr_1fr] md:p-12">
          <div>
            <Heading a={t.sections.newsletter1} b={t.sections.newsletter2} />
            <p className="mt-3 max-w-[520px] text-[15px] text-cement">{t.misc.newsletterBlurb}</p>
          </div>
          <form className="flex gap-[10px]" onSubmit={e => e.preventDefault()}>
            <input type="email" placeholder={t.misc.email} className="min-w-0 flex-1 rounded-full border border-white/20 bg-black/25 px-[18px] py-4 text-[14px] outline-none placeholder:text-dim focus:border-white/40" />
            <Button className="rounded-full">{t.misc.subscribe}</Button>
          </form>
        </div>

        {/* link columns */}
        <div className="glass mt-6 rounded-band p-7 md:p-10">{columns}</div>
        {legal}
      </div>
    </footer>
  )
}
