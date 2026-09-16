import { Heading } from '@/components/ui/Heading'
export function Placeholder({ a, b, note }: { a: string; b?: string; note: string }) {
  return (
    <section className="wrap py-[80px]">
      <Heading a={a} b={b} className="mb-6" />
      <div className="card p-8 text-[15px] text-dim">{note}</div>
    </section>
  )
}
