import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Input, slugify } from './ui'

/**
 * Photos straight from a phone are 4000px and 5–10 MB; nobody sees more than ~2000px on the site.
 * Shrink anything bigger before it leaves the browser: the long side goes to `max`, JPEG stays JPEG
 * (quality .86), PNG stays PNG so logos keep their transparency. SVG / GIF pass through untouched.
 * A format the browser cannot decode (iPhone HEIC in Chrome) is refused with a clear message instead
 * of being stored as a file no visitor can see.
 */
export async function shrinkImage(file: File, max = 2000): Promise<File> {
  if (!/^image\/(jpe?g|png|webp|heic|heif)$/i.test(file.type) && !/\.(heic|heif)$/i.test(file.name)) return file
  let bmp: ImageBitmap
  try { bmp = await createImageBitmap(file) }
  catch { throw new Error('Αυτή η μορφή εικόνας δεν ανοίγει στον browser (π.χ. HEIC από iPhone). Στείλ\' την ως JPG — στο iPhone: Ρυθμίσεις → Κάμερα → Μορφές → «Πιο συμβατή».') }
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const png = file.type === 'image/png'
  if (scale === 1 && file.size < 1.5e6 && !/heic|heif/i.test(file.type)) { bmp.close(); return file }
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height); bmp.close()
  const blob = await new Promise<Blob | null>(r => c.toBlob(r, png ? 'image/png' : 'image/jpeg', 0.86))
  if (!blob || blob.size >= file.size) return file
  const name = file.name.replace(/\.[^.]+$/, '') + (png ? '.png' : '.jpg')
  return new File([blob], name, { type: blob.type })
}

/** Upload a file to the public `media` bucket (folder/filename) and return its public URL. Admin-only through storage RLS. */
export async function uploadMedia(raw: File, folder: string): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured')
  const file = await shrinkImage(raw)
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
