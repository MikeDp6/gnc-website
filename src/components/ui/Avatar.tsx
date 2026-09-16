import { cn } from '@/lib/cn'

const initials = (name: string) => name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()

export function Avatar({ name, tone = 'blue', size = 64, className }: { name: string; tone?: 'blue' | 'orange' | 'grey' | 'red'; size?: number; className?: string }) {
  const bg = { blue: 'bg-[linear-gradient(135deg,var(--color-blue),var(--color-blue-deep))]', orange: 'bg-[linear-gradient(135deg,var(--color-orange),#b95f00)] text-[#111]', grey: 'bg-slate', red: 'bg-[linear-gradient(135deg,var(--color-cat-o35),#7a0a0e)]' }[tone]
  return (
    <div className={cn('disp flex shrink-0 items-center justify-center rounded-full', bg, className)} style={{ width: size, height: size, fontSize: size * 0.42 }}>{initials(name)}</div>
  )
}
