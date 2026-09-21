import { useEffect, useRef, useState } from 'react'
import { uploadMedia } from '../upload'
import { Input } from '../ui'

/**
 * The same article photo is drawn in very different frames on the site: a very wide strip at the top of
 * the News page and the article (≈ 2.5 : 1), a card (≈ 16 : 9), and an almost upright box on phones.
 * So the editor shows all three side by side, and a click on the photo sets the point that must stay
 * in view in every one of them (stored as a CSS object-position, «50% 30%»).
 */
const FRAMES = [
  { label: 'Κεντρικό άρθρο · υπολογιστής', ratio: 2.5, w: 'col-span-2' },
  { label: 'Κάρτα', ratio: 16 / 9, w: '' },
  { label: 'Κινητό', ratio: 4 / 5, w: '' },
]
export const DEFAULT_POS = '50% 30%'

export function NewsImage({ value, pos, onChange, onPos }: {
  value: string | null; pos: string | null
  onChange: (url: string | null) => void; onPos: (p: string | null) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  useEffect(() => { setSize(null) }, [value])
  const p = pos || DEFAULT_POS
  const [px, py] = p.split(' ').map(v => parseFloat(v))

  const pick = async (f?: File) => {
    if (!f) return
    setBusy(true); setErr(null)
    try { onChange(await uploadMedia(f, 'news')); onPos(null) }
    catch (e) { setErr((e as Error).message) }
    finally { setBusy(false); if (ref.current) ref.current.value = '' }
  }
  const aim = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - r.left) / r.width) * 100), y = Math.round(((e.clientY - r.top) / r.height) * 100)
    onPos(`${Math.max(0, Math.min(100, x))}% ${Math.max(0, Math.min(100, y))}%`)
  }
  const ratio = size ? size.w / size.h : null

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-[13px]">
        <span className="text-dim">Φωτογραφία άρθρου</span>
        <span className="text-[12px] text-mute">Ιδανικά <b className="text-ink">οριζόντια 1920 × 1080</b> (16:9) — το σημαντικό στη μέση</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => ref.current?.click()} className="rounded-[8px] border border-line px-3 py-[6px] text-[12px] font-bold hover:border-white/30 disabled:opacity-50">{busy ? 'Ανεβαίνει…' : value ? '↻ Άλλαξε φωτογραφία' : '↑ Ανέβασε φωτογραφία'}</button>
        {value && <button type="button" onClick={() => { onChange(null); onPos(null) }} className="text-[12px] text-mute hover:text-red">Αφαίρεση</button>}
        <Input value={value ?? ''} onChange={e => onChange(e.target.value || null)} placeholder="ή επικόλλησε URL" className="min-w-[200px] flex-1 py-1 text-[12px]" />
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="hidden" onChange={e => pick(e.target.files?.[0])} />
      </div>
      {err && <div className="text-[12px] text-red">{err}</div>}

      {value && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,260px)_1fr]">
          <div>
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[.08em] text-dim">Πάτα πάνω στο σημείο που πρέπει να φαίνεται πάντα</div>
            <div onClick={aim} className="relative cursor-crosshair overflow-hidden rounded-[10px] border border-line bg-white/5">
              <img src={value} alt="" className="block w-full" onLoad={e => setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} />
              <span className="pointer-events-none absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-orange shadow-[0_0_0_2px_rgba(0,0,0,.6)]" style={{ left: `${px}%`, top: `${py}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-mute">
              <span>{size ? `${size.w} × ${size.h}` : '…'}</span>
              {pos && <button type="button" onClick={() => onPos(null)} className="hover:text-white">επαναφορά σημείου</button>}
            </div>
            {ratio != null && ratio < 1.2 && (
              <div className="mt-2 rounded-[8px] border border-orange/50 bg-orange/10 p-2 text-[12px] leading-snug text-orange">
                {ratio < 0.95 ? 'Κατακόρυφη εικόνα (αφίσα)' : 'Τετράγωνη εικόνα'}: στο κεντρικό πλαίσιο θα φαίνεται μόνο μια λωρίδα της. Για αφίσες, βάλε μια οριζόντια φωτογραφία εδώ και την αφίσα μέσα στο κείμενο.
              </div>
            )}
            {size && Math.max(size.w, size.h) < 1200 && <div className="mt-2 text-[12px] text-orange">Μικρή ανάλυση — στο κεντρικό άρθρο θα φαίνεται θολή.</div>}
          </div>
          <div>
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[.08em] text-dim">Έτσι θα φαίνεται στο site</div>
            <div className="grid grid-cols-[1fr_0.5fr] items-start gap-3">
              {FRAMES.map(f => (
                <div key={f.label} className={f.w}>
                  <div className="relative overflow-hidden rounded-[8px] border border-line bg-white/5" style={{ aspectRatio: String(f.ratio) }}>
                    <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: p }} />
                  </div>
                  <div className="mt-1 text-[11px] text-mute">{f.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
