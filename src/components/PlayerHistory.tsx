import { Link } from 'react-router-dom'
import { catColor } from '@/lib/categories'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/cn'
import type { CategoryKey, PlayerHistoryRow, TeamHistoryRow } from '@/data/types'

const MONTHS = ['ΙΑΝ', 'ΦΕΒ', 'ΜΑΡ', 'ΑΠΡ', 'ΜΑΪ', 'ΙΟΥΝ', 'ΙΟΥΛ', 'ΑΥΓ', 'ΣΕΠ', 'ΟΚΤ', 'ΝΟΕ', 'ΔΕΚ']
const PLACE: Record<number, { label: string; cls: string }> = {
  1: { label: '🥇', cls: 'border-orange bg-orange text-[#111]' },
  2: { label: '🥈', cls: 'border-cement bg-cement text-[#111]' },
  3: { label: '🥉', cls: 'border-orange-soft text-orange-soft' },
}

/** One tournament per row: date, team, category, record and the medal if there was one. */
export function HistoryList({ rows, empty }: { rows: Array<PlayerHistoryRow | TeamHistoryRow>; empty: string }) {
  const { t } = useI18n()
  if (!rows.length) return <div className="card p-6 text-[14px] text-dim">{empty}</div>
  return (
    <div className="flex flex-col gap-2">
      {rows.map(r => {
        const d = new Date(r.startsOn + 'T00:00:00')
        const medal = r.place ? PLACE[r.place] : undefined
        const captain = 'captain' in r && r.captain
        return (
          <Link key={r.tournamentId + r.teamId} to={`/tournaments/${r.slug}`}
            className="card pop grid grid-cols-[62px_1fr_auto] items-center gap-4 border-l-[3px] px-4 py-3 md:grid-cols-[86px_1fr_auto]"
            style={{ borderLeftColor: catColor[r.colorKey as CategoryKey] ?? undefined }}>
            <div className="disp text-[26px] leading-none">{d.getFullYear()}<span className="mt-1 block font-sans text-[11px] font-bold tracking-[.1em] text-dim">{MONTHS[d.getMonth()]}</span></div>
            <div className="min-w-0">
              <div className="truncate text-[15px] font-bold">
                {'team' in r ? r.team : r.tournament}
                {captain && <span className="ml-2 rounded-[5px] bg-orange px-[6px] py-[2px] align-[2px] text-[9px] font-extrabold tracking-[.1em] text-[#111]">{t.team.captain.toUpperCase()}</span>}
              </div>
              <div className="mt-[3px] truncate text-[12px] text-dim">{'team' in r ? `${r.tournament} · ` : ''}{r.category} · {r.wins}–{r.losses}</div>
            </div>
            {medal
              ? <span className={cn('rounded-full border px-3 py-[6px] text-[12px] font-extrabold', medal.cls)}>{medal.label}</span>
              : <span className="mono text-[13px] text-dim">{r.played} {t.rankings.tours === 'TOURS' ? 'G' : 'ΑΓ'}</span>}
          </Link>
        )
      })}
    </div>
  )
}
