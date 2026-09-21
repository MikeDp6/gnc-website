import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { Markdown } from '@/components/ui/Markdown'
import { Btn, Input, PageTitle, Select, Toast, inputCls, slugify } from '../ui'
import { NewsImage } from '../components/NewsImage'
import { ymd } from '@/lib/adminApi'

type Row = { id: string; slug: string; title: string; excerpt: string | null; body: string | null; tag: string; published_on: string; image_url: string | null; image_pos: string | null; source_url: string | null; published: boolean; updated_at: string }
type Form = Omit<Row, 'id' | 'updated_at'>
const TAGS = ['Νέα', 'Αποτελέσματα', 'Δηλώσεις', 'Πρόγραμμα', 'Ανακοίνωση', 'Χορηγοί']
const empty = (): Form => ({ slug: '', title: '', excerpt: '', body: '', tag: 'Νέα', published_on: ymd(new Date()), image_url: null, image_pos: null, source_url: null, published: true })
const norm = (x: string) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// Declared outside News: a component created inside it would remount on every keystroke and drop focus.
function Box({ title, children }: { title: string; children: ReactNode }) {
  return <section className="card grid gap-3 p-5"><h2 className="text-[11px] font-extrabold uppercase tracking-[.12em] text-dim">{title}</h2>{children}</section>
}

/**
 * News CMS in two screens. The list (search, tag filter, thumbnails) takes the whole width; opening an
 * article replaces it with the editor — so the editor never stretches along a list of 300 articles.
 * The editor keeps the writing on the left (title, photo, summary, text) and everything about
 * publishing on the right, in one panel that stays in view with the save button.
 */
export function News() {
  const [rows, setRows] = useState<Row[]>([])
  const [sel, setSel] = useState<string | 'new' | null>(null)
  const [f, setF] = useState<Form>(empty())
  const [saved, setSaved] = useState<string>('')
  const [preview, setPreview] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [tag, setTag] = useState('')
  const say = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(null), 2500) }, [])
  const load = useCallback(async () => { if (!supabase) return; const r = await supabase.from('news').select('*').order('published_on', { ascending: false }); if (r.error) say(r.error.message); else setRows(r.data as Row[]) }, [say])
  useEffect(() => { load() }, [load])

  const dirty = sel != null && JSON.stringify(f) !== saved
  const open = (r: Row | 'new') => {
    const next: Form = r === 'new' ? empty() : (({ id: _i, updated_at: _u, ...rest }) => ({ ...rest, image_pos: rest.image_pos ?? null }))(r)
    setSel(r === 'new' ? 'new' : r.id); setF(next); setSaved(JSON.stringify(next)); setPreview(false)
    window.scrollTo({ top: 0 })
  }
  const back = () => { if (dirty && !confirm('Έχεις αλλαγές που δεν αποθηκεύτηκαν. Να φύγω χωρίς αποθήκευση;')) return; setSel(null) }
  const shown = useMemo(() => {
    const k = norm(q.trim())
    return rows.filter(r => (!tag || (tag === '__draft' ? !r.published : r.tag === tag)) && (!k || norm(r.title + ' ' + r.slug).includes(k)))
  }, [rows, q, tag])

  const save = async () => {
    if (!f.title.trim()) return say('Βάλε τίτλο')
    const payload: Form = { ...f, slug: f.slug || slugify(f.title).slice(0, 80), excerpt: f.excerpt || null, body: f.body || null, image_url: f.image_url || null, image_pos: f.image_url ? f.image_pos || null : null, source_url: f.source_url || null }
    const r = sel === 'new' ? await supabase!.from('news').insert(payload).select('id').single() : await supabase!.from('news').update(payload).eq('id', sel!).select('id').single()
    if (r.error) return say(r.error.message)
    say('Αποθηκεύτηκε'); setSel((r.data as { id: string }).id); setF(payload); setSaved(JSON.stringify(payload)); load()
  }
  const del = async () => { if (sel === 'new' || !sel || !confirm('Διαγραφή άρθρου;')) return; const r = await supabase!.from('news').delete().eq('id', sel); if (r.error) say(r.error.message); else { setSel(null); load() } }
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF(x => ({ ...x, [k]: v }))

  // ---------- λίστα ----------
  if (!sel) return (
    <>
      <PageTitle a="News" b={`(${rows.length})`} right={<Btn variant="orange" onClick={() => open('new')}>+ Νέο άρθρο</Btn>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Αναζήτηση τίτλου…" className="max-w-[420px] flex-1" />
        <Select value={tag} onChange={e => setTag(e.target.value)} className="w-auto">
          <option value="">Όλες οι ετικέτες</option>
          {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
          <option value="__draft">Μόνο πρόχειρα</option>
        </Select>
        {(q || tag) && <span className="self-center text-[13px] text-dim">{shown.length} από {rows.length}</span>}
      </div>
      <div className="card overflow-hidden">
        {shown.map(r => (
          <button key={r.id} type="button" onClick={() => open(r)} className="flex w-full items-center gap-4 border-t border-line px-4 py-3 text-left first:border-t-0 hover:bg-white/5">
            <span className="relative h-[54px] w-[86px] shrink-0 overflow-hidden rounded-[8px] bg-white/5">{r.image_url && <img src={r.image_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: r.image_pos || '50% 30%' }} />}</span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-1 block text-[15px] font-semibold">{r.title}</span>
              <span className="mt-1 flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[.1em] text-dim"><span className="text-orange">{r.tag}</span><span>{r.published_on}</span>{!r.published && <span className="rounded bg-red/20 px-1 text-red">Πρόχειρο</span>}</span>
            </span>
            <span className="hidden text-[12px] font-bold text-mute sm:block">Επεξεργασία →</span>
          </button>
        ))}
        {!shown.length && <div className="p-6 text-[14px] text-dim">{rows.length ? 'Κανένα άρθρο δεν ταιριάζει.' : 'Κανένα άρθρο ακόμα.'}</div>}
      </div>
      <Toast msg={toast} />
    </>
  )

  // ---------- επεξεργασία ----------
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={back} className="text-[13px] font-bold text-dim hover:text-white">← Όλα τα άρθρα</button>
        <div className="text-[12px] text-mute">{sel === 'new' ? 'Νέο άρθρο' : dirty ? 'Μη αποθηκευμένες αλλαγές' : 'Αποθηκευμένο'}</div>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-5">
          <Box title="Τίτλος">
            <textarea value={f.title} onChange={e => set('title', e.target.value)} rows={2} placeholder="Τίτλος άρθρου" className={inputCls + ' disp resize-none text-[28px] leading-[1.05]'} />
          </Box>
          <Box title="Φωτογραφία">
            <NewsImage value={f.image_url} pos={f.image_pos} onChange={v => set('image_url', v)} onPos={v => set('image_pos', v)} />
          </Box>
          <Box title="Περίληψη · εμφανίζεται στις κάρτες και στο Google">
            <textarea value={f.excerpt ?? ''} onChange={e => set('excerpt', e.target.value)} rows={3} className={inputCls} />
            <div className="text-right text-[11px] text-mute">{(f.excerpt ?? '').length} χαρακτήρες · ιδανικά κάτω από 160</div>
          </Box>
          <Box title="Κείμενο">
            <div className="flex items-center justify-between gap-3 text-[12px]">
              <span className="text-mute"># τίτλος · **έντονα** · - λίστα · [link](url) · ![](url εικόνας)</span>
              <div className="flex overflow-hidden rounded-full border border-line">
                <button type="button" onClick={() => setPreview(false)} className={`px-3 py-1 font-bold ${!preview ? 'bg-white/10 text-white' : 'text-dim'}`}>Γράψιμο</button>
                <button type="button" onClick={() => setPreview(true)} className={`px-3 py-1 font-bold ${preview ? 'bg-white/10 text-white' : 'text-dim'}`}>Προεπισκόπηση</button>
              </div>
            </div>
            {preview
              ? <div className="min-h-[320px] rounded-[10px] border border-line p-4 text-[15px] leading-relaxed">{f.body ? <Markdown text={f.body} /> : <span className="text-mute">—</span>}</div>
              : <textarea value={f.body ?? ''} onChange={e => set('body', e.target.value)} rows={18} className={inputCls + ' mono text-[13px] leading-relaxed'} />}
          </Box>
        </div>

        <aside className="grid gap-5 lg:sticky lg:top-4">
          <Box title="Δημοσίευση">
            <label className="flex items-center justify-between gap-3 rounded-[10px] border border-line px-3 py-[10px] text-[14px]">
              <span className={f.published ? 'font-bold text-white' : 'text-dim'}>{f.published ? 'Δημοσιευμένο' : 'Πρόχειρο'}</span>
              <input type="checkbox" checked={f.published} onChange={e => set('published', e.target.checked)} className="h-5 w-5 accent-[#FF6A13]" />
            </label>
            <label className="grid gap-1 text-[13px]"><span className="text-dim">Ημερομηνία</span><Input type="date" value={f.published_on} onChange={e => set('published_on', e.target.value)} /></label>
            <label className="grid gap-1 text-[13px]"><span className="text-dim">Ετικέτα</span><Select value={f.tag} onChange={e => set('tag', e.target.value)}>{TAGS.map(t => <option key={t}>{t}</option>)}</Select></label>
            <Btn onClick={save} variant="orange" disabled={!dirty && sel !== 'new'} className="w-full py-3 text-[14px]">{sel === 'new' ? 'Δημιουργία άρθρου' : 'Αποθήκευση'}</Btn>
            {sel !== 'new' && <a href={`/news/${f.slug}`} target="_blank" rel="noreferrer" className="text-center text-[12px] font-bold text-dim hover:text-white">Άνοιγμα στο site ↗</a>}
          </Box>
          <Box title="Για προχωρημένους">
            <label className="grid gap-1 text-[13px]"><span className="text-dim">Διεύθυνση (slug)</span><Input value={f.slug} onChange={e => set('slug', e.target.value)} placeholder={slugify(f.title).slice(0, 80) || 'αυτόματα από τον τίτλο'} className="mono text-[12px]" /></label>
            <label className="grid gap-1 text-[13px]"><span className="text-dim">Πηγή (URL, προαιρετικό)</span><Input value={f.source_url ?? ''} onChange={e => set('source_url', e.target.value || null)} placeholder="https://…" className="text-[12px]" /></label>
          </Box>
          {sel !== 'new' && <Btn onClick={del} variant="danger" className="w-full">Διαγραφή άρθρου</Btn>}
        </aside>
      </div>
      <Toast msg={toast} />
    </>
  )
}
