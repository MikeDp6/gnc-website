import { useState, type FormEvent } from 'react'
import { useI18n } from '@/i18n'
import { useMeta } from '@/lib/meta'
import { Heading } from '@/components/ui/Heading'
import { Crumb } from '@/components/ui/Crumb'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { Field, SelectInput, TextArea, TextInput } from '@/components/ui/Form'
import { submitContact } from '@/lib/publicApi'

const SOCIAL: Array<[string, string]> = [['Instagram', 'https://instagram.com/gnc_3on3'], ['Facebook', 'https://www.facebook.com/GNC-3on3-101368258807208'], ['TikTok', 'https://www.tiktok.com/@gnc_3on3'], ['YouTube', 'https://www.youtube.com/channel/UCdchPP-K0RjIQG9G68nd4hw']]

export function Contact() {
  const { t } = useI18n()
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  useMeta(t.contact.title1, 'gnc3on3@gmail.com · Πάτρα · Αθήνα')
  const submit = async (e: FormEvent) => {
    e.preventDefault(); const f = new FormData(e.currentTarget as HTMLFormElement)
    try { await submitContact('contact', { name: String(f.get('name')), email: String(f.get('email')), subject: String(f.get('subject')), message: String(f.get('message')) }); setSent(true) } catch (x) { setErr((x as Error).message) }
  }
  return (
    <>
      <Crumb items={[{ label: t.contact.title1 }]} />
      <section className="wrap grid gap-10 pt-6 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <Heading a={t.contact.title1} />
          <div className="mt-8 space-y-5 text-[15px]">
            {[[t.contact.email, <a key="m" href="mailto:gnc3on3@gmail.com" className="hover:text-orange">gnc3on3@gmail.com</a>], [t.contact.hq, 'Πάτρα · Αθήνα'], [t.contact.hours, t.contact.hoursV]].map(([k, v]) => (
              <div key={String(k)} className="border-t border-line pt-4"><div className="kicker mb-1">{k}</div><div className="font-semibold">{v}</div></div>
            ))}
            <div className="border-t border-line pt-4"><div className="kicker mb-2">{t.contact.social}</div><div className="flex flex-wrap gap-4 font-semibold">{SOCIAL.map(([s, u]) => <a key={s} href={u} target="_blank" rel="noreferrer" className="hover:text-orange">{s}</a>)}</div></div>
          </div>
          <div className="mt-8 text-[12px] text-mute">{t.contact.note}</div>
        </div>
        <Reveal as="div">
          <form onSubmit={submit} className="card grid gap-4 rounded-band p-6 md:grid-cols-2 md:p-8">
            {sent ? <div className="rounded-[10px] bg-ok/15 p-5 text-[14px] md:col-span-2">{t.contact.sent}</div> : (
              <>
                <Field label={t.contact.name}><TextInput name="name" required /></Field>
                <Field label="Email"><TextInput name="email" type="email" required /></Field>
                <Field label={t.contact.subject} className="md:col-span-2"><SelectInput name="subject"><option>Ερώτηση για διοργάνωση</option><option>Χορηγία / συνεργασία</option><option>Ενοικίαση / διοργάνωση εκδήλωσης</option><option>Πρόταση πόλης</option><option>Τύπος</option><option>Άλλο</option></SelectInput></Field>
                <Field label={t.contact.message} className="md:col-span-2"><TextArea name="message" rows={6} required /></Field>
                {err && <div className="rounded-[10px] border border-red/60 bg-red/10 px-4 py-3 text-[13px] md:col-span-2">{err}</div>}
                <div className="md:col-span-2"><Button type="submit" variant="orange">{t.contact.send}</Button></div>
              </>
            )}
          </form>
        </Reveal>
      </section>
    </>
  )
}
