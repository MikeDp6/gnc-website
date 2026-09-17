import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Btn, Input, PageTitle, Toast, inputCls } from '../ui'
import { ImageField } from '../upload'

type Row = { id: string; name: string; blurb: string | null; price: string; image_url: string | null; sort_order: number; active: boolean }

/** Rentals / services shown on the site. Edit in place; changes save on blur. */
export function Rentals() {
  const [rows, setRows] = useState<Row[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const say = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(null), 2500) }, [])
  const load = useCallback(async () => { if (!supabase) return; const r = await supabase.from('rentals').select('*').order('sort_order'); if (r.error) say(r.error.message); else setRows(r.data as Row[]) }, [say])
  useEffect(() => { load() }, [load])
  const up = async (id: string, patch: Partial<Row>) => { const r = await supabase!.from('rentals').update(patch).eq('id', id); if (r.error) say(r.error.message); else load() }
  const del = async (id: string) => { if (!confirm('Διαγραφή;')) return; const r = await supabase!.from('rentals').delete().eq('id', id); if (r.error) say(r.error.message); else load() }
  const add = async () => { const r = await supabase!.from('rentals').insert({ name: 'Νέο είδος', sort_order: rows.length + 1 }); if (r.error) say(r.error.message); else load() }
  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= rows.length) return
    const a = rows[i], b = rows[j]
    await supabase!.from('rentals').update({ sort_order: b.sort_order }).eq('id', a.id)
    await supabase!.from('rentals').update({ sort_order: a.sort_order }).eq('id', b.id)
    load()
  }
  return (
    <>
      <PageTitle a="Ενοικιάσεις" b={`(${rows.length})`} right={<Btn onClick={add}>+ Είδος</Btn>} />
      <div className="grid gap-4">
        {rows.map((r, i) => (
          <div key={r.id} className={`card grid gap-4 p-4 md:grid-cols-[1fr_1.4fr] ${!r.active ? 'opacity-60' : ''}`}>
            <ImageField value={r.image_url} onChange={v => up(r.id, { image_url: v })} folder="rentals" label="" aspect="aspect-[4/3]" />
            <div className="grid gap-3">
              <div className="grid grid-cols-[1fr_180px] gap-3">
                <Input defaultValue={r.name} onBlur={e => e.target.value !== r.name && up(r.id, { name: e.target.value })} className="font-bold" />
                <Input defaultValue={r.price} onBlur={e => e.target.value !== r.price && up(r.id, { price: e.target.value })} placeholder="Ζήτησε προσφορά" />
              </div>
              <textarea defaultValue={r.blurb ?? ''} onBlur={e => e.target.value !== (r.blurb ?? '') && up(r.id, { blurb: e.target.value || null })} rows={3} className={inputCls} placeholder="Περιγραφή" />
              <div className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={r.active} onChange={e => up(r.id, { active: e.target.checked })} />Εμφανίζεται</label>
                  <button type="button" onClick={() => move(i, -1)} className="text-dim hover:text-white">↑</button><button type="button" onClick={() => move(i, 1)} className="text-dim hover:text-white">↓</button>
                </div>
                <button type="button" onClick={() => del(r.id)} className="text-mute hover:text-red">Διαγραφή</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Toast msg={toast} />
    </>
  )
}
