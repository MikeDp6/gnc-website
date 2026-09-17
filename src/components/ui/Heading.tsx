import { cn } from '@/lib/cn'

/** Two-tone display heading: first part white, second part orange (the BIFA-style section title). */
export function Heading({ a, b, size = 'lg', className, dark = true }: { a: string; b?: string; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string; dark?: boolean }) {
  // Phones get a step down of their own: Greek display words are long and used to push the page sideways.
  const sizes = {
    sm: 'text-[28px] sm:text-[34px]',
    md: 'text-[34px] sm:text-[44px] md:text-[56px]',
    lg: 'text-[40px] sm:text-[56px] md:text-[88px]',
    xl: 'text-[46px] sm:text-[64px] md:text-[128px]',
  }
  return (
    <h2 className={cn('disp', sizes[size], dark ? 'text-ink' : 'text-bg', className)}>
      {a} {b && <span className="text-orange">{b}</span>}
    </h2>
  )
}
