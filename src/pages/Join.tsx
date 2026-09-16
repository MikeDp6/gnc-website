import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { Heading } from '@/components/ui/Heading'
import { Crumb } from '@/components/ui/Crumb'
import { Button } from '@/components/ui/Button'
import { Field, TextInput } from '@/components/ui/Form'
import { joinTeam } from '@/lib/publicApi'

/** Teammate lands here from the captain's invite link and fills only their own details. */
export function Join() {
  const { code = '' } = useParams()
  const [f, setF] = useState({ first: '', last: '', email: '', phone: '', birth: '', guardian: '' })
  const [done, setDone] = useState<string | null>(null); const [err, setErr] = useState<string | null>(null)
  const minor = f.birth !== '' && +f.birth > new Date().getFullYear() - 18
  const submit = async (e: FormEvent) => { e.preventDefault(); setErr(null); try { const r = await joinTeam(code, { ...f, birthYear: f.birth ? +f.birth : undefined, guardian: minor ? f.guardian : undefined }); setDone(r.team_name) } catch (x) { setErr((x as Error).message) } }
  return (
    <>
      <Crumb items={[{ label: 'Πρόσκληση σε ομάδα' }]} />
      <section className="wrap max-w-[720px] pt-6">
        <Heading a="Μπες" b="στην ομάδα" />
        <p className="mt-4 text-[15px] text-dim">Σε προσκάλεσε ο αρχηγός σου. Συμπλήρωσε μόνο τα δικά σου στοιχεία — κωδικός πρόσκλησης <span className="mono text-white">{code}</span>.</p>
        {done ? <div className="card mt-8 p-8"><div className="disp text-[40px] text-ok">Είσαι μέσα</div><p className="mt-2 text-dim">Προστέθηκες στην ομάδα <b className="text-white">{done}</b>. Θα λάβεις το πρόγραμμα με email και στο app.</p></div> : (
          <form onSubmit={submit} className="card mt-8 grid gap-4 p-6 md:grid-cols-2 md:p-8">
            <Field label="Όνομα"><TextInput required value={f.first} onChange={e => setF({ ...f, first: e.target.value })} /></Field>
            <Field label="Επώνυμο"><TextInput required value={f.last} onChange={e => setF({ ...f, last: e.target.value })} /></Field>
            <Field label="Email"><TextInput type="email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></Field>
            <Field label="Κινητό"><TextInput type="tel" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></Field>
            <Field label="Έτος γέννησης"><TextInput type="number" min={1940} max={2020} value={f.birth} onChange={e => setF({ ...f, birth: e.target.value })} /></Field>
            {minor && <Field label="Ονοματεπώνυμο γονέα / κηδεμόνα"><TextInput required value={f.guardian} onChange={e => setF({ ...f, guardian: e.target.value })} /></Field>}
            {minor && <label className="flex items-start gap-3 text-[13px] text-dim md:col-span-2"><input type="checkbox" required className="mt-1" />Ως γονέας/κηδεμόνας συναινώ στη συμμετοχή του ανηλίκου.</label>}
            {err && <div className="rounded-[10px] border border-red/60 bg-red/10 px-4 py-3 text-[13px] md:col-span-2">{err}</div>}
            <div className="md:col-span-2"><Button type="submit" variant="orange">Μπες στην ομάδα</Button></div>
          </form>
        )}
      </section>
    </>
  )
}
