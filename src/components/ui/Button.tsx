import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

type Variant = 'blue' | 'orange' | 'ghost' | 'white'
const styles: Record<Variant, string> = {
  blue: 'bg-blue text-white',
  orange: 'bg-orange text-[#111]',
  ghost: 'bg-transparent border border-line text-ink',
  white: 'bg-white text-[#111]',
}
export function Button({ to, href, variant = 'blue', className, children, onClick, type = 'button' }: { to?: string; href?: string; variant?: Variant; className?: string; children: React.ReactNode; onClick?: () => void; type?: 'button' | 'submit' }) {
  const cls = cn('pop inline-flex items-center justify-center gap-2 rounded-[10px] px-[22px] py-[14px] text-[14px] font-bold tracking-[.02em]', styles[variant], className)
  if (to) return <Link to={to} className={cls}>{children}</Link>
  if (href) return <a href={href} className={cls}>{children}</a>
  return <button type={type} onClick={onClick} className={cls}>{children}</button>
}
