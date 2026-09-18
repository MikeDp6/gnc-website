import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Btn, Field, Input, PageTitle, Select, Toast } from '../ui'

type Row = { id: string; city_id: string | null; label: string | null; venue: string | null; starts_on: string; ends_on: string; done: boolean; registration_open: boolean; sort_order: number; poster_url: string | null }
type CityOpt = { id: string; name: string }

/**
 * Season calendar (the list on gnc3on3.gr/calendar): every stop of the year, even the ones that are not run
 * through the system. Tournaments managed here in the admin appear on the site separately (map + upcoming list).
 */
export function Season() {
  const [rows, setRows] = useState<Row[]>([])
  const [cities, setCities] = useState<CityOpt[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const say = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(null), 2500) }, [])
  const load = useCallback(async () => {
    if (!supabase) return
    const [a, b] = await Promise.all([supabase.from('season_events').select('*').order('starts_on'), supabase.from('cities').select('id,name').order('name')])
    if (a.error) say(a.error.message); else setRows(a.data as Row[])
    if (!b.error) setCities(b.data as CityOpt[])
  }, [say])
  useEffect(() => { load() }, [load])
  const [n, setN] = useState({ city_id: '', label: '', venue: '', starts_on: '', ends_on: '' })
  const add = async () => {
    if (!n.city_id || !n.starts_on) return say('Πόλη και ημερομηνία')
    const r = await supabase!.from('season_events').insert({ city_id: n.city_id, label: n.label || null, venue: n.venue || null, starts_on: n.starts_on, ends_on: n.ends_on || n.starts_on, done: false, registration_open: true, sort_order: rows.length + 1 })
    if (r.error) say(r.error.message); else { setN({ city_id: '', label: '', venue: '', starts_on: '', ends_on: '' }); say('Προστέθηκε'); load() }
  }
  const up = async (id: string, patch: Partial<Row>) => { const r = await supabase!.from('season_events').update(patch).eq('id', id); if (r.error) say(r.error.message); else load() }
  const del = async (id: string) => { if (!confirm('Διαγραφή;')) return; const r = await supabase!.from('season_events').delete().eq('id', id); if (r.error) say(r.error.message); else load() }
  const year = (iso: string) => iso.slice(0, 4)
  const years = [...new Set(rows.map(r => year(r.starts_on)))].sort().reverse()
  const [yr, setYr] = useState<string>('')
  const shown = rows.filter(r => !yr || year(r.starts_on) === yr)
  return (
    <>
      <PageTitle a="Ημερολόγιο" b="σεζόν" right={<Select value={yr} onChange={e => setYr(e.target.value)} className="w-[140px]"><option value="">Όλα τα έτη</option>{years.map(y => <option key={y}>{y}</option>)}</Select>} />
      <div className="card mb-6 grid gap-3 p-5 md:grid-cols-[1fr_1fr_1fr_150px_150px_auto]">
        <Field label="Πόλη"><Select value={n.city_id} onChange={e => setN({ ...n, city_id: e.target.value })}><option value="">—</option>{cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <Field label="Τίτλος (προαιρετικό)"><Input value={n.label} onChange={e => setN({ ...n, label: e.target.value })} placeholder="π.χ. Πάτρα Κώστας Πετρόπουλος" /></Field>
        <Field label="Χώρος"><Input value={n.venue} onChange={e => setN({ ...n, venue: e.target.value })} placeholder="Πλ. Γεωργίου" /></Field>
        <Field label="Από"><Input type="date" value={n.starts_on} onChange={e => setN({ ...n, starts_on: e.target.value })} /></Field>
        <Field label="Έως"><Input type="date" value={n.ends_on} onChange={e => setN({ ...n, ends_on: e.target.value })} /></Field>
        <div className="flex items-end"><Btn onClick={add}>+ Στάση</Btn></div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-[13px]">
          <thead><tr className="text-left text-[11px] uppercase tracking-[.12em] text-dim"><th className="px-3 py-2">Από</th><th className="px-3 py-2">Έως</th><th className="px-3 py-2">Πόλη</th><th className="px-3 py-2">Τίτλος</th><th className="px-3 py-2">Χώρος</th><th className="px-3 py-2">Αφίσα</th><th className="px-3 py-2">Δηλώσεις</th><th className="px-3 py-2">Έγινε</th><th /></tr></thead>
          <tbody>{shown.map(r => (
            <tr key={r.id} className="border-t border-line">
              <td className="px-3 py-1"><Input type="date" defaultValue={r.starts_on} onBlur={e => e.target.value !== r.starts_on && up(r.id, { starts_on: e.target.value })} className="w-[150px] py-1" /></td>
              <td className="px-3 py-1"><Input type="date" defaultValue={r.ends_on} onBlur={e => e.target.value !== r.ends_on && up(r.id, { ends_on: e.target.value })} className="w-[150px] py-1" /></td>
              <td className="px-3 py-1"><Select value={r.city_id ?? ''} onChange={e => up(r.id, { city_id: e.target.value || null })} className="py-1">{cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></td>
              <td className="px-3 py-1"><Input defaultValue={r.label ?? ''} onBlur={e => e.target.value !== (r.label ?? '') && up(r.id, { label: e.target.value || null })} className="py-1" /></td>
              <td className="px-3 py-1"><Input defaultValue={r.venue ?? ''} onBlur={e => e.target.value !== (r.venue ?? '') && up(r.id, { venue: e.target.value || null })} className="py-1" /></td>
              <td className="px-3 py-1"><Input defaultValue={r.poster_url ?? ''} placeholder="/img/wp/…" onBlur={e => e.target.value !== (r.poster_url ?? '') && up(r.id, { poster_url: e.target.value || null })} className="w-[230px] py-1" /></td>
              <td className="px-3 py-1 text-center"><input type="checkbox" checked={r.registration_open} onChange={e => up(r.id, { registration_open: e.target.checked })} /></td>
              <td className="px-3 py-1 text-center"><input type="checkbox" checked={r.done} onChange={e => up(r.id, { done: e.target.checked, registration_open: e.target.checked ? false : r.registration_open })} /></td>
              <td className="px-3 py-1 text-right"><button onClick={() => del(r.id)} className="text-mute hover:text-red">✕</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <Toast msg={toast} />
    </>
  )
}
