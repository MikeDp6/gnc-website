import { GREECE_PATH, LABELS, PINS } from '@/data/greece'
import { cn } from '@/lib/cn'

/** Real Greece outline with the tour pins; `compact` hides labels (app / small screens). */
export function GreeceMap({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <svg viewBox={compact ? '60 20 700 780' : '0 0 1000 820'} preserveAspectRatio="xMidYMid meet" className={cn('h-full w-full', className)} role="img" aria-label="Χάρτης Ελλάδας με τις στάσεις της περιοδείας">
      <path d={GREECE_PATH} fill="#17181b" stroke="#3a3c42" strokeWidth={compact ? 1.2 : 1} />
      {PINS.map((p, i) => p.next
        ? <circle key={i} cx={p.x} cy={p.y} r={11} fill="var(--color-orange)" stroke="#fff" strokeWidth={3} />
        : <circle key={i} cx={p.x} cy={p.y} r={7} fill="var(--color-blue)" opacity={0.9} />)}
      {!compact && LABELS.map((l, i) => (
        <text key={i} x={l.x} y={l.y} fill={l.small ? 'var(--color-dim)' : '#fff'} fontSize={l.small ? 11 : 13} fontWeight={l.small ? 400 : 700} fontFamily="var(--font-mono)">{l.text}</text>
      ))}
    </svg>
  )
}
