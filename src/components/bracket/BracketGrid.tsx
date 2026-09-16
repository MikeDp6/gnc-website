import type { Match } from '@/data/types'
import { teamById } from '@/data/mock'
import { cn } from '@/lib/cn'

const DAY = ['', 'Σάβ', 'Κυρ']

/** Knockout as a grid of cards: QFs, SFs, and a wide Final card. Works with 4 or 8 teams. */
export function BracketGrid({ matches }: { matches: Match[] }) {
  const line = (id?: string, label?: string, score?: number, win?: boolean, fin?: boolean) => (
    <div className={cn('flex items-center justify-between border-t border-line py-[9px] text-[15px] font-semibold', !id && 'italic text-mute', fin && (win ? 'text-white' : 'text-dim'))}>
      <span>{teamById(id)?.name ?? label ?? 'TBD'}</span><b className="mono text-[18px]">{score ?? '–'}</b>
    </div>
  )
  return (
    <div className="grid gap-[14px] sm:grid-cols-2 lg:grid-cols-4">
      {matches.map(m => {
        const fin = m.status === 'final'
        return (
          <div key={m.id} className={cn('card px-[18px] py-4', m.phase === 'final' && 'border-white/20 bg-[linear-gradient(135deg,rgba(16,114,255,.35),rgba(255,135,0,.25))] sm:col-span-2')}>
            <div className="mb-3 flex justify-between text-[11px] font-extrabold uppercase tracking-[.14em] text-orange">
              {m.label}<span className="text-dim">{DAY[m.day]} {m.time} · Γ{m.court}</span>
            </div>
            {line(m.homeId, m.homeLabel, m.homeScore, fin && (m.homeScore ?? 0) > (m.awayScore ?? 0), fin)}
            {line(m.awayId, m.awayLabel, m.awayScore, fin && (m.awayScore ?? 0) > (m.homeScore ?? 0), fin)}
          </div>
        )
      })}
    </div>
  )
}
