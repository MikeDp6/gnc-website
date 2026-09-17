import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { useData } from '@/data/store'
import { Heading } from '@/components/ui/Heading'
import { Button } from '@/components/ui/Button'
import { Marquee } from '@/components/ui/Marquee'
import { Logo } from './Logo'
import { SponsorLogo } from '@/components/SponsorLogo'
import { cn } from '@/lib/cn'
import { subscribe } from '@/lib/publicApi'

/**
 * Footer. With `finale` (home page) it becomes the BIFA-style last screen: a photo behind everything,
 * partners strip + newsletter + link columns all sitting in glass panels.
 */
export function Footer({ finale = false, photo = '/img/hero-dark.jpg' }: { finale?: boolean; photo?: string }) {
  const { t, lang } = useI18n()
  const [mail, setMail] = useState({ v: '', state: '' as '' | 'ok' | 'busy' | 'err', msg: '' })
  const send = async (e: FormEvent) => {
    e.preventDefault()
    if (!mail.v.trim()) return
    setMail(m => ({ ...m, state: 'busy' }))
    try { await subscribe(mail.v.trim(), lang); setMail({ v: '', state: 'ok', msg: '' }) }
    catch (x) { setMail(m => ({ ...m, state: 'err', msg: (x as Error).message })) }
  }
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
      {lcol('Διοργανώσεις', [['Επόμενες', '/'], ['Αρχείο & περιοδεία', '/archive'], ['Κατάταξη', '/rankings'], ['News', '/news'], ['Ενοικιάσεις', '/rentals']])}
      {lcol(t.nav.teams, [['Δήλωση συμμετοχής', '/register'], ['Ο λογαριασμός μου', '/me'], ['Κανονισμοί', '/kanonismoi'], ['Όροι συμμετοχής', '/oroi']])}
      {lcol('GNC', [['Ποιοι είμαστε', '/about'], ['Χορηγοί', '/sponsors'], ['Γίνε εθελοντής', '/volunteer'], ['Επικοινωνία', '/contact']])}
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

  const partners = (
    <>
      <div className="mb-[14px] flex items-end justify-between"><span className="kicker">{t.sections.sponsors}</span><Link to="/sponsors" className="text-[12px] font-bold uppercase tracking-[.08em] text-orange">{t.sponsors.cta} →</Link></div>
      <div className="glass overflow-hidden rounded-[18px]">
        <Marquee duration={30} className="py-[22px]">
          {sponsorList.map(s => <SponsorLogo key={s.name} s={s} />)}
        </Marquee>
      </div>
    </>
  )

  if (!finale) return <footer className="wrap pb-10 pt-[100px]">{partners}<div className="mt-12">{columns}</div>{legal}</footer>

  return (
    <footer className="relative mt-[110px] overflow-hidden">
      {/* photo behind everything */}
      <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,11,1)_0%,rgba(10,10,11,.35)_22%,rgba(10,10,11,.45)_75%,rgba(10,10,11,.96)_100%)]" />

      <div className="wrap relative z-10 pb-10 pt-[70px]">
        {partners}

        {/* newsletter */}
        <div className="glass mt-6 grid items-center gap-8 rounded-band p-7 md:grid-cols-[1.2fr_1fr] md:p-12">
          <div>
            <Heading a={t.sections.newsletter1} b={t.sections.newsletter2} />
            <p className="mt-3 max-w-[520px] text-[15px] text-cement">{t.misc.newsletterBlurb}</p>
          </div>
          <div className="min-w-0">
            {mail.state === 'ok'
              ? <div className="rounded-full bg-ok/15 px-5 py-4 text-center text-[14px]">{t.misc.subscribed}</div>
              : <form className="flex gap-[10px]" onSubmit={send}>
                  <input type="email" required value={mail.v} onChange={e => setMail({ v: e.target.value, state: '', msg: '' })} placeholder={t.misc.email} className="min-w-0 flex-1 rounded-full border border-white/20 bg-black/25 px-[18px] py-4 text-[14px] outline-none placeholder:text-dim focus:border-white/40" />
                  <Button type="submit" className="rounded-full">{mail.state === 'busy' ? '…' : t.misc.subscribe}</Button>
                </form>}
            {mail.state === 'err' && <div className="mt-2 text-[12px] text-red">{mail.msg}</div>}
          </div>
        </div>

        {/* link columns */}
        <div className="glass mt-6 rounded-band p-7 md:p-10">{columns}</div>
        {legal}
      </div>
    </footer>
  )
}
