import type { Match } from '@/data/types'
import { useData } from '@/data/store'
import { catColor } from '@/lib/categories'

/** Compact card for the hero strip / app list: category + time, two team lines, court. */
export function MatchCard({ m }: { m: Match }) {
  const { categoryById, teamById } = useData()
  const cat = categoryById(m.categoryId)
  const home = teamById(m.homeId), away = teamById(m.awayId)
  const line = (n?: string, s?: number, label?: string) => (
    <div className="flex justify-between py-1 text-[14px] font-semibold">
      <span className={(n ? '' : 'italic text-mute ') + 'truncate pr-2'}>{n ?? label ?? 'TBD'}</span>
      <b className="mono font-bold text-white">{s ?? '–'}</b>
    </div>
  )
  return (
    <div className="rounded-[14px] border border-line bg-[rgba(20,20,22,.78)] px-4 py-[14px] backdrop-blur-md">
      <div className="mb-[10px] flex items-center justify-between gap-2 whitespace-nowrap text-[11px] font-bold uppercase tracking-[.1em] text-dim">
        <span><i className="mr-[6px] inline-block h-2 w-2 rounded-full align-[1px]" style={{ background: catColor[cat.key] }} />{cat.short} · {m.label}</span>
        <span>{m.day === 1 ? 'Σάβ' : 'Κυρ'} {m.time}</span>
      </div>
      {line(home?.name, m.homeScore, m.homeLabel)}
      {line(away?.name, m.awayScore, m.awayLabel)}
      <div className="mt-2 flex justify-between text-[11px] text-dim"><span>Γήπεδο {m.court}</span><span>{m.phase === 'group' ? 'Φάση ομίλων' : 'Νοκ-άουτ'}</span></div>
    </div>
  )
}
