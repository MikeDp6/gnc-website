import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Btn, Input, PageTitle, Select, Toast } from '../ui'
import { uploadMedia } from '../upload'

type Row = { id: string; tournament_id: string | null; city_id: string | null; url: string; caption: string | null; credit: string | null; sort_order: number }
type Tour = { id: string; name: string }

/** Tournament gallery: multi-file upload to the `media` bucket, then caption/credit per photo. */
export function Photos() {
  const [tours, setTours] = useState<Tour[]>([])
  const [tid, setTid] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [busy, setBusy] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const ref = useRef<HTMLInputElement>(null)
  const say = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(null), 3000) }, [])
  useEffect(() => { if (!supabase) return; supabase.from('tournaments').select('id,name').order('starts_on', { ascending: false }).then(r => { if (!r.error) { setTours(r.data as Tour[]); setTid(x => x || (r.data as Tour[])[0]?.id || '') } }) }, [])
  const load = useCallback(async () => {
    if (!supabase || !tid) return setRows([])
    const r = await supabase.from('photos').select('*').eq('tournament_id', tid).order('sort_order')
    if (r.error) say(r.error.message); else setRows(r.data as Row[])
  }, [tid, say])
  useEffect(() => { load() }, [load])
  const pick = async (files: FileList | null) => {
    if (!files?.length || !tid) return
    const list = [...files]
    setBusy(list.length)
    let n = rows.length
    for (const f of list) {
      try {
        const url = await uploadMedia(f, `photos/${tid}`)
        await supabase!.from('photos').insert({ tournament_id: tid, url, sort_order: ++n })
      } catch (e) { say((e as Error).message) }
      setBusy(b => b - 1)
    }
    if (ref.current) ref.current.value = ''
    load()
  }
  const up = async (id: string, patch: Partial<Row>) => { const r = await supabase!.from('photos').update(patch).eq('id', id); if (r.error) say(r.error.message); else load() }
  const del = async (id: string) => { if (!confirm('Διαγραφή φωτογραφίας;')) return; const r = await supabase!.from('photos').delete().eq('id', id); if (r.error) say(r.error.message); else load() }
  return (
    <>
      <PageTitle a="Φωτογραφίες" b={`(${rows.length})`} right={
        <div className="flex items-center gap-3">
          <Select value={tid} onChange={e => setTid(e.target.value)} className="w-[260px]">{tours.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</Select>
          <Btn onClick={() => ref.current?.click()} disabled={!tid || busy > 0}>{busy > 0 ? `Ανεβαίνουν… (${busy})` : '+ Φωτογραφίες'}</Btn>
        </div>
      } />
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={e => pick(e.target.files)} />
      {!rows.length && <div className="card p-8 text-[14px] text-dim">Καμία φωτογραφία για αυτή τη διοργάνωση. Ανέβασε πολλές μαζί — εμφανίζονται στην καρτέλα «Φωτογραφίες» της σελίδας της.</div>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map(r => (
          <div key={r.id} className="card overflow-hidden">
            <div className="relative h-[180px]"><img src={r.url} alt="" className="absolute inset-0 h-full w-full object-cover" /></div>
            <div className="grid gap-2 p-3">
              <Input defaultValue={r.caption ?? ''} placeholder="Λεζάντα" onBlur={e => e.target.value !== (r.caption ?? '') && up(r.id, { caption: e.target.value || null })} className="py-1 text-[12px]" />
              <div className="flex gap-2">
                <Input defaultValue={r.credit ?? ''} placeholder="Φωτογράφος" onBlur={e => e.target.value !== (r.credit ?? '') && up(r.id, { credit: e.target.value || null })} className="py-1 text-[12px]" />
                <button type="button" onClick={() => del(r.id)} className="shrink-0 px-2 text-mute hover:text-red">✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Toast msg={toast} />
    </>
  )
}
