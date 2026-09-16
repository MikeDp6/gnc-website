import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GREECE_PATH } from '@/data/greece'
import { useData } from '@/data/store'
import type { City } from '@/data/types'
import { cn } from '@/lib/cn'

// Equirectangular projection matching the outline in greece.ts (1000×820 viewBox)
const project = (lat: number, lng: number) => ({ x: 109.42 * lng - 2110.5, y: -114.65 * lat + 4798.2 })
const CLUSTER_R = 30   // viewBox units: pins closer than this merge into one cluster

type Pt = City & { x: number; y: number }
interface Cluster { id: string; x: number; y: number; items: Pt[] }

function clusterize(cities: City[]): Cluster[] {
  const pts: Pt[] = cities.map(c => ({ ...c, ...project(c.lat, c.lng) }))
  const out: Cluster[] = []
  for (const p of pts) {
    const near = out.find(c => Math.hypot(c.x - p.x, c.y - p.y) < CLUSTER_R)
    if (near) { near.items.push(p); near.x = near.items.reduce((a, i) => a + i.x, 0) / near.items.length; near.y = near.items.reduce((a, i) => a + i.y, 0) / near.items.length }
    else out.push({ id: p.id, x: p.x, y: p.y, items: [p] })
  }
  return out
}

/** Real Greece outline; blue pins (orange on hover) → /cities/:id. Nearby cities collapse into a numbered cluster that fans out on hover. */
export function GreeceMap({ className, compact, nextCityId }: { className?: string; compact?: boolean; nextCityId?: string }) {
  const { cities } = useData()
  const [hover, setHover] = useState<string | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const clusters = useMemo(() => clusterize(cities), [cities])

  const label = (x: number, y: number, name: string) => (
    <g pointerEvents="none">
      <rect x={x + 14} y={y - 13} width={name.length * 8 + 18} height={26} rx={6} fill="#0A0A0B" stroke="rgba(255,255,255,.15)" />
      <text x={x + 23} y={y + 5} fill="#fff" fontSize={13} fontWeight={700} fontFamily="var(--font-sans)">{name}</text>
    </g>
  )
  const pin = (c: Pt, x: number, y: number) => {
    const on = hover === c.id; const next = c.id === nextCityId
    return (
      <Link key={c.id} to={`/cities/${c.id}`} onMouseEnter={() => setHover(c.id)} onMouseLeave={() => setHover(null)} aria-label={c.name}>
        {next && <circle cx={x} cy={y} r={15} fill="none" stroke="var(--color-orange)" strokeWidth={2} opacity={.7} />}
        <circle cx={x} cy={y} r={on ? 11 : 8} fill={on ? 'var(--color-orange)' : 'var(--color-blue)'} stroke={on ? '#fff' : 'none'} strokeWidth={2} className="cursor-pointer transition-all duration-200" />
        {!compact && on && label(x, y, c.name)}
      </Link>
    )
  }

  return (
    <svg viewBox={compact ? '60 20 700 780' : '0 0 1000 820'} preserveAspectRatio="xMidYMid meet" className={cn('h-full w-full', className)} role="img" aria-label="Χάρτης Ελλάδας με τις στάσεις της περιοδείας">
      <path d={GREECE_PATH} fill="#17181b" stroke="#3a3c42" strokeWidth={compact ? 1.2 : 1} />
      {clusters.map(cl => {
        if (cl.items.length === 1) return pin(cl.items[0], cl.items[0].x, cl.items[0].y)
        const isOpen = open === cl.id
        const n = cl.items.length; const R = 34 + n * 4
        const hasNext = cl.items.some(i => i.id === nextCityId)
        return (
          <g key={cl.id} onMouseEnter={() => setOpen(cl.id)} onMouseLeave={() => { setOpen(null); setHover(null) }}>
            {/* hit area so the fan stays open while moving between pins */}
            <circle cx={cl.x} cy={cl.y} r={isOpen ? R + 18 : 18} fill="transparent" />
            {isOpen
              ? cl.items.map((c, i) => {
                  const a = -Math.PI / 2 + (i / n) * Math.PI * 2; const x = cl.x + R * Math.cos(a), y = cl.y + R * Math.sin(a)
                  return <g key={c.id}><line x1={cl.x} y1={cl.y} x2={x} y2={y} stroke="rgba(255,255,255,.18)" />{pin(c, x, y)}</g>
                })
              : (
                <g className="cursor-pointer">
                  {hasNext && <circle cx={cl.x} cy={cl.y} r={20} fill="none" stroke="var(--color-orange)" strokeWidth={2} opacity={.7} />}
                  <circle cx={cl.x} cy={cl.y} r={13} fill="var(--color-blue)" stroke="#0A0A0B" strokeWidth={2} />
                  <text x={cl.x} y={cl.y + 4} textAnchor="middle" fill="#fff" fontSize={12} fontWeight={800} fontFamily="var(--font-sans)" pointerEvents="none">{n}</text>
                </g>
              )}
            {isOpen && <circle cx={cl.x} cy={cl.y} r={4} fill="rgba(255,255,255,.4)" pointerEvents="none" />}
          </g>
        )
      })}
    </svg>
  )
}
