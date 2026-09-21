import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Btn, Input, PageTitle, Select, Toast } from '../ui'
import { shrinkImage, uploadMedia } from '../upload'
import { MediaCard, detectPlatform, KIND_LABEL, type MediaKind, type MediaLink } from '@/components/MediaCard'

type Old = { id: string; url: string; caption: string | null }
type Tour = { id: string; name: string }
type Preview = { title: string | null; image: string | null }

/** Copy a Facebook / Instagram cover into our storage, small — their image links expire. */
async function keepCover(src: string, tid: string): Promise<string> {
  const r = await fetch(`/api/link-preview?img=${encodeURIComponent(src)}`)
  if (!r.ok) throw new Error('Δεν κατέβηκε η εικόνα της ανάρτησης')
  const blob = await r.blob()
  const small = await shrinkImage(new File([blob], 'cover.jpg', { type: blob.type || 'image/jpeg' }), 1000)
  return uploadMedia(small, `links/${tid}`)
}

/**
 * Photos and videos of a tournament as links to where they already live (Instagram, Facebook, YouTube).
 * Paste the post link: the page reads the post's own cover and title, keeps a ~100 KB copy of the cover
 * for the card, and the visitor is taken to the post. Nothing heavy is stored on the site.
 */
export function Photos() {
  const [tours, setTours] = useState<Tour[]>([])
  const [tid, setTid] = useState('')
  const [links, setLinks] = useState<MediaLink[]>([])
  const [old, setOld] = useState<Old[]>([])
  const [url, setUrl] = useState(''); const [kind, setKind] = useState<MediaKind>('photos'); const [title, setTitle] = useState('')
  const [prev, setPrev] = useState<Preview | null>(null); const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const coverRef = useRef<HTMLInputElement>(null); const coverFor = useRef<string | 'new'>('new')
  const [ownCover, setOwnCover] = useState<string | null>(null)
  const say = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(null), 3500) }, [])

  useEffect(() => { if (!supabase) return; supabase.from('tournaments').select('id,name').order('starts_on', { ascending: false }).then(r => { if (!r.error) { setTours(r.data as Tour[]); setTid(x => x || (r.data as Tour[])[0]?.id || '') } }) }, [])
  const load = useCallback(async () => {
    if (!supabase || !tid) return
    const [l, o] = await Promise.all([
      supabase.from('media_links').select('*').eq('tournament_id', tid).order('sort_order'),
      supabase.from('photos').select('id,url,caption').eq('tournament_id', tid).order('sort_order'),
    ])
    if (l.error) say(l.error.message.includes('media_links') ? 'Τρέξε πρώτα το 039_media_links.sql στο Supabase' : l.error.message); else setLinks(l.data as MediaLink[])
    if (!o.error) setOld(o.data as Old[])
  }, [tid, say])
  useEffect(() => { load() }, [load])

  const platform = detectPlatform(url)
  const fetchPreview = async (u = url) => {
    if (!/^https?:\/\//.test(u.trim())) return
    setBusy('preview'); setPrev(null)
    try {
      const r = await fetch(`/api/link-preview?url=${encodeURIComponent(u.trim())}`)
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Δεν διαβάστηκε ο σύνδεσμος')
      setPrev({ title: j.title, image: j.image })
      if (!title && j.title) setTitle(String(j.title).replace(/\s+on Instagram:?.*$/i, '').slice(0, 120))
      if (/\/(reel|reels)\//.test(u)) setKind('reel'); else if (/\/(videos?|watch)\b|youtu/.test(u)) setKind('video')
    } catch (e) { say((e as Error).message + ' — μπορείς να ανεβάσεις δικό σου εξώφυλλο.'); setPrev({ title: null, image: null }) }
    setBusy(null)
  }
  const add = async () => {
    if (!tid || !/^https?:\/\//.test(url.trim())) return say('Βάλε σύνδεσμο')
    setBusy('save')
    try {
      let thumb = ownCover
      if (!thumb && prev?.image) { try { thumb = await keepCover(prev.image, tid) } catch (e) { say((e as Error).message) } }
      const r = await supabase!.from('media_links').insert({ tournament_id: tid, url: url.trim(), platform, kind, title: title.trim() || null, thumb_url: thumb, sort_order: links.length + 1 })
      if (r.error) throw new Error(r.error.message)
      setUrl(''); setTitle(''); setPrev(null); setOwnCover(null); setKind('photos'); say('Προστέθηκε'); load()
    } catch (e) { say((e as Error).message) }
    setBusy(null)
  }
  const pickCover = async (f?: File) => {
    if (!f || !tid) return
    setBusy('cover')
    try {
      const u = await uploadMedia(await shrinkImage(f, 1000), `links/${tid}`)
      if (coverFor.current === 'new') setOwnCover(u)
      else { await supabase!.from('media_links').update({ thumb_url: u }).eq('id', coverFor.current); load() }
    } catch (e) { say((e as Error).message) }
    setBusy(null); if (coverRef.current) coverRef.current.value = ''
  }
  const up = async (id: string, patch: Partial<MediaLink>) => { const r = await supabase!.from('media_links').update(patch).eq('id', id); if (r.error) say(r.error.message); else load() }
  const move = async (i: number, d: -1 | 1) => {
    const j = i + d; if (j < 0 || j >= links.length) return
    await Promise.all([up(links[i].id, { sort_order: j + 1 }), up(links[j].id, { sort_order: i + 1 })])
  }
  const del = async (id: string) => { if (!confirm('Αφαίρεση του συνδέσμου από το site; (Η ανάρτηση στο Facebook/Instagram δεν επηρεάζεται.)')) return; const r = await supabase!.from('media_links').delete().eq('id', id); if (r.error) say(r.error.message); else load() }
  const delOld = async (id: string) => { if (!confirm('Διαγραφή φωτογραφίας;')) return; const r = await supabase!.from('photos').delete().eq('id', id); if (r.error) say(r.error.message); else load() }

  const cover = ownCover ?? prev?.image ?? null
  return (
    <>
      <PageTitle a="Φωτογραφίες" b="& βίντεο" right={<Select value={tid} onChange={e => setTid(e.target.value)} className="w-[260px]">{tours.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</Select>} />
      <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => pickCover(e.target.files?.[0])} />

      <div className="card mb-6 grid gap-5 p-5 lg:grid-cols-[1fr_220px]">
        <div className="grid content-start gap-3">
          <div className="kicker">Νέος σύνδεσμος</div>
          <Input value={url} onChange={e => { setUrl(e.target.value); setPrev(null); setOwnCover(null) }} onBlur={() => !prev && fetchPreview()} onPaste={e => { const v = e.clipboardData.getData('text'); setTimeout(() => fetchPreview(v), 0) }}
            placeholder="Επικόλλησε σύνδεσμο ανάρτησης Instagram ή Facebook (άλμπουμ, βίντεο, reel)" />
          <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
            <Select value={kind} onChange={e => setKind(e.target.value as MediaKind)}>{(Object.keys(KIND_LABEL) as MediaKind[]).map(k => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</Select>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Τίτλος (π.χ. Τελικοί 35+ · Κυριακή)" />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[12px] text-mute">
            <span>Πλατφόρμα: <b className="text-white">{url ? platform : '—'}</b></span>
            {busy === 'preview' && <span>Διαβάζω την ανάρτηση…</span>}
            {prev && !prev.image && !ownCover && <span className="text-orange">Η ανάρτηση δεν έδωσε εικόνα — ανέβασε ένα εξώφυλλο.</span>}
            <button type="button" onClick={() => { coverFor.current = 'new'; coverRef.current?.click() }} className="font-bold text-dim hover:text-white">{ownCover ? '↻ Άλλο εξώφυλλο' : '↑ Δικό μου εξώφυλλο'}</button>
          </div>
          <div><Btn onClick={add} disabled={!url || !!busy}>{busy === 'save' ? 'Αποθήκευση…' : 'Προσθήκη'}</Btn></div>
          <p className="text-[12px] text-mute">Οι φωτογραφίες και τα βίντεο μένουν στο Facebook/Instagram. Το site κρατάει μόνο μια μικρή εικόνα για την κάρτα. Η ανάρτηση πρέπει να είναι δημόσια.</p>
        </div>
        <div>
          <div className="mb-1 text-[11px] font-bold uppercase tracking-[.08em] text-dim">Έτσι θα φαίνεται</div>
          <MediaCard m={{ id: 'p', url: url || '#', platform, kind, title: title || null, thumb_url: cover, sort_order: 0 }} preview />
        </div>
      </div>

      {!links.length && <div className="card mb-6 p-6 text-[14px] text-dim">Κανένας σύνδεσμος ακόμα για αυτή τη διοργάνωση.</div>}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {links.map((l, i) => (
          <div key={l.id} className="grid content-start gap-2">
            <MediaCard m={l} preview />
            <Input defaultValue={l.title ?? ''} key={l.title ?? ''} placeholder="Τίτλος" onBlur={e => e.target.value !== (l.title ?? '') && up(l.id, { title: e.target.value || null })} className="py-1 text-[12px]" />
            <div className="flex items-center gap-1 text-[12px]">
              <Select value={l.kind} onChange={e => up(l.id, { kind: e.target.value as MediaKind })} className="flex-1 py-1 text-[11px]">{(Object.keys(KIND_LABEL) as MediaKind[]).map(k => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</Select>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="px-1 text-mute hover:text-white disabled:opacity-30" title="Πιο μπροστά">←</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === links.length - 1} className="px-1 text-mute hover:text-white disabled:opacity-30" title="Πιο πίσω">→</button>
            </div>
            <div className="flex justify-between text-[11px]">
              <button type="button" onClick={() => { coverFor.current = l.id; coverRef.current?.click() }} className="text-mute hover:text-white">↻ Εξώφυλλο</button>
              <button type="button" onClick={() => del(l.id)} className="text-mute hover:text-red">Αφαίρεση</button>
            </div>
          </div>
        ))}
      </div>

      {old.length > 0 && (
        <details className="card mt-8 p-4">
          <summary className="cursor-pointer text-[13px] font-bold text-dim">Παλιές ανεβασμένες φωτογραφίες ({old.length}) — εμφανίζονται ακόμα στο site</summary>
          <div className="mt-4 grid grid-cols-3 gap-2 md:grid-cols-6">
            {old.map(o => (
              <div key={o.id} className="relative aspect-square overflow-hidden rounded-[8px]">
                <img src={o.url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                <button type="button" onClick={() => delOld(o.id)} className="absolute right-1 top-1 rounded bg-black/70 px-2 text-[12px] text-white hover:text-red">✕</button>
              </div>
            ))}
          </div>
        </details>
      )}
      <Toast msg={toast} />
    </>
  )
}
