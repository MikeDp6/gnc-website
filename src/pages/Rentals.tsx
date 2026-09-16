import { useState, type FormEvent } from 'react'
import { useData } from '@/data/store'
import { Heading } from '@/components/ui/Heading'
import { Crumb } from '@/components/ui/Crumb'
import { Button } from '@/components/ui/Button'
import { Field, SelectInput, TextArea, TextInput } from '@/components/ui/Form'
import { submitContact } from '@/lib/publicApi'

export function Rentals() {
  const { rentals } = useData()
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [item, setItem] = useState('')
  const submit = async (e: FormEvent) => {
    e.preventDefault(); const f = new FormData(e.currentTarget as HTMLFormElement)
    try { await submitContact('quote', { name: String(f.get('name')), email: String(f.get('email')), phone: String(f.get('phone')), org: String(f.get('org')), item, eventDate: String(f.get('date')), message: String(f.get('message')) }); setSent(true) } catch (x) { setErr((x as Error).message) }
  }
  return (
    <>
      <Crumb items={[{ label: 'Ενοικιάσεις & διοργάνωση' }]} />
      <section className="wrap pt-6">
        <Heading a="Ενοικιάσεις" b="& διοργάνωση" />
        <p className="mt-4 max-w-[640px] text-[16px] text-dim">Η GNC στήνει τουρνουά 3on3 από το 2018 σε 25 πόλεις. Ό,τι χρησιμοποιούμε στα δικά μας τουρνουά — γήπεδα, γραμματεία, scoreboard, ηχητικά — το διαθέτουμε σε δήμους, εταιρείες, σχολεία και συλλόγους, με ή χωρίς τη δική μας ομάδα.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {rentals.map(r => (
            <button type="button" key={r.id} onClick={() => { setItem(r.name); document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' }) }} className="card pop flex flex-col overflow-hidden rounded-[18px] text-left">
              <div className="flex h-[170px] items-center justify-center bg-[linear-gradient(135deg,rgba(16,114,255,.25),rgba(255,135,0,.18))]"><span className="disp text-[64px] text-white/20">GNC</span></div>
              <div className="flex flex-1 flex-col px-[18px] pb-5 pt-4">
                <div className="disp text-[30px]">{r.name}</div>
                <div className="mt-2 flex-1 text-[13px] text-dim">{r.blurb}</div>
                <div className="mt-4 text-[13px] font-bold text-orange">{r.price} →</div>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <Heading a="Πώς" b="δουλεύει" size="md" />
            <ol className="mt-6 space-y-4 text-[15px] text-dim">
              <li className="flex gap-4"><b className="mono text-orange">01</b>Μας λες τι θέλεις να κάνεις: ημερομηνία, χώρο, αριθμό συμμετεχόντων, αν θες μόνο εξοπλισμό ή και διοργάνωση.</li>
              <li className="flex gap-4"><b className="mono text-orange">02</b>Σου στέλνουμε προσφορά μέσα σε 2 εργάσιμες, με ό,τι περιλαμβάνει (μεταφορά, στήσιμο, προσωπικό).</li>
              <li className="flex gap-4"><b className="mono text-orange">03</b>Την ημέρα της εκδήλωσης η ομάδα μας στήνει, τρέχει το πρόγραμμα με το ίδιο σύστημα που βλέπεις εδώ, και μαζεύει.</li>
            </ol>
          </div>
          <form id="quote" onSubmit={submit} className="card grid gap-4 rounded-band p-6 md:grid-cols-2 md:p-8">
            <div className="md:col-span-2"><div className="disp text-[36px]">Ζήτησε <span className="text-orange">προσφορά</span></div></div>
            {sent ? <div className="rounded-[10px] bg-ok/15 p-5 text-[14px] md:col-span-2">Ευχαριστούμε — θα επικοινωνήσουμε μέσα σε 2 εργάσιμες.</div> : (
              <>
                <Field label="Όνομα"><TextInput name="name" required /></Field>
                <Field label="Φορέας / εταιρεία"><TextInput name="org" /></Field>
                <Field label="Email"><TextInput name="email" type="email" required /></Field>
                <Field label="Τηλέφωνο"><TextInput name="phone" type="tel" /></Field>
                <Field label="Τι σε ενδιαφέρει"><SelectInput value={item} onChange={e => setItem(e.target.value)}><option value="">—</option>{rentals.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}</SelectInput></Field>
                <Field label="Ημερομηνία (κατά προσέγγιση)"><TextInput name="date" type="date" /></Field>
                <Field label="Λίγα λόγια" className="md:col-span-2"><TextArea name="message" rows={4} placeholder="Πόλη, χώρος, αριθμός συμμετεχόντων, τι περιμένεις από εμάς." /></Field>
                {err && <div className="rounded-[10px] border border-red/60 bg-red/10 px-4 py-3 text-[13px] md:col-span-2">{err}</div>}
                <div className="md:col-span-2"><Button type="submit" variant="orange">Αποστολή</Button></div>
              </>
            )}
          </form>
        </div>
      </section>
    </>
  )
}
