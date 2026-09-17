import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Bundle } from './types'
import { mockBundle } from './mock'
import { fetchBundle, subscribeMatches } from '@/lib/api'
import { supabase } from '@/lib/supabase'

interface Store extends Bundle {
  loading: boolean
  source: 'mock' | 'supabase'
  teamById: (id?: string) => Bundle['teams'][number] | undefined
  categoryById: (id: string) => Bundle['categories'][number]
  playerById: (id?: string) => Bundle['players'][number] | undefined
  tournamentBySlug: (slug: string) => Bundle['tournaments'][number] | undefined
}

const Ctx = createContext<Store | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [bundle, setBundle] = useState<Bundle>(mockBundle)
  const [loading, setLoading] = useState(!!supabase)
  const [source, setSource] = useState<'mock' | 'supabase'>('mock')

  useEffect(() => {
    if (!supabase) return
    let alive = true
    let last = 0

    const load = (force = false) => {
      if (!alive) return
      const now = Date.now()
      if (!force && now - last < 15_000) return       // don't hammer it on every tab switch
      last = now
      fetchBundle().then(b => { if (alive) { setBundle(b); setSource('supabase') } })
        .catch(err => console.error('[gnc] falling back to mock data:', err))
        .finally(() => alive && setLoading(false))
    }
    load(true)

    // Anything edited in the admin — ticker, news, a tournament — should show up without a reload.
    // The page refreshes itself when it comes back into view and every couple of minutes while open.
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') load(true) }, 120_000)

    // live: any match change (score, move, status) re-fetches at once — small enough to be cheap
    const off = subscribeMatches(() => load(true))
    return () => {
      alive = false; off()
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
      window.clearInterval(timer)
    }
  }, [])

  const value = useMemo<Store>(() => ({
    ...bundle, loading, source,
    teamById: id => bundle.teams.find(x => x.id === id),
    categoryById: id => bundle.categories.find(x => x.id === id) ?? { id, key: 'o18', name: id, short: id },
    playerById: id => bundle.players.find(x => x.id === id),
    tournamentBySlug: slug => bundle.tournaments.find(x => x.slug === slug),
  }), [bundle, loading, source])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useData(): Store {
  const v = useContext(Ctx)
  if (!v) throw new Error('useData outside DataProvider')
  return v
}
