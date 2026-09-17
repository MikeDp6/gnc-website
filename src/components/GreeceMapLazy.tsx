import { Suspense, lazy } from 'react'

// The map outline is a 65 KB path; it is well below the fold, so it is fetched separately.
const GreeceMap = lazy(() => import('./GreeceMap').then(m => ({ default: m.GreeceMap })))

export function GreeceMapLazy(props: { className?: string; nextCityId?: string }) {
  return (
    <Suspense fallback={<div className={props.className} />}>
      <GreeceMap {...props} />
    </Suspense>
  )
}
