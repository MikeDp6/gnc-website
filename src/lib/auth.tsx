import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { clearQuick, hasQuick, refreshQuick, type QuickTokens } from './quickAuth'

interface Auth {
  session: Session | null
  isAdmin: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>   // returns error message or null
  /** players sign in with a one-time link — nothing to forget, nothing to leak */
  sendMagicLink: (email: string, redirectTo?: string) => Promise<string | null>
  /** …or with a password, for whoever prefers one. Both work on the same account. */
  setPassword: (password: string) => Promise<string | null>
  sendPasswordReset: (email: string) => Promise<string | null>
  /** Μπαίνει με τη συνεδρία που ξεκλείδωσε το PIN ή το Face ID αυτής της συσκευής. */
  signInWithTokens: (t: QuickTokens) => Promise<string | null>
  signOut: () => Promise<void>
}
const Ctx = createContext<Auth>({ session: null, isAdmin: false, loading: true, signIn: async () => 'no client', sendMagicLink: async () => 'no client', setPassword: async () => 'no client', sendPasswordReset: async () => 'no client', signInWithTokens: async () => 'no client', signOut: async () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(!!supabase)

  useEffect(() => {
    if (!supabase) return
    const sb = supabase
    sb.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = sb.auth.onAuthStateChange((e, s) => {
      setSession(s)
      // Το Supabase περιστρέφει το refresh token· κράτα το κλειδωμένο αντίγραφο σε συγχρονισμό,
      // αλλιώς η γρήγορη είσοδος θα ξεκλείδωνε ένα token που δεν ισχύει πια.
      if (s?.refresh_token && s.access_token && hasQuick() && (e === 'TOKEN_REFRESHED' || e === 'SIGNED_IN')) {
        refreshQuick({ access_token: s.access_token, refresh_token: s.refresh_token })
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase) return
    if (!session) { setIsAdmin(false); setLoading(false); return }
    // RLS: admins can only read the admins table if they are in it → a row = admin
    supabase.from('admins').select('role').eq('user_id', session.user.id).maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('[gnc] admins check failed:', error.message)   // usually missing GRANTs → run 004_grants.sql
        // Ο διαχειριστής ελέγχει σκορ, ομάδες και προγράμματα ολόκληρης διοργάνωσης: ένα 4ψήφιο PIN
        // σε ξεκλείδωτο κινητό είναι δυσανάλογο ρίσκο εκεί. Αν βρεθεί καταχωρημένο, φεύγει αμέσως.
        if (data && hasQuick()) clearQuick()
        setIsAdmin(!!data); setLoading(false)
      })
  }, [session])

  const value = useMemo<Auth>(() => ({
    session, isAdmin, loading,
    signIn: async (email, password) => {
      if (!supabase) return 'Δεν έχει ρυθμιστεί το Supabase (.env.local).'
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return error ? error.message : null
    },
    sendMagicLink: async (email, redirectTo) => {
      if (!supabase) return 'Δεν έχει ρυθμιστεί το Supabase (.env.local).'
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { emailRedirectTo: redirectTo ?? `${window.location.origin}/me` } })
      return error ? error.message : null
    },
    setPassword: async password => {
      if (!supabase) return 'Δεν έχει ρυθμιστεί το Supabase (.env.local).'
      if (password.length < 8) return 'Ο κωδικός θέλει τουλάχιστον 8 χαρακτήρες.'
      const { error } = await supabase.auth.updateUser({ password })
      return error ? error.message : null
    },
    sendPasswordReset: async email => {
      if (!supabase) return 'Δεν έχει ρυθμιστεί το Supabase (.env.local).'
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${window.location.origin}/me?reset=1` })
      return error ? error.message : null
    },
    signInWithTokens: async t => {
      if (!supabase) return 'Δεν έχει ρυθμιστεί το Supabase (.env.local).'
      const { error } = await supabase.auth.setSession(t)
      // άκυρο αποθηκευμένο token: η γρήγορη είσοδος δεν έχει νόημα πια σε αυτή τη συσκευή
      if (error) { clearQuick(); return 'Η αποθηκευμένη σύνδεση έληξε. Συνδέσου ξανά με email.' }
      return null
    },
    // Με ενεργή γρήγορη είσοδο η αποσύνδεση είναι τοπική: το global signOut ακυρώνει το refresh token
    // στον server, οπότε το PIN θα ξεκλείδωνε μια νεκρή συνεδρία. Το «Αφαίρεση» στο προφίλ το σβήνει.
    signOut: async () => { await supabase?.auth.signOut(hasQuick() ? { scope: 'local' } : undefined) },
  }), [session, isAdmin, loading])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export const useAuth = () => useContext(Ctx)
