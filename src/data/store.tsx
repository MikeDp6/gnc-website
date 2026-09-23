import { createContext, useContext, useEffect, useMemo, useState, type ReactNode, useCallback, useRef } from 'react'
import type { Bundle } from './types'
import { mockBundle } from './mock'
import { fetchBundle, fetchTournamentExtra, subscribeMatches } from '@/lib/api'
import { supabase } from '@/lib/supabase'

interface Store extends Bundle {
  loading: boolean
  source: 'mock' | 'supabase'
  teamById: (id?: string) => Bundle['teams'][number] | undefined
  categoryById: (id: string) => Bundle['categories'][number]
  playerById: (id?: string) => Bundle['players'][number] | undefined
  tournamentBySlug: (slug: string) => Bundle['tournaments'][number] | undefined
  /** Φέρνει τα δεδομένα μιας παλιότερης διοργάνωσης όταν ανοίξει η σελίδα της. */
  loadTournament: (tid?: string) => void
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

  // A finished tournament is not in the bundle (only the current stop is, to keep each visit light).
  // Opening its page asks for its teams, groups and matches once; they are kept apart from the bundle
  // and merged on top of it, so the periodic refresh of the bundle never drops them.
  const [extra, setExtra] = useState<{ teams: Bundle['teams']; groups: Bundle['groups']; matches: Bundle['matches'] }>({ teams: [], groups: [], matches: [] })
  const asked = useRef(new Set<string>())
  const loadTournament = useCallback((tid?: string) => {
    if (!tid || asked.current.has(tid)) return
    asked.current.add(tid)
    fetchTournamentExtra(tid).then(x => {
      if (!x) return
      setExtra(e => ({ teams: [...e.teams, ...x.teams], groups: [...e.groups, ...x.groups], matches: [...e.matches, ...x.matches] }))
    }).catch(() => { asked.current.delete(tid) })
  }, [])

  const value = useMemo<Store>(() => {
    const add = <T extends { id: string }>(base: T[], more: T[]) => {
      if (!more.length) return base
      const seen = new Set(base.map(i => i.id))
      return [...base, ...more.filter(i => !seen.has(i.id))]
    }
    const teams = add(bundle.teams, extra.teams)
    const groups = add(bundle.groups, extra.groups)
    const matches = add(bundle.matches, extra.matches)
    return {
      ...bundle, teams, groups, matches, loading, source,
      teamById: id => teams.find(x => x.id === id),
      categoryById: id => bundle.categories.find(x => x.id === id) ?? { id, key: 'o18', name: id, short: id },
      playerById: id => bundle.players.find(x => x.id === id),
      tournamentBySlug: slug => bundle.tournaments.find(x => x.slug === slug),
      loadTournament,
    }
  }, [bundle, extra, loading, source, loadTournament])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useData(): Store {
  const v = useContext(Ctx)
  if (!v) throw new Error('useData outside DataProvider')
  return v
}
