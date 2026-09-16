import { cn } from '@/lib/cn'

export function Chip({ active, color, children, onClick, light }: { active?: boolean; color?: string; children: React.ReactNode; onClick?: () => void; light?: boolean }) {
  return (
    <button type="button" onClick={onClick}
      className={cn('inline-flex items-center gap-2 rounded-full border px-4 py-[10px] text-[13px] font-bold tracking-[.04em] transition-colors',
        light ? (active ? 'bg-bg text-white border-bg' : 'border-bg text-bg') : (active ? 'bg-white text-bg border-white' : 'border-line text-[#d9d8d3] hover:border-white/30'))}>
      {color && <i className="inline-block h-[9px] w-[9px] rounded-full" style={{ background: color }} />}
      {children}
    </button>
  )
}
