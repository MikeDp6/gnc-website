import { useEffect, useState } from 'react'

const pad = (n: number) => String(n).padStart(2, '0')

/** DD:HH:MM:SS countdown to an ISO date. Renders 00:00:00:00 once passed. */
export function Countdown({ to, className }: { to: string; className?: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [])
  const diff = Math.max(0, new Date(to).getTime() - now)
  const s = Math.floor(diff / 1000)
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), mi = Math.floor((s % 3600) / 60), se = s % 60
  return <span className={className}>{pad(d)}:{pad(h)}:{pad(mi)}:{pad(se)}</span>
}
