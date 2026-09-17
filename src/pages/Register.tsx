import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '@/data/store'
import { catColor } from '@/lib/categories'
import { Heading } from '@/components/ui/Heading'
import { useMeta } from '@/lib/meta'
import { useSearchParams } from 'react-router-dom'
import { Crumb } from '@/components/ui/Crumb'
import { Button } from '@/components/ui/Button'
import { Field, SelectInput, Steps, TextInput } from '@/components/ui/Form'
import { cn } from '@/lib/cn'
import { registerTeam } from '@/lib/publicApi'

const STEPS = ['Διοργάνωση', 'Ομάδα & αρχηγός', 'Συμπαίκτες']
const MINOR = ['u11', 'u13', 'u15', 'u18']

/** Team registration — UI only for now; the submit will create teams(status='pending') + players + invite links. */
export function Register() {
  useMeta('Δήλωσε ομάδα', 'Δήλωσε την ομάδα σου σε διοργάνωση GNC 3on3. Δωρεάν συμμετοχή, κατηγορίες από U11 έως 35+.')
  const { tournaments, categories, categoryById } = useData()
  const open = tournaments.filter(t => t.status === 'registration' || t.status === 'upcoming')
  const [params] = useSearchParams()
  // the programme page links straight here with the stop already chosen
  const asked = open.find(x => x.slug === params.get('t'))
  const [step, setStep] = useState(0)
  const [tid, setTid] = useState(asked?.id ?? open[0]?.id ?? '')
  const [cid, setCid] = useState('')
  const [team, setTeam] = useState({ name: '', city: '' })
  const [cap, setCap] = useState({ first: '', last: '', email: '', phone: '', birth: '', guardian: '', consent: false })
  const [mates, setMates] = useState(['', '', ''])
  const [done, setDone] = useState<{ code: string; status: string } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const tour = tournaments.find(t => t.id === tid)
  const cats = useMemo(() => tour ? categories.filter(c => tour.categoryIds.includes(c.id)) : [], [tour, categories])
  const minor = cid ? MINOR.includes(categoryById(cid).key) : false
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!tour || !cid) return
    setBusy(true); setErr(null)
    try {
      const r = await registerTeam({ tournamentId: tour.id, categoryId: cid, teamName: team.name, city: team.city, first: cap.first, last: cap.last, email: cap.email, phone: cap.phone, birthYear: cap.birth ? +cap.birth : undefined, guardian: minor ? cap.guardian : undefined, mates })
      setDone({ code: r.invite_code, status: r.status })
    } catch (x) { setErr((x as Error).message) }
    setBusy(false)
  }

  return (
    <>
      <Crumb items={[{ label: 'Δήλωση ομάδας' }]} />
      <section className="wrap pt-6">
        <Heading a="Δήλωσε" b="ομάδα" as="h1" />
        <p className="mt-4 max-w-[600px] text-[15px] text-dim">Τρία λεπτά από το κινητό. Δηλώνεις ομάδα και κατηγορία, δίνεις τα στοιχεία σου ως αρχηγός, και στέλνεις σύνδεσμο πρόσκλησης στους συμπαίκτες σου — ο καθένας συμπληρώνει μόνο τα δικά του.</p>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <form onSubmit={submit} className="card rounded-band p-6 md:p-8">
            <Steps steps={STEPS} current={done ? 3 : step} />
            {err && <div className="mb-4 rounded-[10px] border border-red/60 bg-red/10 px-4 py-3 text-[13px]">{err}</div>}
            {done ? (
              <div>
                <div className="disp text-[44px] text-ok">{done.status === 'waitlist' ? 'Μπήκες στη λίστα αναμονής' : 'Η δήλωση καταχωρήθηκε'}</div>
                <p className="mt-3 text-[15px] text-dim">Η ομάδα <b className="text-white">{team.name}</b> {done.status === 'waitlist' ? 'μπήκε στη λίστα αναμονής της κατηγορίας' : 'μπήκε ως «Εκκρεμεί» στην κατηγορία'} {cid && categoryById(cid).name}. Θα λάβεις email επιβεβαίωσης όταν εγκριθεί από τη διοργάνωση.</p>
                <div className="mt-6 rounded-[14px] border border-orange/60 bg-orange/10 p-5">
                  <div className="kicker mb-2">Σύνδεσμος πρόσκλησης συμπαικτών</div>
                  <div className="mono break-all text-[15px] font-bold">{window.location.origin}/join/{done.code}</div>
                  <p className="mt-3 text-[12px] text-orange-soft">Ο σύνδεσμος δεν χάνεται: μπες με το ίδιο email στον <b>λογαριασμό σου</b> και θα τον βρίσκεις πάντα εκεί, μαζί με το ποιοι συμπαίκτες μπήκαν.</p>
                <div className="mt-3 flex flex-wrap gap-2"><Button variant="orange" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/join/${done.code}`)}>Αντιγραφή</Button><Button variant="ghost" href={`https://wa.me/?text=${encodeURIComponent(`Μπες στην ομάδα ${team.name} για το ${tour?.name}: ${window.location.origin}/join/${done.code}`)}`}>WhatsApp</Button><Button variant="ghost" href={`viber://forward?text=${encodeURIComponent(`${window.location.origin}/join/${done.code}`)}`}>Viber</Button></div>
                </div>
              </div>
            ) : step === 0 ? (
              <div className="grid gap-4">
                <Field label="Διοργάνωση"><SelectInput value={tid} onChange={e => { setTid(e.target.value); setCid('') }}>{open.map(t => <option key={t.id} value={t.id}>{t.name} · {t.dates}</option>)}</SelectInput></Field>
                <div>
                  <div className="mb-2 text-[13px] font-semibold text-dim">Κατηγορία</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {cats.map(c => (
                      <button type="button" key={c.id} onClick={() => setCid(c.id)} className={cn('flex items-center gap-3 rounded-[12px] border px-4 py-3 text-left text-[14px] font-semibold', cid === c.id ? 'border-white bg-white/10' : 'border-line hover:border-white/30')}>
                        <i className="h-3 w-3 rounded-full" style={{ background: catColor[c.key] }} />{c.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end"><Button onClick={() => cid && setStep(1)} className={cn(!cid && 'opacity-50')}>Συνέχεια →</Button></div>
              </div>
            ) : step === 1 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Όνομα ομάδας" className="md:col-span-2"><TextInput required value={team.name} onChange={e => setTeam({ ...team, name: e.target.value })} placeholder="π.χ. Erasitechnes BC" /></Field>
                <Field label="Πόλη / περιοχή" className="md:col-span-2"><TextInput value={team.city} onChange={e => setTeam({ ...team, city: e.target.value })} /></Field>
                <div className="kicker md:col-span-2">Αρχηγός</div>
                <Field label="Όνομα"><TextInput required value={cap.first} onChange={e => setCap({ ...cap, first: e.target.value })} /></Field>
                <Field label="Επώνυμο"><TextInput required value={cap.last} onChange={e => setCap({ ...cap, last: e.target.value })} /></Field>
                <Field label="Email"><TextInput type="email" required value={cap.email} onChange={e => setCap({ ...cap, email: e.target.value })} /></Field>
                <Field label="Κινητό"><TextInput type="tel" required value={cap.phone} onChange={e => setCap({ ...cap, phone: e.target.value })} /></Field>
                <Field label="Έτος γέννησης" hint="Ελέγχεται με την κατηγορία"><TextInput type="number" min={1940} max={2020} value={cap.birth} onChange={e => setCap({ ...cap, birth: e.target.value })} /></Field>
                {minor && (
                  <>
                    <Field label="Ονοματεπώνυμο γονέα / κηδεμόνα"><TextInput required value={cap.guardian} onChange={e => setCap({ ...cap, guardian: e.target.value })} /></Field>
                    <label className="flex items-start gap-3 text-[13px] text-dim md:col-span-2"><input type="checkbox" required checked={cap.consent} onChange={e => setCap({ ...cap, consent: e.target.checked })} className="mt-1" />Ως γονέας/κηδεμόνας συναινώ στη συμμετοχή του ανηλίκου στη διοργάνωση και στη χρήση φωτογραφιών από την εκδήλωση.</label>
                  </>
                )}
                <div className="flex justify-between md:col-span-2"><Button variant="ghost" onClick={() => setStep(0)}>← Πίσω</Button><Button onClick={() => team.name && cap.first && cap.email && setStep(2)}>Συνέχεια →</Button></div>
              </div>
            ) : (
              <div className="grid gap-4">
                <p className="text-[14px] text-dim">Βάλε τα email 2–3 συμπαικτών. Τα κρατάμε για να τους στείλουμε την πρόσκληση· ώσπου να φτάσει, ο σύνδεσμος είναι στον <b className="text-white">λογαριασμό σου</b> και τον στέλνεις κι εσύ από WhatsApp ή Viber.</p>
                {mates.map((m, i) => <Field key={i} label={`Email συμπαίκτη ${i + 1}${i === 2 ? ' (προαιρετικός 4ος)' : ''}`}><TextInput type="email" value={m} onChange={e => setMates(mates.map((x, j) => j === i ? e.target.value : x))} placeholder="email@example.com" /></Field>)}
                <label className="flex items-start gap-3 text-[13px] text-dim"><input type="checkbox" required className="mt-1" />Αποδέχομαι τον <Link className="text-white underline" to="/kanonismoi">κανονισμό</Link> και τους <Link className="text-white underline" to="/oroi">όρους συμμετοχής</Link> της διοργάνωσης (4 παίκτες, μισό γήπεδο, 10΄ ή πρώτος στους 21).</label>
                <div className="flex justify-between"><Button variant="ghost" onClick={() => setStep(1)}>← Πίσω</Button><Button type="submit" variant="orange" className={cn(busy && 'opacity-50')}>{busy ? 'Καταχώρηση…' : 'Καταχώρηση δήλωσης'}</Button></div>
              </div>
            )}
          </form>
          <aside className="flex flex-col gap-4">
            <div className="card p-6">
              <div className="kicker mb-3">Τι χρειάζεσαι</div>
              <ul className="space-y-2 text-[14px] text-dim"><li>· Όνομα ομάδας</li><li>· Στοιχεία αρχηγού (email, κινητό)</li><li>· 2–3 συμπαίκτες (μπορούν να μπουν αργότερα)</li><li>· Γονική συναίνεση για U11–U18</li></ul>
            </div>
            <div className="card p-6">
              <div className="kicker mb-3">Μετά τη δήλωση</div>
              <ul className="space-y-2 text-[14px] text-dim"><li>· Έγκριση ή λίστα αναμονής από τη διοργάνωση</li><li>· Το πρόγραμμα με email και στο app</li><li>· Ειδοποίηση 15΄ πριν από κάθε αγώνα σου</li><li>· QR check-in στην είσοδο</li></ul>
            </div>
            {tour && <div className="card p-6"><div className="kicker mb-2">Επιλεγμένη διοργάνωση</div><div className="disp text-[30px]">{tour.name}</div><div className="mt-1 text-[13px] text-dim">{tour.dates} · {tour.venue}</div></div>}
          </aside>
        </div>
      </section>
    </>
  )
}
