import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { createTournament, listCities, listTournaments, type TournamentInput } from '@/lib/adminApi'
import { Btn, Field, Input, PageTitle, Select, Toast, slugify } from '../ui'

type T = TournamentInput & { id: string }
const STATUS: Record<string, string> = { draft: 'Πρόχειρο', registration: 'Δηλώσεις', upcoming: 'Επερχόμενο', live: 'Σε εξέλιξη', done: 'Ολοκληρώθηκε', archived: 'Αρχείο' }

export function Tournaments() {
  const [rows, setRows] = useState<T[]>([])
  const [cities, setCities] = useState<Array<{ id: string; name: string }>>([])
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [f, setF] = useState({ name: '', city_id: '', venue: '', starts_on: '', ends_on: '', courts: 2 })
  const load = () => listTournaments().then(setRows).catch(e => setToast(e.message))
  useEffect(() => { load(); listCities().then(setCities).catch(() => {}) }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const slug = slugify(`${f.name}-${f.starts_on.slice(0, 4)}`)
      await createTournament({ slug, name: f.name, city_id: f.city_id || null, venue: f.venue || null, starts_on: f.starts_on, ends_on: f.ends_on || f.starts_on, courts: f.courts, status: 'draft', is_public: false })
      setOpen(false); setF({ name: '', city_id: '', venue: '', starts_on: '', ends_on: '', courts: 2 }); setToast('Δημιουργήθηκε'); load()
    } catch (err) { setToast((err as Error).message) }
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <>
      <PageTitle a="Διοργανώσεις" right={<Btn variant="orange" onClick={() => setOpen(o => !o)}>{open ? 'Άκυρο' : '+ Νέα διοργάνωση'}</Btn>} />
      {open && (
        <form onSubmit={submit} className="card mb-6 grid gap-4 p-5 md:grid-cols-3">
          <Field label="Όνομα" className="md:col-span-2"><Input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Λυκόβρυση–Πεύκη 2026" /></Field>
          <Field label="Πόλη"><Select value={f.city_id} onChange={e => setF({ ...f, city_id: e.target.value })}><option value="">—</option>{cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
          <Field label="Γήπεδο / χώρος" className="md:col-span-2"><Input value={f.venue} onChange={e => setF({ ...f, venue: e.target.value })} /></Field>
          <Field label="Γήπεδα (αριθμός)"><Input type="number" min={1} max={6} value={f.courts} onChange={e => setF({ ...f, courts: +e.target.value })} /></Field>
          <Field label="Από"><Input type="date" required value={f.starts_on} onChange={e => setF({ ...f, starts_on: e.target.value, ends_on: f.ends_on || e.target.value })} /></Field>
          <Field label="Έως"><Input type="date" value={f.ends_on} onChange={e => setF({ ...f, ends_on: e.target.value })} /></Field>
          <div className="flex items-end"><Btn type="submit">Δημιουργία</Btn></div>
          <div className="text-[12px] text-mute md:col-span-3">Δημιουργείται σε κατάσταση «Πρόχειρο» και δεν φαίνεται στο site μέχρι να το κάνεις δημόσιο. Μία ημέρα ανά ημερολογιακή μέρα.</div>
        </form>
      )}
      <div className="card overflow-hidden">
        <table className="w-full text-[14px]">
          <thead><tr className="text-left text-[11px] uppercase tracking-[.12em] text-dim"><th className="px-4 py-3">Διοργάνωση</th><th className="px-4 py-3">Ημερομηνίες</th><th className="px-4 py-3">Κατάσταση</th><th className="px-4 py-3">Δημόσιο</th><th /></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t border-line">
                <td className="px-4 py-3 font-semibold"><Link to={`/admin/tournaments/${r.id}`} className="hover:text-orange">{r.name}</Link><div className="text-[12px] font-normal text-dim">/{r.slug}</div></td>
                <td className="mono px-4 py-3">{r.starts_on} → {r.ends_on}</td>
                <td className="px-4 py-3">{STATUS[r.status] ?? r.status}</td>
                <td className="px-4 py-3">{r.is_public ? <span className="text-ok">✓</span> : <span className="text-mute">—</span>}</td>
                <td className="px-4 py-3 text-right"><Link to={`/admin/tournaments/${r.id}`} className="text-[12px] font-bold uppercase tracking-[.08em] text-orange">Άνοιγμα →</Link></td>
              </tr>
            ))}
            {!rows.length && <tr><td className="px-4 py-6 text-dim" colSpan={5}>Καμία διοργάνωση ακόμη.</td></tr>}
          </tbody>
        </table>
      </div>
      <Toast msg={toast} />
    </>
  )
}
