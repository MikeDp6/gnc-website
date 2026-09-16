import { useState, type FormEvent } from 'react'
import { Heading } from '@/components/ui/Heading'
import { Crumb } from '@/components/ui/Crumb'
import { Button } from '@/components/ui/Button'
import { Field, SelectInput, TextArea, TextInput } from '@/components/ui/Form'

export function Contact() {
  const [sent, setSent] = useState(false)
  const submit = (e: FormEvent) => { e.preventDefault(); setSent(true) }
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
              <Field label="Όνομα"><TextInput required /></Field>
              <Field label="Email"><TextInput type="email" required /></Field>
              <Field label="Θέμα" className="md:col-span-2"><SelectInput><option>Ερώτηση για διοργάνωση</option><option>Χορηγία / συνεργασία</option><option>Ενοικίαση / διοργάνωση εκδήλωσης</option><option>Πρόταση πόλης</option><option>Τύπος</option><option>Άλλο</option></SelectInput></Field>
              <Field label="Μήνυμα" className="md:col-span-2"><TextArea rows={6} required /></Field>
              <div className="md:col-span-2"><Button variant="orange">Αποστολή</Button></div>
            </>
          )}
        </form>
      </section>
    </>
  )
}
