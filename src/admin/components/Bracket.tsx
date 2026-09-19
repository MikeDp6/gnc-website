import type * as api from '@/lib/adminApi'
import { cn } from '@/lib/cn'

const ORDER = ['r16', 'qf', 'sf', 'final'] as const
const NAMES: Record<string, string> = { r16: 'Φάση των 16', qf: 'Φάση των 8', sf: 'Ημιτελικοί', final: 'Τελικός' }

/**
 * Admin knockout bracket: one column per round, read straight from the match rows.
 * A team that is not decided yet shows its seed label ("Σ1", "Νικ. ΗΜ1") in italics, so it is
 * obvious at a glance which slots the groups have already filled and which are still open.
 */
export function Bracket({ matches, teams, days }: {
  matches: api.MatchRowA[]
  teams: api.TeamRow[]
  days: Array<{ id: string; day_index: number }>
}) {
  const ko = matches.filter(m => m.phase !== 'group')
  const rounds = ORDER.filter(p => ko.some(m => m.phase === p))
    .map(p => ko.filter(m => m.phase === p).sort((a, b) => (a.slot_time ?? '').localeCompare(b.slot_time ?? '') || (a.court ?? 0) - (b.court ?? 0)))
  if (!rounds.length) return <div className="card p-6 text-[14px] text-dim">Δεν έχει δημιουργηθεί νοκ-άουτ. Όρισε Q στην κατηγορία και δημοσίευσε ξανά το πρόγραμμα.</div>

  const nameOf = (id: string | null) => teams.find(t => t.id === id)?.name
  const dayOf = (id: string | null) => days.find(d => d.id === id)?.day_index
  const base = Math.max(...rounds.map(r => r.length))
  const rows = base * 2

  const box = (m: api.MatchRowA) => {
    const fin = m.status === 'final', live = m.status === 'live'
    const side = (id: string | null, label: string | null, score: number | null, win: boolean) => {
      const nm = nameOf(id)
      return (
        <div className={cn('flex items-center justify-between gap-3 py-[6px] text-[14px] font-semibold', !nm && 'italic text-mute', fin && (win ? 'text-white' : 'text-dim'))}>
          <span className="truncate">{nm ?? label ?? 'TBD'}</span>
          <b className={cn('mono text-[16px]', live && 'text-orange')}>{score ?? '–'}</b>
        </div>
      )
    }
    const d = dayOf(m.day_id)
    return (
      <div className={cn('card w-full px-4 py-3', m.phase === 'final' && 'border-orange/60', live && 'border-orange/60 bg-orange/[.06]')}>
        <div className="mb-1 flex justify-between gap-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-dim">
          <span className={cn('truncate', (live || m.phase === 'final') && 'text-orange')}>{live ? '● LIVE' : m.label}</span>
          <span className="whitespace-nowrap">{d ? `Ημ. ${d} · ` : ''}{(m.slot_time ?? '').slice(0, 5)}{m.court ? ` · Γ${m.court}` : ''}</span>
        </div>
        {side(m.home_team_id, m.home_label, m.home_score, fin && (m.home_score ?? 0) > (m.away_score ?? 0))}
        <div className="border-t border-line" />
        {side(m.away_team_id, m.away_label, m.away_score, fin && (m.away_score ?? 0) > (m.home_score ?? 0))}
      </div>
    )
  }

  const cols = `repeat(${rounds.length}, minmax(230px, 1fr))`
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
      <div style={{ minWidth: rounds.length * 260 }}>
        <div className="grid gap-x-10 pb-2" style={{ gridTemplateColumns: cols }}>
          {rounds.map((r, i) => <div key={i} className="text-[11px] font-extrabold uppercase tracking-[.12em] text-dim">{NAMES[r[0].phase] ?? r[0].phase}</div>)}
        </div>
        <div className="grid gap-x-10" style={{ gridTemplateColumns: cols, gridTemplateRows: `repeat(${rows}, minmax(52px, auto))` }}>
          {rounds.map((r, c) => {
            const span = rows / r.length
            return r.map((m, i) => (
              <div key={m.id} className={cn('relative flex items-center py-2', c > 0 && 'bracket-in')} style={{ gridColumn: c + 1, gridRow: `${i * span + 1} / span ${span}` }}>
                <div className={cn('relative w-full', c < rounds.length - 1 && 'bracket-out')}>{box(m)}</div>
              </div>
            ))
          })}
        </div>
      </div>
    </div>
  )
}
