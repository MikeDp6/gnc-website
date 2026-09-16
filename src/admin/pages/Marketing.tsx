import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Btn, Field, Input, PageTitle, Select, Toast } from '../ui'

type Tick = { id: string; tag: string; text: string; text_en: string | null; tone: 'blue' | 'orange'; active: boolean; sort_order: number }
type Sp = { id: string; name: string; url: string | null; logo_url: string | null; active: boolean; sort_order: number }

export function Marketing() {
  const [ticks, setTicks] = useState<Tick[]>([]); const [sps, setSps] = useState<Sp[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const say = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(null), 2500) }, [])
  const load = useCallback(async () => {
    if (!supabase) return
    const a = await supabase.from('ticker_items').select('*').order('sort_order'); if (a.error) say(a.error.message); else setTicks(a.data as Tick[])
    const b = await supabase.from('sponsors').select('*').order('sort_order'); if (b.error) say(b.error.message); else setSps(b.data as Sp[])
  }, [say])
  useEffect(() => { load() }, [load])
  const up = async (table: 'ticker_items' | 'sponsors', id: string, patch: Record<string, unknown>) => { const r = await supabase!.from(table).update(patch).eq('id', id); if (r.error) say(r.error.message); else load() }
  const del = async (table: 'ticker_items' | 'sponsors', id: string) => { if (!confirm('Διαγραφή;')) return; const r = await supabase!.from(table).delete().eq('id', id); if (r.error) say(r.error.message); else load() }
  const [nt, setNt] = useState({ tag: '', text: '', tone: 'blue' as 'blue' | 'orange' })
  const [ns, setNs] = useState('')
  const addTick = async () => { const r = await supabase!.from('ticker_items').insert({ ...nt, sort_order: ticks.length + 1 }); if (r.error) say(r.error.message); else { setNt({ tag: '', text: '', tone: 'blue' }); load() } }
  const addSp = async () => { const r = await supabase!.from('sponsors').insert({ name: ns, sort_order: sps.length + 1 }); if (r.error) say(r.error.message); else { setNs(''); load() } }
  return (
    <>
      <PageTitle a="Ticker" b="& χορηγοί" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="kicker mb-3">Ticker (η λωρίδα πάνω-πάνω)</div>
          {ticks.map(t => (
            <div key={t.id} className="grid grid-cols-[90px_1fr_auto_auto_auto] items-center gap-2 border-t border-line py-2 text-[13px]">
              <Input value={t.tag} onChange={e => up('ticker_items', t.id, { tag: e.target.value })} className="py-1" />
              <Input value={t.text} onChange={e => up('ticker_items', t.id, { text: e.target.value })} className="py-1" />
              <Select value={t.tone} onChange={e => up('ticker_items', t.id, { tone: e.target.value })} className="w-[100px] py-1"><option value="blue">Μπλε</option><option value="orange">Πορτοκαλί</option></Select>
              <input type="checkbox" checked={t.active} onChange={e => up('ticker_items', t.id, { active: e.target.checked })} title="Ενεργό" />
              <button onClick={() => del('ticker_items', t.id)} className="text-mute hover:text-red">✕</button>
            </div>
          ))}
          <div className="mt-4 grid grid-cols-[90px_1fr_auto_auto] gap-2 border-t border-line pt-4">
            <Input placeholder="ΕΠΟΜΕΝΟ" value={nt.tag} onChange={e => setNt({ ...nt, tag: e.target.value })} className="py-1" />
            <Input placeholder="Κείμενο" value={nt.text} onChange={e => setNt({ ...nt, text: e.target.value })} className="py-1" />
            <Select value={nt.tone} onChange={e => setNt({ ...nt, tone: e.target.value as 'blue' | 'orange' })} className="w-[100px] py-1"><option value="blue">Μπλε</option><option value="orange">Πορτοκαλί</option></Select>
            <Btn onClick={addTick} className="py-1">+</Btn>
          </div>
        </div>
        <div className="card p-5">
          <div className="kicker mb-3">Χορηγοί</div>
          {sps.map(s => (
            <div key={s.id} className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-2 border-t border-line py-2 text-[13px]">
              <Input value={s.name} onChange={e => up('sponsors', s.id, { name: e.target.value })} className="py-1" />
              <Input value={s.logo_url ?? ''} placeholder="URL λογότυπου" onChange={e => up('sponsors', s.id, { logo_url: e.target.value || null })} className="py-1" />
              <input type="checkbox" checked={s.active} onChange={e => up('sponsors', s.id, { active: e.target.checked })} title="Ενεργός" />
              <button onClick={() => del('sponsors', s.id)} className="text-mute hover:text-red">✕</button>
            </div>
          ))}
          <div className="mt-4 flex gap-2 border-t border-line pt-4"><Input placeholder="Όνομα χορηγού" value={ns} onChange={e => setNs(e.target.value)} className="py-1" /><Btn onClick={addSp} className="py-1">+</Btn></div>
          <Field label="" className="mt-3 text-[12px] text-mute">Τα λογότυπα ανεβαίνουν στο Supabase Storage (bucket «sponsors») — προς το παρόν βάλε URL.</Field>
        </div>
      </div>
      <Toast msg={toast} />
    </>
  )
}
