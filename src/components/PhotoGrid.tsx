import { useEffect, useState } from 'react'
import type { Photo } from '@/data/types'
import { cn } from '@/lib/cn'
import { pauseScroll, resumeScroll } from '@/lib/smoothScroll'

/**
 * Photo wall with a viewer. The grid is a masonry of columns so portrait and landscape shots sit
 * together without being cropped; clicking one opens it full size, with the arrow keys and Escape.
 */
export function PhotoGrid({ photos, initial = 12 }: { photos: Photo[]; initial?: number }) {
  const [open, setOpen] = useState<number | null>(null)
  const [shown, setShown] = useState(initial)
  const n = photos.length

  useEffect(() => {
    if (open === null) return
    const f = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowRight') setOpen(i => (i === null ? i : (i + 1) % n))
      if (e.key === 'ArrowLeft') setOpen(i => (i === null ? i : (i - 1 + n) % n))
    }
    window.addEventListener('keydown', f)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    pauseScroll()
    return () => { window.removeEventListener('keydown', f); document.body.style.overflow = prev; resumeScroll() }
  }, [open, n])

  if (!n) return null
  const cur = open === null ? null : photos[open]

  return (
    <>
      <div className="columns-2 gap-3 md:columns-3 [&>*]:mb-3">
        {photos.slice(0, shown).map((p, i) => (
          <button key={p.id} type="button" onClick={() => setOpen(i)} aria-label={p.caption || `Φωτογραφία ${i + 1}`}
            className="pop block w-full overflow-hidden rounded-[14px] border border-line">
            <img src={p.url} alt={p.caption ?? ''} loading="lazy"
              className="block w-full transition-transform duration-500 hover:scale-[1.03]" />
          </button>
        ))}
      </div>

      {shown < n && (
        <button type="button" onClick={() => setShown(s => s + 18)}
          className="pop mt-5 w-full rounded-full border border-line py-3 text-[13px] font-bold uppercase tracking-[.08em] text-dim hover:border-orange hover:text-orange">
          Περισσότερες ({n - shown})
        </button>
      )}

      {cur && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07070a]/97 p-4 backdrop-blur-md" onClick={() => setOpen(null)}>
          <button type="button" aria-label="Κλείσιμο" onClick={() => setOpen(null)}
            className="glass absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full text-[20px]">×</button>
          {n > 1 && (
            <>
              <Arrow side="left" onClick={e => { e.stopPropagation(); setOpen(i => (i! - 1 + n) % n) }} />
              <Arrow side="right" onClick={e => { e.stopPropagation(); setOpen(i => (i! + 1) % n) }} />
            </>
          )}
          <figure className="max-h-full" onClick={e => e.stopPropagation()}>
            <img src={cur.url} alt={cur.caption ?? ''} className="max-h-[80vh] max-w-[92vw] rounded-[14px] object-contain" />
            {(cur.caption || cur.credit) && (
              <figcaption className="mx-auto mt-3 max-w-[760px] text-center text-[13px] text-cement">
                {cur.caption}{cur.credit ? <span className="text-mute"> · {cur.credit}</span> : null}
              </figcaption>
            )}
            <div className="mt-1 text-center text-[12px] text-mute">{open! + 1} / {n}</div>
          </figure>
        </div>
      )}
    </>
  )
}

function Arrow({ side, onClick }: { side: 'left' | 'right'; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button type="button" aria-label={side === 'left' ? 'Προηγούμενη' : 'Επόμενη'} onClick={onClick}
      className={cn('glass absolute top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full text-[20px]', side === 'left' ? 'left-3' : 'right-3')}>
      {side === 'left' ? '←' : '→'}
    </button>
  )
}
