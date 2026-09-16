import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Appear-on-scroll wrapper. Uses IntersectionObserver + the `.reveal/.is-in` utility; no library. */
export function Reveal({ children, className, as: Tag = 'div', delay = 0 }: { children: ReactNode; className?: string; as?: 'div' | 'section'; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('is-in'); io.disconnect() } }, { threshold: 0.12 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <Tag ref={ref as never} className={cn('reveal', className)} style={{ transitionDelay: `${delay}ms` }}>{children}</Tag>
}
