import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'

/**
 * Αριθμητικό πληκτρολόγιο 4 ψηφίων. Μεγάλα πλήκτρα για κινητό, και το πληκτρολόγιο της συσκευής
 * δουλεύει κι αυτό. Καλεί το onDone μόλις συμπληρωθεί το τέταρτο ψηφίο.
 */
export function PinPad({ onDone, busy, label }: { onDone: (pin: string) => void; busy?: boolean; label?: string }) {
  const [pin, setPin] = useState('')

  useEffect(() => {
    if (pin.length === 4 && !busy) { const v = pin; setPin(''); onDone(v) }
  }, [pin, busy, onDone])

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (busy) return
      if (/^\d$/.test(e.key)) setPin(p => (p + e.key).slice(0, 4))
      else if (e.key === 'Backspace') setPin(p => p.slice(0, -1))
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [busy])

  const press = (d: string) => { if (!busy) setPin(p => (p + d).slice(0, 4)) }

  return (
    <div className="flex flex-col items-center gap-6">
      {label && <div className="text-[13px] text-dim">{label}</div>}
      <div className="flex gap-3" aria-label="PIN">
        {[0, 1, 2, 3].map(i => (
          <i key={i} className={cn('h-[14px] w-[14px] rounded-full border transition-colors',
            i < pin.length ? 'border-orange bg-orange' : 'border-line')} />
        ))}
      </div>
      <div className="grid w-[240px] grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
          <button key={d} type="button" onClick={() => press(d)} disabled={busy}
            className="mono h-[62px] rounded-full border border-line text-[22px] font-bold transition-colors hover:border-white/40 active:bg-white/10 disabled:opacity-40">{d}</button>
        ))}
        <span />
        <button type="button" onClick={() => press('0')} disabled={busy}
          className="mono h-[62px] rounded-full border border-line text-[22px] font-bold transition-colors hover:border-white/40 active:bg-white/10 disabled:opacity-40">0</button>
        <button type="button" onClick={() => setPin(p => p.slice(0, -1))} disabled={busy || !pin}
          className="h-[62px] rounded-full text-[20px] text-dim transition-colors hover:text-white disabled:opacity-30" aria-label="Διαγραφή">⌫</button>
      </div>
    </div>
  )
}
