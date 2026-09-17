import { Link } from 'react-router-dom'
import { useData } from '@/data/store'
import { catColor } from '@/lib/categories'
import type { CategoryKey, PlayerRank2 } from '@/data/types'

/** Where this player stands in the all-time table — overall, and inside each category they played. */
export function RankPanel({ rank, title = 'Η κατάταξή μου' }: { rank: PlayerRank2; title?: string }) {
  const { categoryById } = useData()
  if (!rank.overall && !rank.byCategory.length) return null

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-end justify-between">
        <h4 className="kicker">{title}</h4>
        <Link to="/rankings" className="text-[12px] font-bold uppercase tracking-[.08em] text-orange">Όλη η κατάταξη →</Link>
      </div>

      {rank.overall && (
        <div className="flex items-baseline gap-3 border-b border-line pb-4">
          <b className="disp text-[52px] leading-none text-orange">{rank.overall.position}<span className="text-[22px] text-dim">ος</span></b>
          <div className="text-[13px] text-dim">
            από {rank.overall.total} παίκτες
            <span className="mt-[2px] block text-mute">{rank.overall.points} βαθμοί συνολικά</span>
          </div>
        </div>
      )}

      {rank.byCategory.length > 0 && (
        <div className="mt-4 flex flex-col gap-[10px]">
          {rank.byCategory.slice().sort((a, b) => a.position - b.position).map(c => {
            const cat = categoryById(c.categoryId)
            return (
              <div key={c.categoryId} className="flex items-center justify-between gap-3 text-[14px]">
                <span className="flex min-w-0 items-center gap-2">
                  <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: catColor[cat.key as CategoryKey] }} />
                  <span className="truncate text-dim">{cat.name}</span>
                </span>
                <span className="mono shrink-0 font-bold">{c.position}<span className="text-dim">/{c.total}</span></span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
