// Small admin form primitives (kept local to /admin so the public site stays lean)
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export const inputCls = 'w-full rounded-[10px] border border-line bg-transparent px-3 py-[10px] text-[14px] outline-none focus:border-white/30 disabled:opacity-50'
export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <label className={cn('block text-[13px]', className)}><span className="mb-1 block text-dim">{label}</span>{children}</label>
}
export function Input(p: InputHTMLAttributes<HTMLInputElement>) { return <input {...p} className={cn(inputCls, p.className)} /> }
export function Select(p: SelectHTMLAttributes<HTMLSelectElement>) { return <select {...p} className={cn(inputCls, 'bg-bg', p.className)} /> }
export function Btn({ children, onClick, variant = 'blue', disabled, type = 'button', className }: { children: ReactNode; onClick?: () => void; variant?: 'blue' | 'orange' | 'ghost' | 'danger'; disabled?: boolean; type?: 'button' | 'submit'; className?: string }) {
  const v = { blue: 'bg-blue text-white', orange: 'bg-orange text-[#111]', ghost: 'border border-line text-ink', danger: 'border border-red/60 text-red' }[variant]
  return <button type={type} onClick={onClick} disabled={disabled} className={cn('rounded-[10px] px-4 py-[10px] text-[13px] font-bold disabled:opacity-50', v, className)}>{children}</button>
}
export function PageTitle({ a, b, right }: { a: string; b?: string; right?: ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><h1 className="disp text-[44px]">{a} {b && <span className="text-orange">{b}</span>}</h1>{right}</div>
}
export function Toast({ msg }: { msg: string | null }) { return msg ? <div className="fixed bottom-6 right-6 z-50 rounded-[10px] bg-white px-4 py-3 text-[13px] font-bold text-[#111] shadow-lg">{msg}</div> : null }
export const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[αά]/g, 'a').replace(/β/g, 'v').replace(/γ/g, 'g').replace(/δ/g, 'd').replace(/[εέ]/g, 'e').replace(/ζ/g, 'z').replace(/[ηή]/g, 'i').replace(/θ/g, 'th').replace(/[ιίϊΐ]/g, 'i').replace(/κ/g, 'k').replace(/λ/g, 'l').replace(/μ/g, 'm').replace(/ν/g, 'n').replace(/ξ/g, 'x').replace(/[οό]/g, 'o').replace(/π/g, 'p').replace(/ρ/g, 'r').replace(/[σς]/g, 's').replace(/τ/g, 't').replace(/[υύϋΰ]/g, 'y').replace(/φ/g, 'f').replace(/χ/g, 'ch').replace(/ψ/g, 'ps').replace(/[ωώ]/g, 'o')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
