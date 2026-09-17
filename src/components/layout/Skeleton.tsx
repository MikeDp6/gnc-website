/** Page-shaped loading placeholder shown while the bundle loads from Supabase (no flash of mock data). */
export function PageSkeleton() {
  return (
    <div className="wrap pt-6" aria-busy="true" aria-live="polite">
      <div className="skel h-[420px] rounded-band md:h-[520px]" />
      <div className="mt-8 flex gap-2">{[1, 2, 3, 4].map(i => <div key={i} className="skel h-10 w-28 rounded-full" />)}</div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">{[1, 2, 3].map(i => <div key={i} className="skel h-[180px]" />)}</div>
      <div className="mt-4 grid gap-2">{[1, 2, 3, 4, 5].map(i => <div key={i} className="skel h-[62px]" />)}</div>
    </div>
  )
}
