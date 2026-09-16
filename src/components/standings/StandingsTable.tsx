import { Link } from 'react-router-dom'
import type { Group } from '@/data/types'
import { useData } from '@/data/store'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/cn'

/** Group standings card. `dark` = solid black card (light sections); default = translucent card. `meId` highlights a team. */
export function StandingsTable({ g, subtitle, meId, solid }: { g: Group; subtitle?: string; meId?: string; solid?: boolean }) {
  const { t } = useI18n()
  const { categoryById, teamById } = useData()
  const cat = categoryById(g.categoryId)
  return (
    <div className={cn('rounded-[20px] px-4 pb-3 pt-5 text-white md:px-6 md:pt-[22px]', solid ? 'bg-bg' : 'card')}>
      <div className="mb-[14px] flex items-baseline justify-between">
        <b className="disp text-[34px]">{g.name}</b>
        <span className="text-[12px] font-bold uppercase tracking-[.1em] text-dim">{subtitle ?? cat.name}</span>
      </div>
      <table className="w-full border-separate border-spacing-y-[6px] text-[14px]">
        <thead>
          <tr className="text-left text-[11px] font-bold uppercase tracking-[.12em] text-dim">
            <th className="px-3 pb-1">{t.table.pos}</th><th className="px-3 pb-1">{t.table.team}</th>
            <th className="px-3 pb-1 text-right">{t.table.gp}</th><th className="px-3 pb-1 text-right">{t.table.wl}</th>
            <th className="hidden px-3 pb-1 text-right md:table-cell">{t.table.pts}</th><th className="px-3 pb-1 text-right">{t.table.points}</th>
          </tr>
        </thead>
        <tbody>
          {g.rows.map((r, i) => {
            const team = teamById(r.teamId)
            const me = r.teamId === meId
            const td = cn('px-3 py-[13px] font-semibold', me ? 'bg-orange/15' : r.qualifies ? 'bg-blue/20' : 'bg-white/5')
            return (
              <tr key={r.teamId}>
                <td className={cn(td, 'mono w-11 rounded-l-[10px] text-dim', (r.qualifies || me) && 'border-l-[3px] text-white', me ? 'border-orange' : 'border-blue')}>{i + 1}</td>
                <td className={td}><Link to={`/teams/${r.teamId}`} className="hover:underline">{team?.name}</Link></td>
                <td className={cn(td, 'mono text-right')}>{r.played}</td>
                <td className={cn(td, 'mono text-right')}>{r.wins}–{r.losses}</td>
                <td className={cn(td, 'mono hidden text-right md:table-cell')}>{r.pointsFor}:{r.pointsAgainst}</td>
                <td className={cn(td, 'mono rounded-r-[10px] text-right')}>{r.points}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {g.note && <div className="px-3 pb-1 pt-[10px] text-[11px] text-dim">{g.note}</div>}
    </div>
  )
}
