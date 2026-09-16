import { useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

/** GNC logo: uses /img/logo.png when present (drop the file in public/img), otherwise the text mark. */
export function Logo({ className, height = 60 }: { className?: string; height?: number }) {
  const [img, setImg] = useState(true)
  return (
    <Link to="/" className={cn('inline-flex items-center', className)} aria-label="GNC 3on3">
      {img
        ? <img src="/img/logo.png" alt="GNC 3on3" style={{ height }} onError={() => setImg(false)} />
        : <span className="disp font-black leading-none tracking-[.01em]" style={{ fontSize: height }}>GNC <span className="text-blue">3</span>ON<span className="text-orange">3</span></span>}
    </Link>
  )
}
