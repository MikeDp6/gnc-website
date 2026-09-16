import { Link } from 'react-router-dom'
import type { Match } from '@/data/types'
import { useData } from '@/data/store'
import { catColor } from '@/lib/categories'
import { cn } from '@/lib/cn'

const DAY = ['', 'Σάβ', 'Κυρ']

/** One schedule row: time/court · category · home · score · away · status. Highlight with `mine`. */
export function MatchRow({ m, mine, showCategory = true }: { m: Match; mine?: boolean; showCategory?: boolean }) {
  const { categoryById, teamById } = useData()
  const cat = categoryById(m.categoryId)
  const home = teamById(m.homeId), away = teamById(m.awayId)
  const fin = m.status === 'final' && m.homeScore != null && m.awayScore != null
  const hw = fin && m.homeScore! > m.awayScore!, aw = fin && m.awayScore! > m.homeScore!
  const status = m.status === 'final' ? 'Τελικό' : m.status === 'live' ? 'Live' : m.time
  const name = (t?: { id: string; name: string }, label?: string) => t
    ? <Link to={`/teams/${t.id}`} className="hover:underline">{t.name}</Link>
    : <span className="italic text-mute">{label ?? 'TBD'}</span>
  return (
    <div className={cn('card mb-2 grid grid-cols-[72px_1fr_84px_1fr] items-center gap-3 px-4 py-3 text-[14px] md:grid-cols-[110px_160px_1fr_120px_1fr_100px] md:gap-4 md:px-5 md:py-[14px] md:text-[15px]',
      mine && 'border-blue/60 bg-blue/10')}>
      <div className="mono text-[13px] font-bold text-white md:text-[14px]">
        {m.time}<small className="block text-[10px] font-normal uppercase tracking-[.08em] text-dim md:text-[11px]">{DAY[m.day]} · Γ{m.court}</small>
      </div>
      {showCategory && <div className="hidden text-[11px] font-extrabold uppercase tracking-[.1em] md:block" style={{ color: catColor[cat.key] }}>{cat.short} · {m.label}</div>}
      {!showCategory && <div className="hidden text-[11px] font-extrabold uppercase tracking-[.1em] md:block" style={{ color: catColor[cat.key] }}>{m.label}</div>}
      <div className={cn('text-right font-semibold', hw && 'text-white', fin && !hw && 'text-dim')}>{name(home, m.homeLabel)}</div>
      <div className="text-center">
        {fin ? <span className="mono whitespace-nowrap text-[18px] font-extrabold text-white md:text-[22px]">{m.homeScore} – {m.awayScore}</span>
             : m.status === 'live' ? <span className="mono whitespace-nowrap text-[18px] font-extrabold text-orange md:text-[22px]">{m.homeScore ?? 0} – {m.awayScore ?? 0}</span>
             : <span className="mono text-[13px] font-semibold text-mute">vs</span>}
      </div>
      <div className={cn('font-semibold', aw && 'text-white', fin && !aw && 'text-dim')}>{name(away, m.awayLabel)}</div>
      <div className={cn('hidden text-right text-[11px] font-extrabold uppercase tracking-[.1em] text-dim md:block', m.status === 'final' && 'text-ok', m.status === 'live' && 'text-orange')}>{status}</div>
    </div>
  )
}
