import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn('disp text-[34px] font-black leading-none tracking-[.01em]', className)}>
      GNC <span className="text-blue">3</span>ON<span className="text-orange">3</span>
    </Link>
  )
}
