import { Chip } from '@/components/ui/Chip'
import type { ReactNode } from 'react'

export function SubTabs({ tabs, active, onChange, right }: { tabs: string[]; active: string; onChange: (t: string) => void; right?: ReactNode }) {
  return (
    <div className="wrap flex flex-wrap items-center gap-2 pt-[26px]">
      {tabs.map(t => <Chip key={t} active={t === active} onClick={() => onChange(t)}>{t}</Chip>)}
      {right && <div className="ml-auto">{right}</div>}
    </div>
  )
}
