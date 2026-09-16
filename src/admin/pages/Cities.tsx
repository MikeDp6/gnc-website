import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Btn, Field, Input, PageTitle, Toast, slugify } from '../ui'

type CityRow = { id: string; name: string; name_en: string | null; region: string | null; lat: number | null; lng: number | null; sort_order: number }

/** Cities = pins on the map. Name + coordinates; the site projects them itself. */
export function Cities() {
  const [rows, setRows] = useState<CityRow[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const say = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(null), 2500) }, [])
  const load = useCallback(async () => { if (!supabase) return; const r = await supabase.from('cities').select('*').order('sort_order'); if (r.error) say(r.error.message); else setRows(r.data as CityRow[]) }, [say])
  useEffect(() => { load() }, [load])
  const [n, setN] = useState({ name: '', name_en: '', lat: '', lng: '' })
  const add = async () => {
    if (!n.name || !n.lat || !n.lng) return say('Όνομα και συντεταγμένες')
    const r = await supabase!.from('cities').insert({ id: slugify(n.name_en || n.name), name: n.name, name_en: n.name_en || null, lat: +n.lat, lng: +n.lng, sort_order: rows.length + 1 })
    if (r.error) say(r.error.message); else { setN({ name: '', name_en: '', lat: '', lng: '' }); say('Προστέθηκε'); load() }
  }
  const up = async (id: string, patch: Partial<CityRow>) => { const r = await supabase!.from('cities').update(patch).eq('id', id); if (r.error) say(r.error.message); else load() }
  const del = async (id: string) => { if (!confirm('Διαγραφή πόλης; Οι διοργανώσεις της χάνουν τη σύνδεση.')) return; const r = await supabase!.from('cities').delete().eq('id', id); if (r.error) say(r.error.message); else load() }
  return (
    <>
      <PageTitle a="Πόλεις" b={`(${rows.length})`} />
      <div className="card mb-6 grid gap-3 p-5 md:grid-cols-[1.2fr_1fr_120px_120px_auto]">
        <Field label="Όνομα"><Input value={n.name} onChange={e => setN({ ...n, name: e.target.value })} placeholder="Ναύπλιο" /></Field>
        <Field label="Όνομα (EN)"><Input value={n.name_en} onChange={e => setN({ ...n, name_en: e.target.value })} placeholder="Nafplio" /></Field>
        <Field label="Lat"><Input value={n.lat} onChange={e => setN({ ...n, lat: e.target.value })} placeholder="37.568" /></Field>
        <Field label="Lng"><Input value={n.lng} onChange={e => setN({ ...n, lng: e.target.value })} placeholder="22.808" /></Field>
        <div className="flex items-end"><Btn onClick={add}>+ Πόλη</Btn></div>
        <div className="text-[12px] text-mute md:col-span-5">Συντεταγμένες: Google Maps → δεξί κλικ στην πόλη → το πρώτο ζευγάρι αριθμών (γεωγρ. πλάτος, μήκος). Η κουκκίδα εμφανίζεται αμέσως στον χάρτη.</div>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead><tr className="text-left text-[11px] uppercase tracking-[.12em] text-dim"><th className="px-3 py-2">#</th><th className="px-3 py-2">Πόλη</th><th className="px-3 py-2">EN</th><th className="px-3 py-2">Lat</th><th className="px-3 py-2">Lng</th><th /></tr></thead>
          <tbody>{rows.map(c => (
            <tr key={c.id} className="border-t border-line">
              <td className="mono px-3 py-1 text-dim">{c.sort_order}</td>
              <td className="px-3 py-1"><Input defaultValue={c.name} onBlur={e => e.target.value !== c.name && up(c.id, { name: e.target.value })} className="py-1" /></td>
              <td className="px-3 py-1"><Input defaultValue={c.name_en ?? ''} onBlur={e => e.target.value !== (c.name_en ?? '') && up(c.id, { name_en: e.target.value || null })} className="py-1" /></td>
              <td className="px-3 py-1"><Input defaultValue={c.lat ?? ''} onBlur={e => +e.target.value !== c.lat && up(c.id, { lat: +e.target.value })} className="mono w-[110px] py-1" /></td>
              <td className="px-3 py-1"><Input defaultValue={c.lng ?? ''} onBlur={e => +e.target.value !== c.lng && up(c.id, { lng: +e.target.value })} className="mono w-[110px] py-1" /></td>
              <td className="px-3 py-1 text-right"><button onClick={() => del(c.id)} className="text-mute hover:text-red">✕</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <Toast msg={toast} />
    </>
  )
}
