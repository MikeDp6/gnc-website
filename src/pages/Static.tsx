import { Link } from 'react-router-dom'
import { Heading } from '@/components/ui/Heading'
import { Crumb } from '@/components/ui/Crumb'
import { Button } from '@/components/ui/Button'
import { Markdown } from '@/components/ui/Markdown'
import { aboutus, ethelontis, kanonismoi, oroi } from '@/content/pages'

function Page({ crumb, a, b, text, aside }: { crumb: string; a: string; b?: string; text: string; aside?: React.ReactNode }) {
  return (
    <>
      <Crumb items={[{ label: crumb }]} />
      <section className="wrap grid gap-10 pt-6 lg:grid-cols-[1fr_320px]">
        <div className="max-w-[820px]"><Heading a={a} b={b} /><Markdown text={text} /></div>
        {aside && <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">{aside}</aside>}
      </section>
    </>
  )
}

export const Rules = () => <Page crumb="Κανονισμοί" a="Κανονισμοί" b="3on3" text={kanonismoi} aside={
  <>
    <div className="card p-6"><div className="kicker mb-3">Με μια ματιά</div><ul className="space-y-2 text-[14px] text-dim"><li>· 4 παίκτες ανά ομάδα, 3 στο γήπεδο</li><li>· Μισό γήπεδο, ένα καλάθι, μπάλα Νο6</li><li>· 1 πόντος μέσα, 2 έξω από το τρίποντο</li><li>· 10΄ ή πρώτος στους 21</li><li>· Παράταση: πρώτος στους 2</li><li>· Ταυτότητα ή δελτίο Ε.Ο.Κ. μαζί σου</li></ul></div>
    <div className="card p-6"><div className="kicker mb-2">Όροι συμμετοχής</div><p className="text-[13px] text-dim">Η δήλωση ομάδας σημαίνει αποδοχή των όρων συμμετοχής.</p><Link to="/oroi" className="mt-3 inline-block text-[13px] font-bold uppercase tracking-[.08em] text-orange">Διάβασε τους όρους →</Link></div>
    <Button to="/register" variant="orange">Δήλωσε ομάδα</Button>
  </>
} />

export const About = () => <Page crumb="Ποιοι είμαστε" a="Ποιοι" b="είμαστε" text={aboutus} aside={
  <>
    <div className="card p-6"><div className="kicker mb-3">Σε αριθμούς</div><div className="grid grid-cols-2 gap-4"><div><b className="disp block text-[40px] text-orange">40</b><span className="text-[12px] text-dim">πόλεις</span></div><div><b className="disp block text-[40px] text-orange">2018</b><span className="text-[12px] text-dim">από</span></div><div><b className="disp block text-[40px] text-orange">26</b><span className="text-[12px] text-dim">διοργανώσεις το 2026</span></div><div><b className="disp block text-[40px] text-orange">0€</b><span className="text-[12px] text-dim">συμμετοχή</span></div></div></div>
    <div className="card p-6"><div className="kicker mb-2">FIBA</div><p className="text-[13px] text-dim">Εγκεκριμένη διοργάνωση 3×3 με επίσημους κανονισμούς FIBA και εξοπλισμό ολυμπιακών προδιαγραφών.</p></div>
    <Link to="/archive" className="text-[13px] font-bold uppercase tracking-[.08em] text-orange">Η περιοδεία →</Link>
  </>
} />

export const Volunteer = () => <Page crumb="Γίνε εθελοντής" a="Γίνε" b="εθελοντής" text={ethelontis.replace(/Φόρμα συμμετοχής: https?:\/\/\S+/, '')} aside={
  <>
    <div className="card p-6"><div className="kicker mb-3">Φόρμα εθελοντή</div><p className="mb-4 text-[13px] text-dim">Συμπλήρωσε τη φόρμα και θα επικοινωνήσουμε πριν την επόμενη διοργάνωση της περιοχής σου.</p><Button href="https://forms.gle/g2g7itHAB7sJa3ZF7" variant="orange">Συμπλήρωσε τη φόρμα ↗</Button></div>
  </>
} />

export const Terms = () => <Page crumb="Όροι συμμετοχής" a="Όροι" b="συμμετοχής" text={oroi} />
