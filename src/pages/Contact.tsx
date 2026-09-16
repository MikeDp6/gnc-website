import { useState, type FormEvent } from 'react'
import { Heading } from '@/components/ui/Heading'
import { Crumb } from '@/components/ui/Crumb'
import { Button } from '@/components/ui/Button'
import { Field, SelectInput, TextArea, TextInput } from '@/components/ui/Form'
import { submitContact } from '@/lib/publicApi'

export function Contact() {
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const submit = async (e: FormEvent) => {
    e.preventDefault(); const f = new FormData(e.currentTarget as HTMLFormElement)
    try { await submitContact('contact', { name: String(f.get('name')), email: String(f.get('email')), subject: String(f.get('subject')), message: String(f.get('message')) }); setSent(true) } catch (x) { setErr((x as Error).message) }
  }
  return (
    <>
      <Crumb items={[{ label: 'Επικοινωνία' }]} />
      <section className="wrap grid gap-10 pt-6 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <Heading a="Επικοι-" b="νωνία" />
          <div className="mt-8 space-y-5 text-[15px]">
            {[['Email', 'gnc3on3@gmail.com'], ['Έδρα', 'Πάτρα · Αθήνα'], ['Ώρες', 'Δευ–Παρ 10:00–18:00 · τις μέρες τουρνουά στο γήπεδο']].map(([k, v]) => (
              <div key={k} className="border-t border-line pt-4"><div className="kicker mb-1">{k}</div><div className="font-semibold">{v}</div></div>
            ))}
            <div className="border-t border-line pt-4"><div className="kicker mb-2">Social</div><div className="flex gap-4 font-semibold">{['Instagram', 'Facebook', 'TikTok', 'YouTube'].map(s => <span key={s} className="hover:text-orange">{s}</span>)}</div></div>
          </div>
          <div className="mt-8 text-[12px] text-mute">Για δηλώσεις ομάδων χρησιμοποίησε τη φόρμα δήλωσης — όχι το email — ώστε να μπεις αυτόματα στη λίστα.</div>
        </div>
        <form onSubmit={submit} className="card grid gap-4 rounded-band p-6 md:grid-cols-2 md:p-8">
          {sent ? <div className="rounded-[10px] bg-ok/15 p-5 text-[14px] md:col-span-2">Στάλθηκε. Απαντάμε συνήθως μέσα σε μία εργάσιμη.</div> : (
            <>
              <Field label="Όνομα"><TextInput name="name" required /></Field>
              <Field label="Email"><TextInput name="email" type="email" required /></Field>
              <Field label="Θέμα" className="md:col-span-2"><SelectInput name="subject"><option>Ερώτηση για διοργάνωση</option><option>Χορηγία / συνεργασία</option><option>Ενοικίαση / διοργάνωση εκδήλωσης</option><option>Πρόταση πόλης</option><option>Τύπος</option><option>Άλλο</option></SelectInput></Field>
              <Field label="Μήνυμα" className="md:col-span-2"><TextArea name="message" rows={6} required /></Field>
              {err && <div className="rounded-[10px] border border-red/60 bg-red/10 px-4 py-3 text-[13px] md:col-span-2">{err}</div>}
              <div className="md:col-span-2"><Button type="submit" variant="orange">Αποστολή</Button></div>
            </>
          )}
        </form>
      </section>
    </>
  )
}
