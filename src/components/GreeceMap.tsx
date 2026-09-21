import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { GREECE_PATH } from '@/data/greece'
import { useData } from '@/data/store'
import type { City } from '@/data/types'
import { cn } from '@/lib/cn'

// Equirectangular projection matching the outline in greece.ts (1000×820 viewBox)
const project = (lat: number, lng: number) => ({ x: 109.42 * lng - 2110.5, y: -114.65 * lat + 4798.2 })
const CLUSTER_R = 30   // screen-sized viewBox units: pins closer than this merge into one cluster
const MAX_K = 10

type Pt = City & { x: number; y: number }
interface Cluster { id: string; x: number; y: number; items: Pt[] }

/** Clusters at a given zoom: the merge distance shrinks as you zoom in, so groups split up by themselves. */
function clusterize(pts: Pt[], r: number): Cluster[] {
  const out: Cluster[] = []
  for (const p of pts) {
    const near = out.find(c => Math.hypot(c.x - p.x, c.y - p.y) < r)
    if (near) { near.items.push(p); near.x = near.items.reduce((a, i) => a + i.x, 0) / near.items.length; near.y = near.items.reduce((a, i) => a + i.y, 0) / near.items.length }
    else out.push({ id: p.id, x: p.x, y: p.y, items: [p] })
  }
  return out
}

const coarse = () => typeof window !== 'undefined' && window.matchMedia?.('(hover: none), (pointer: coarse)').matches

/**
 * Real Greece outline (white), pins → /cities/:id.
 * Desktop: nearby cities collapse into a numbered cluster that fans out on hover.
 * Phones: no hover, so the map zooms instead — pinch (or the + / − buttons) and clusters split
 * gradually into single pins as you go in, each with its name next to it. One finger still scrolls
 * the page until the map is zoomed; then it pans the map.
 */
export function GreeceMap({ className, compact, nextCityId }: { className?: string; compact?: boolean; nextCityId?: string }) {
  const { cities } = useData()
  const [touch, setTouch] = useState(false)
  useEffect(() => { setTouch(coarse()) }, [])
  const [hover, setHover] = useState<string | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const pts = useMemo<Pt[]>(() => cities.map(c => ({ ...c, ...project(c.lat, c.lng) })), [cities])

  // ---------- zoom (phones) ----------
  const base = compact ? { x: 60, y: 20, w: 700, h: 780 } : { x: 0, y: 0, w: 1000, h: 820 }
  const [view, setView] = useState({ k: 1, cx: base.x + base.w / 2, cy: base.y + base.h / 2 })
  const svg = useRef<SVGSVGElement>(null)
  const ptrs = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{ d: number; k: number; cx: number; cy: number; mx: number; my: number } | null>(null)
  const k = touch ? view.k : 1
  const vw = base.w / k, vh = base.h / k
  const clampC = (cx: number, cy: number, kk: number) => {
    const w = base.w / kk, h = base.h / kk
    return { cx: Math.min(Math.max(cx, base.x + w / 2), base.x + base.w - w / 2), cy: Math.min(Math.max(cy, base.y + h / 2), base.y + base.h - h / 2) }
  }
  const setZoom = (kk: number, fx?: number, fy?: number) => setView(v => {
    const nk = Math.min(Math.max(kk, 1), MAX_K)
    // keep the focus point under the fingers while zooming
    const fx0 = fx ?? v.cx, fy0 = fy ?? v.cy
    const cx = fx0 - (fx0 - v.cx) * (v.k / nk), cy = fy0 - (fy0 - v.cy) * (v.k / nk)
    return { k: nk, ...clampC(cx, cy, nk) }
  })
  /** screen px → viewBox units */
  const toBox = (sx: number, sy: number) => {
    const r = svg.current!.getBoundingClientRect()
    const s = Math.min(r.width / vw, r.height / vh)
    const ox = (r.width - vw * s) / 2, oy = (r.height - vh * s) / 2
    return { x: view.cx - vw / 2 + (sx - r.left - ox) / s, y: view.cy - vh / 2 + (sy - r.top - oy) / s, s }
  }
  const onDown = (e: React.PointerEvent) => {
    if (!touch) return
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const p = [...ptrs.current.values()]
    if (p.length === 2) {
      const mx = (p[0].x + p[1].x) / 2, my = (p[0].y + p[1].y) / 2, b = toBox(mx, my)
      gesture.current = { d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), k: view.k, cx: b.x, cy: b.y, mx, my }
    } else if (p.length === 1 && view.k > 1) {
      gesture.current = { d: 0, k: view.k, cx: view.cx, cy: view.cy, mx: e.clientX, my: e.clientY }
    }
  }
  const onMove = (e: React.PointerEvent) => {
    if (!touch || !ptrs.current.has(e.pointerId) || !gesture.current) return
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const p = [...ptrs.current.values()], g = gesture.current
    if (p.length === 2 && g.d) {
      const d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y)
      setZoom(g.k * d / g.d, g.cx, g.cy)
    } else if (p.length === 1 && view.k > 1) {
      const s = toBox(0, 0).s
      setView(v => ({ ...v, ...clampC(g.cx - (e.clientX - g.mx) / s, g.cy - (e.clientY - g.my) / s, v.k) }))
    }
  }
  const onUp = (e: React.PointerEvent) => { ptrs.current.delete(e.pointerId); if (ptrs.current.size < 2) gesture.current = ptrs.current.size === 1 && view.k > 1 ? (() => { const q = [...ptrs.current.values()][0]; return { d: 0, k: view.k, cx: view.cx, cy: view.cy, mx: q.x, my: q.y } })() : null }

  const clusters = useMemo(() => clusterize(pts, CLUSTER_R / k), [pts, k])
  const u = 1 / k   // keeps pins, labels and strokes the same size on screen at any zoom

  const label = (x: number, y: number, name: string, small = false) => {
    const fs = (small ? 11 : 13) * u, w = (name.length * (small ? 6.6 : 8) + 14) * u
    return (
      <g pointerEvents="none">
        <rect x={x + 11 * u} y={y - 11 * u} width={w} height={22 * u} rx={5 * u} fill="#0A0A0B" fillOpacity={.85} stroke="rgba(255,255,255,.2)" strokeWidth={u} />
        <text x={x + 18 * u} y={y + 4 * u} fill="#fff" fontSize={fs} fontWeight={700} fontFamily="var(--font-sans)">{name}</text>
      </g>
    )
  }
  const pin = (c: Pt, x: number, y: number) => {
    const on = hover === c.id; const next = c.id === nextCityId
    return (
      <Link key={c.id} to={`/cities/${c.id}`} onMouseEnter={() => setHover(c.id)} onMouseLeave={() => setHover(null)} aria-label={c.name}>
        {next && <circle cx={x} cy={y} r={15 * u} fill="none" stroke="var(--color-orange)" strokeWidth={2 * u} opacity={.7} />}
        <circle cx={x} cy={y} r={(on ? 11 : 8) * u} fill={on ? 'var(--color-orange)' : 'var(--color-blue)'} stroke={on ? '#fff' : '#0A0A0B'} strokeWidth={2 * u} className="cursor-pointer transition-[r] duration-200" />
        {!compact && (on || (touch && k >= 1.8)) && label(x, y, c.name, touch && !on)}
      </Link>
    )
  }

  const zoomBtn = (d: 1 | -1, t: string) => (
    <button type="button" onClick={() => setZoom(view.k * (d > 0 ? 1.8 : 1 / 1.8))} disabled={d < 0 ? view.k <= 1 : view.k >= MAX_K}
      className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-[#0A0A0B]/80 text-[20px] font-bold text-white backdrop-blur disabled:opacity-30" aria-label={t}>{d > 0 ? '+' : '−'}</button>
  )

  return (
    <div className={cn('relative', className)}>
      <svg ref={svg} viewBox={`${view.cx - vw / 2} ${view.cy - vh / 2} ${vw} ${vh}`} preserveAspectRatio="xMidYMid meet" className="h-full w-full select-none"
        style={touch ? { touchAction: view.k > 1 ? 'none' : 'pan-y' } : undefined}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        role="img" aria-label="Χάρτης Ελλάδας με τις στάσεις της περιοδείας">
        <path d={GREECE_PATH} fill="#17181b" stroke="#ffffff" strokeWidth={(compact ? 1.3 : 1.1) * u} strokeLinejoin="round" />
        {clusters.map(cl => {
          if (cl.items.length === 1) return pin(cl.items[0], cl.items[0].x, cl.items[0].y)
          const n = cl.items.length
          const hasNext = cl.items.some(i => i.id === nextCityId)
          const bubble = (
            <>
              {hasNext && <circle cx={cl.x} cy={cl.y} r={20 * u} fill="none" stroke="var(--color-orange)" strokeWidth={2 * u} opacity={.7} />}
              <circle cx={cl.x} cy={cl.y} r={13 * u} fill="var(--color-blue)" stroke="#0A0A0B" strokeWidth={2 * u} />
              <text x={cl.x} y={cl.y + 4 * u} textAnchor="middle" fill="#fff" fontSize={12 * u} fontWeight={800} fontFamily="var(--font-sans)" pointerEvents="none">{n}</text>
            </>
          )
          // phones: a cluster does not fan out; tapping it just zooms in towards it
          if (touch) return <g key={cl.id} className="cursor-pointer" onClick={() => setZoom(view.k * 2, cl.x, cl.y)}>{bubble}</g>
          const isOpen = open === cl.id
          const R = 34 + n * 4
          return (
            <g key={cl.id} onMouseEnter={() => setOpen(cl.id)} onMouseLeave={() => { setOpen(null); setHover(null) }}>
              <circle cx={cl.x} cy={cl.y} r={isOpen ? R + 18 : 18} fill="transparent" />
              {isOpen
                ? cl.items.map((c, i) => {
                    const a = -Math.PI / 2 + (i / n) * Math.PI * 2; const x = cl.x + R * Math.cos(a), y = cl.y + R * Math.sin(a)
                    return <g key={c.id}><line x1={cl.x} y1={cl.y} x2={x} y2={y} stroke="rgba(255,255,255,.18)" />{pin(c, x, y)}</g>
                  })
                : <g className="cursor-pointer">{bubble}</g>}
              {isOpen && <circle cx={cl.x} cy={cl.y} r={4} fill="rgba(255,255,255,.4)" pointerEvents="none" />}
            </g>
          )
        })}
      </svg>
      {touch && (
        <div className="absolute bottom-3 right-3 flex flex-col gap-2">
          {zoomBtn(1, 'Μεγέθυνση')}{zoomBtn(-1, 'Σμίκρυνση')}
        </div>
      )}
      {touch && view.k === 1 && <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-[#0A0A0B]/70 px-3 py-1 text-[11px] font-bold text-dim">Ζουμ με δύο δάχτυλα</div>}
    </div>
  )
}
