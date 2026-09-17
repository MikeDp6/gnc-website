import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Input, slugify } from './ui'

/** Upload a file to the public `media` bucket (folder/filename) and return its public URL. Admin-only through storage RLS. */
export async function uploadMedia(file: File, folder: string): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured')
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'file'
  const path = `${folder}/${Date.now().toString(36)}-${base}.${ext}`
  const { error } = await supabase.storage.from('media').upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type || undefined })
  if (error) throw new Error(error.message)
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl
}

/** Image picker: preview + upload button + plain URL field (for photos that already live somewhere). */
export function ImageField({ value, onChange, folder, label = 'Φωτογραφία', className, aspect = 'aspect-[16/9]' }: { value: string | null | undefined; onChange: (url: string | null) => void; folder: string; label?: string; className?: string; aspect?: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const pick = async (f?: File) => {
    if (!f) return
    setBusy(true); setErr(null)
    try { onChange(await uploadMedia(f, folder)) } catch (e) { setErr((e as Error).message) } finally { setBusy(false); if (ref.current) ref.current.value = '' }
  }
  return (
    <div className={className}>
      <span className="mb-1 block text-[13px] text-dim">{label}</span>
      <div className="flex gap-3">
        <div className={`relative w-[160px] shrink-0 overflow-hidden rounded-[10px] border border-line bg-white/5 ${aspect}`}>
          {value ? <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <span className="absolute inset-0 grid place-items-center text-[11px] text-mute">—</span>}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Input value={value ?? ''} onChange={e => onChange(e.target.value || null)} placeholder="https://… ή /img/…" className="py-1 text-[12px]" />
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => ref.current?.click()} className="rounded-[8px] border border-line px-3 py-[6px] text-[12px] font-bold hover:border-white/30 disabled:opacity-50">{busy ? 'Ανεβαίνει…' : '↑ Ανέβασε αρχείο'}</button>
            {value && <button type="button" onClick={() => onChange(null)} className="text-[12px] text-mute hover:text-red">Αφαίρεση</button>}
          </div>
          {err && <div className="text-[12px] text-red">{err}</div>}
          <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => pick(e.target.files?.[0])} />
        </div>
      </div>
    </div>
  )
}
