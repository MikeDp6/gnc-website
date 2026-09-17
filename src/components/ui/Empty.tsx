import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

/**
 * What a section shows before there is anything to show. A blank table reads as broken; this says
 * what is missing, why, and what to do in the meantime.
 */
export function Empty({ title, text, cta, to, href, mark = '—', className }:
  { title: string; text?: string; cta?: string; to?: string; href?: string; mark?: string; className?: string }) {
  const link = 'pop mt-5 inline-flex items-center gap-2 rounded-full border border-orange px-5 py-[9px] text-[12px] font-bold uppercase tracking-[.08em] text-orange hover:bg-orange hover:text-[#111]'
  return (
    <div className={cn('card flex flex-col items-center rounded-band px-6 py-12 text-center', className)}>
      <div className="disp mb-3 text-[52px] leading-none text-white/12">{mark}</div>
      <div className="text-[17px] font-bold">{title}</div>
      {text && <p className="mt-2 max-w-[440px] text-[14px] text-dim">{text}</p>}
      {cta && to && <Link to={to} className={link}>{cta} <span aria-hidden>→</span></Link>}
      {cta && href && !to && <a href={href} className={link}>{cta} <span aria-hidden>→</span></a>}
    </div>
  )
}
