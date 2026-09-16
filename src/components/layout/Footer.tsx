import { useI18n } from '@/i18n'
import { Heading } from '@/components/ui/Heading'
import { Button } from '@/components/ui/Button'
import { Logo } from './Logo'

export function Footer({ newsletter = true }: { newsletter?: boolean }) {
  const { t } = useI18n()
  const col = (title: string, items: string[]) => (
    <div>
      <b className="mb-[14px] block text-[12px] uppercase tracking-[.14em] text-white">{title}</b>
      {items.map(i => <span key={i} className="mb-[9px] block hover:text-white">{i}</span>)}
    </div>
  )
  return (
    <footer className="wrap pb-10 pt-[100px]">
      {newsletter && (
        <div className="card mb-[60px] grid items-center gap-8 rounded-band p-7 md:grid-cols-[1.2fr_1fr] md:p-12">
          <div>
            <Heading a={t.sections.newsletter1} b={t.sections.newsletter2} />
            <p className="mt-3 max-w-[520px] text-[15px] text-dim">{t.misc.newsletterBlurb}</p>
          </div>
          <form className="flex gap-[10px]" onSubmit={e => e.preventDefault()}>
            <input type="email" placeholder={t.misc.email} className="min-w-0 flex-1 rounded-[10px] border border-line bg-transparent px-[18px] py-4 text-[14px] outline-none placeholder:text-mute focus:border-white/30" />
            <Button>{t.misc.subscribe}</Button>
          </form>
        </div>
      )}
      <div className="grid gap-8 text-[14px] text-dim md:grid-cols-[2fr_1fr_1fr_1fr_1.2fr]">
        <div>
          <Logo className="mb-[14px]" height={72} />
          <span className="block">{t.footer.tagline}</span>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-[9px] text-[12px] font-bold text-white">▲ App Store</span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-[9px] text-[12px] font-bold text-white">▶ Google Play</span>
          </div>
        </div>
        {col(t.nav.tournaments, ['Επόμενες', 'Πρόγραμμα', 'Αποτελέσματα', 'Αρχείο'])}
        {col(t.nav.teams, ['Δήλωση συμμετοχής', 'Κανονισμός', 'Κατηγορίες', 'Συχνές ερωτήσεις'])}
        {col('GNC', ['Ποιοι είμαστε', 'Κανονισμοί', 'Γίνε εθελοντής', 'Επικοινωνία'])}
        <div>
          <b className="mb-[14px] block text-[12px] uppercase tracking-[.14em] text-white">{t.misc.follow}</b>
          {[['Instagram', 'https://instagram.com/gnc_3on3'], ['Facebook', 'https://www.facebook.com/GNC-3on3-101368258807208'], ['TikTok', 'https://www.tiktok.com/@gnc_3on3'], ['YouTube', 'https://www.youtube.com/channel/UCdchPP-K0RjIQG9G68nd4hw']].map(([n, u]) => <a key={n} href={u} target="_blank" rel="noreferrer" className="mb-[9px] block hover:text-white">{n}</a>)}
          <a href="mailto:gnc3on3@gmail.com" className="mt-2 block text-white">gnc3on3@gmail.com</a>
        </div>
      </div>
      <div className="mt-14 flex justify-between border-t border-line pt-[22px] text-[12px] text-mute">
        <span>© {new Date().getFullYear()} GNC 3on3 · {t.footer.terms} · {t.footer.privacy}</span>
        <span>EL / EN</span>
      </div>
    </footer>
  )
}
