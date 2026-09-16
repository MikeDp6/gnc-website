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
    fetchBundle().then(b => { if (alive) { setBundle(b); setSource('supabase') } })
      .catch(err => console.error('[gnc] falling back to mock data:', err))
      .finally(() => alive && setLoading(false))
    // live: any match change (score, move, status) re-fetches the bundle — small enough to be cheap
    const off = subscribeMatches(() => fetchBundle().then(b => alive && setBundle(b)).catch(() => {}))
    return () => { alive = false; off() }
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
