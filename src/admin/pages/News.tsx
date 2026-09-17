import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Markdown } from '@/components/ui/Markdown'
import { Btn, Field, Input, PageTitle, Select, Toast, inputCls, slugify } from '../ui'
import { ImageField } from '../upload'

type Row = { id: string; slug: string; title: string; excerpt: string | null; body: string | null; tag: string; published_on: string; image_url: string | null; source_url: string | null; published: boolean; updated_at: string }
const TAGS = ['Νέα', 'Αποτελέσματα', 'Δηλώσεις', 'Πρόγραμμα', 'Ανακοίνωση', 'Χορηγοί']
const empty = (): Omit<Row, 'id' | 'updated_at'> => ({ slug: '', title: '', excerpt: '', body: '', tag: 'Νέα', published_on: new Date().toISOString().slice(0, 10), image_url: null, source_url: null, published: true })

/** News CMS: list on the left, editor on the right. Body is Markdown (same renderer as the public site). */
export function News() {
  const [rows, setRows] = useState<Row[]>([])
  const [sel, setSel] = useState<string | 'new' | null>(null)
  const [f, setF] = useState(empty())
  const [preview, setPreview] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const say = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(null), 2500) }, [])
  const load = useCallback(async () => { if (!supabase) return; const r = await supabase.from('news').select('*').order('published_on', { ascending: false }); if (r.error) say(r.error.message); else setRows(r.data as Row[]) }, [say])
  useEffect(() => { load() }, [load])
  const open = (r: Row | 'new') => { if (r === 'new') { setSel('new'); setF(empty()) } else { setSel(r.id); const { id: _i, updated_at: _u, ...rest } = r; setF(rest) } setPreview(false) }
  const save = async () => {
    if (!f.title.trim()) return say('Βάλε τίτλο')
    const payload = { ...f, slug: f.slug || slugify(f.title).slice(0, 80), excerpt: f.excerpt || null, body: f.body || null, image_url: f.image_url || null, source_url: f.source_url || null }
    const r = sel === 'new' ? await supabase!.from('news').insert(payload).select('id').single() : await supabase!.from('news').update(payload).eq('id', sel!).select('id').single()
    if (r.error) return say(r.error.message)
    say('Αποθηκεύτηκε'); setSel((r.data as { id: string }).id); setF(payload); load()
  }
  const del = async () => { if (sel === 'new' || !sel || !confirm('Διαγραφή άρθρου;')) return; const r = await supabase!.from('news').delete().eq('id', sel); if (r.error) say(r.error.message); else { setSel(null); load() } }
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF(x => ({ ...x, [k]: v }))
  return (
    <>
      <PageTitle a="News" b={`(${rows.length})`} right={<Btn onClick={() => open('new')}>+ Νέο άρθρο</Btn>} />
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="card self-start overflow-hidden">
          {rows.map(r => (
            <button key={r.id} type="button" onClick={() => open(r)} className={`block w-full border-t border-line px-4 py-3 text-left text-[13px] hover:bg-white/5 ${sel === r.id ? 'bg-white/8' : ''}`}>
              <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.1em] text-dim"><span className="text-orange">{r.tag}</span><span>{r.published_on}</span>{!r.published && <span className="rounded bg-red/20 px-1 text-red">Πρόχειρο</span>}</div>
              <div className="mt-1 line-clamp-2 font-semibold">{r.title}</div>
            </button>
          ))}
          {!rows.length && <div className="p-4 text-[13px] text-dim">Κανένα άρθρο ακόμα.</div>}
        </div>
        {sel ? (
          <div className="card grid gap-4 p-5 md:grid-cols-2">
            <Field label="Τίτλος" className="md:col-span-2"><Input value={f.title} onChange={e => set('title', e.target.value)} /></Field>
            <Field label="Slug (URL)"><Input value={f.slug} onChange={e => set('slug', e.target.value)} placeholder={slugify(f.title).slice(0, 80) || 'auto'} className="mono text-[12px]" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ετικέτα"><Select value={f.tag} onChange={e => set('tag', e.target.value)}>{TAGS.map(t => <option key={t}>{t}</option>)}</Select></Field>
              <Field label="Ημερομηνία"><Input type="date" value={f.published_on} onChange={e => set('published_on', e.target.value)} /></Field>
            </div>
            <Field label="Περίληψη (εμφανίζεται στις κάρτες)" className="md:col-span-2"><textarea value={f.excerpt ?? ''} onChange={e => set('excerpt', e.target.value)} rows={3} className={inputCls} /></Field>
            <ImageField value={f.image_url} onChange={v => set('image_url', v)} folder="news" className="md:col-span-2" />
            <div className="md:col-span-2">
              <div className="mb-1 flex items-center justify-between text-[13px]"><span className="text-dim">Κείμενο (Markdown: # τίτλος, **έντονα**, - λίστα, [link](url))</span><button type="button" onClick={() => setPreview(p => !p)} className="text-[12px] font-bold text-orange">{preview ? 'Επεξεργασία' : 'Προεπισκόπηση'}</button></div>
              {preview ? <div className="min-h-[200px] rounded-[10px] border border-line p-4 text-[15px] leading-relaxed">{f.body ? <Markdown text={f.body} /> : <span className="text-mute">—</span>}</div>
                : <textarea value={f.body ?? ''} onChange={e => set('body', e.target.value)} rows={16} className={inputCls + ' mono text-[13px]'} />}
            </div>
            <Field label="Πηγή (URL, προαιρετικό)"><Input value={f.source_url ?? ''} onChange={e => set('source_url', e.target.value || null)} placeholder="https://gnc3on3.gr/…" /></Field>
            <label className="flex items-center gap-2 self-end pb-[10px] text-[13px]"><input type="checkbox" checked={f.published} onChange={e => set('published', e.target.checked)} />Δημοσιευμένο</label>
            <div className="flex items-center justify-between md:col-span-2">
              <Btn onClick={save} variant="orange">Αποθήκευση</Btn>
              {sel !== 'new' && <div className="flex items-center gap-4"><a href={`/news/${f.slug}`} target="_blank" rel="noreferrer" className="text-[12px] font-bold text-dim hover:text-white">Άνοιγμα στο site ↗</a><Btn onClick={del} variant="danger">Διαγραφή</Btn></div>}
            </div>
          </div>
        ) : <div className="card p-8 text-[14px] text-dim">Διάλεξε άρθρο από αριστερά ή πάτα «Νέο άρθρο».</div>}
      </div>
      <Toast msg={toast} />
    </>
  )
}
