import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GREECE_PATH } from '@/data/greece'
import { useData } from '@/data/store'
import { cn } from '@/lib/cn'

// Equirectangular projection matching the outline in greece.ts (1000×820 viewBox)
const project = (lat: number, lng: number) => ({ x: 109.42 * lng - 2110.5, y: -114.65 * lat + 4798.2 })

/** Real Greece outline; one clickable pin per city (blue, orange on hover) → /cities/:id. `nextCityId` gets a ring. */
export function GreeceMap({ className, compact, nextCityId }: { className?: string; compact?: boolean; nextCityId?: string }) {
  const { cities } = useData()
  const [hover, setHover] = useState<string | null>(null)
  return (
    <svg viewBox={compact ? '60 20 700 780' : '0 0 1000 820'} preserveAspectRatio="xMidYMid meet" className={cn('h-full w-full', className)} role="img" aria-label="Χάρτης Ελλάδας με τις στάσεις της περιοδείας">
      <path d={GREECE_PATH} fill="#17181b" stroke="#3a3c42" strokeWidth={compact ? 1.2 : 1} />
      {cities.map(c => {
        const { x, y } = project(c.lat, c.lng); const on = hover === c.id; const next = c.id === nextCityId
        return (
          <Link key={c.id} to={`/cities/${c.id}`} onMouseEnter={() => setHover(c.id)} onMouseLeave={() => setHover(null)} aria-label={c.name}>
            {next && <circle cx={x} cy={y} r={16} fill="none" stroke="var(--color-orange)" strokeWidth={2} opacity={.7} />}
            <circle cx={x} cy={y} r={on ? 11 : 8} fill={on ? 'var(--color-orange)' : 'var(--color-blue)'} stroke={on ? '#fff' : 'none'} strokeWidth={2} className="cursor-pointer transition-all duration-200" />
            {!compact && (on || next) && (
              <g pointerEvents="none">
                <rect x={x + 16} y={y - 14} width={c.name.length * 8.2 + 20} height={28} rx={6} fill="#0A0A0B" stroke="var(--color-line)" />
                <text x={x + 26} y={y + 5} fill="#fff" fontSize={13} fontWeight={700} fontFamily="var(--font-sans)">{c.name}</text>
              </g>
            )}
          </Link>
        )
      })}
    </svg>
  )
}
