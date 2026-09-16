// Public-site form primitives (dark, pill-free — match the site cards)
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const base = 'w-full rounded-[10px] border border-line bg-transparent px-4 py-3 text-[14px] outline-none placeholder:text-mute focus:border-white/40 disabled:opacity-50'
export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return <label className={cn('block text-[13px]', className)}><span className="mb-1 block font-semibold text-dim">{label}</span>{children}{hint && <span className="mt-1 block text-[11px] text-mute">{hint}</span>}</label>
}
export const TextInput = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cn(base, p.className)} />
export const SelectInput = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cn(base, 'bg-bg', p.className)} />
export const TextArea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cn(base, p.className)} />
export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="mb-8 flex flex-wrap gap-2">
      {steps.map((s, i) => (
        <li key={s} className={cn('flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-bold uppercase tracking-[.08em]', i === current ? 'border-orange bg-orange text-[#111]' : i < current ? 'border-ok/60 text-ok' : 'border-line text-dim')}>
          <span className="mono">{i < current ? '✓' : i + 1}</span>{s}
        </li>
      ))}
    </ol>
  )
}
