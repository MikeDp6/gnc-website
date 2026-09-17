import { Link } from 'react-router-dom'
import type { Match, Phase } from '@/data/types'
import { useData } from '@/data/store'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/cn'

const DAY = ['', 'Σάβ', 'Κυρ']
const ORDER: Phase[] = ['r16', 'qf', 'sf', 'final']

/**
 * Horizontal knockout bracket: one column per round, glass match boxes, connector lines drawn with CSS.
 * Rows are a grid of 2×(matches in the widest round); a match in round k spans 2^k rows so pairs line up.
 * Scrolls sideways on small screens.
 */
export function BracketGrid({ matches }: { matches: Match[] }) {
  const { teamById } = useData()
  const { t } = useI18n()
  const rounds = ORDER.filter(p => matches.some(m => m.phase === p)).map(p => matches.filter(m => m.phase === p).sort((a, b) => a.time.localeCompare(b.time) || a.court - b.court))
  if (!rounds.length) return null
  const base = Math.max(...rounds.map(r => r.length))
  const baseIdx = rounds.findIndex(r => r.length === base)
  const rows = base * 2
  const NAMES: Record<Phase, string> = { r16: t.bracket.r16, qf: t.bracket.qf, sf: t.bracket.sf, final: t.bracket.final, group: '' }

  const box = (m: Match, isFinal: boolean) => {
    const fin = m.status === 'final', live = m.status === 'live'
    const line = (id?: string, label?: string, score?: number, win?: boolean) => {
      const tm = teamById(id)
      return (
        <div className={cn('flex items-center justify-between gap-3 py-[7px] text-[14px] font-semibold', !tm && 'italic text-mute', fin && (win ? 'text-white' : 'text-dim'))}>
          {tm ? <Link to={`/teams/${tm.id}`} className="truncate hover:text-orange">{tm.name}</Link> : <span className="truncate">{label ?? 'TBD'}</span>}
          <b className={cn('mono text-[17px]', live && 'text-orange')}>{score ?? '–'}</b>
        </div>
      )
    }
    return (
      <div className={cn('glass w-full rounded-[14px] px-4 py-3', isFinal && 'border-orange/60 bg-[linear-gradient(135deg,rgba(16,114,255,.25),rgba(255,135,0,.2))]', live && 'border-orange/60')}>
        <div className="mb-1 flex justify-between text-[10px] font-extrabold uppercase tracking-[.12em] text-dim">
          <span className={cn(isFinal && 'text-orange', live && 'text-orange')}>{live ? '● LIVE' : m.label}</span><span>{DAY[m.day]} {m.time} · {t.misc.courtShort}{m.court}</span>
        </div>
        {line(m.homeId, m.homeLabel, m.homeScore, fin && (m.homeScore ?? 0) > (m.awayScore ?? 0))}
        <div className="border-t border-white/10" />
        {line(m.awayId, m.awayLabel, m.awayScore, fin && (m.awayScore ?? 0) > (m.homeScore ?? 0))}
      </div>
    )
  }

  const present = ORDER.filter(p => matches.some(m => m.phase === p))
  const cols = `repeat(${rounds.length}, minmax(240px, 1fr))`
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
      <div style={{ minWidth: rounds.length * 280 }}>
        <div className="grid gap-x-10 pb-3" style={{ gridTemplateColumns: cols }}>
          {present.map(p => <div key={p} className="kicker text-white">{NAMES[p]}</div>)}
        </div>
        <div className="grid gap-x-10" style={{ gridTemplateColumns: cols, gridTemplateRows: `repeat(${rows}, minmax(56px, auto))` }}>
          {rounds.map((r, c) => {
            const last = c === rounds.length - 1
            // rows each match occupies in this column: the widest round gets 2 rows per match, every later round doubles
            const span = c >= baseIdx ? 2 * 2 ** (c - baseIdx) : Math.max(2, Math.floor(rows / r.length))
            return r.map((m, i) => {
              const start = c >= baseIdx ? i * span + 1 : Math.round(i * (rows / r.length)) + 1
              return (
                <div key={m.id} className={cn('relative flex items-center py-2', c > 0 && 'bracket-in')} style={{ gridColumn: c + 1, gridRow: `${start} / span ${span}` }}>
                  <div className={cn('relative w-full', !last && 'bracket-out')}>{box(m, m.phase === 'final')}</div>
                </div>
              )
            })
          })}
        </div>
      </div>
    </div>
  )
}
