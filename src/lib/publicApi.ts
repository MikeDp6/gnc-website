// Public write API (anonymous): registration, join by invite, contact/quote. All go through SECURITY DEFINER RPCs (007_registration.sql).
import { supabase } from './supabase'

const rpc = async <T,>(fn: string, args: Record<string, unknown>): Promise<T> => {
  if (!supabase) throw new Error('Το site τρέχει σε λειτουργία επίδειξης — η φόρμα δεν στέλνει.')
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw new Error(error.message)
  return data as T
}

/** Ο συμπαίκτης δηλώνεται με όνομα· το email μένει προαιρετικό γιατί ο αρχηγός συχνά δεν το ξέρει. */
export interface Mate { first: string; last: string; birthYear: string; email: string }
export interface RegisterInput { tournamentId: string; categoryId: string; teamName: string; city?: string; first: string; last: string; email: string; phone: string; birthYear?: number; guardian?: string; mates: Mate[] }
export const registerTeam = (i: RegisterInput) => rpc<{ team_id: string; invite_code: string; status: 'pending' | 'waitlist' }>('register_team', {
  p_tournament: i.tournamentId, p_category: i.categoryId, p_team_name: i.teamName, p_city: i.city ?? null,
  p_first: i.first, p_last: i.last, p_email: i.email, p_phone: i.phone, p_birth_year: i.birthYear ?? null, p_guardian: i.guardian ?? null,
  p_mates: i.mates
    .filter(m => m.first.trim() || m.last.trim() || m.email.trim())
    .map(m => ({ first: m.first.trim(), last: m.last.trim(), birth_year: m.birthYear.trim() || null, email: m.email.trim() || null })),
})
/** Κατηγορίες της διοργάνωσης όπου δικαιούνται να παίξουν ΟΛΟΙ οι παίκτες, με σημαδεμένη την προεπιλογή. */
export interface EligibleCategory { id: string; label: string; short: string; gender: string; suggested: boolean }
export const eligibleCategories = (tournamentId: string, years: number[], gender?: string) =>
  rpc<EligibleCategory[]>('eligible_categories', { p_tournament: tournamentId, p_years: years, p_gender: gender ?? null })

export const joinTeam = (code: string, p: { first: string; last: string; email: string; phone: string; birthYear?: number; guardian?: string }) =>
  rpc<{ team_id: string; team_name: string }>('join_team', { p_code: code, p_first: p.first, p_last: p.last, p_email: p.email, p_phone: p.phone, p_birth_year: p.birthYear ?? null, p_guardian: p.guardian ?? null })
export const submitContact = (kind: 'contact' | 'quote', f: { name: string; email: string; phone?: string; org?: string; subject?: string; item?: string; eventDate?: string; message?: string }) =>
  rpc<string>('submit_contact', { p_kind: kind, p_name: f.name, p_email: f.email, p_phone: f.phone ?? null, p_org: f.org ?? null, p_subject: f.subject ?? null, p_item: f.item ?? null, p_event_date: f.eventDate || null, p_message: f.message ?? null })
/** Εγγραφή με διπλή επιβεβαίωση: το token φεύγει μόνο μέσα στο email, ποτέ στον browser. */
export async function subscribe(email: string, lang: 'el' | 'en', source = 'footer') {
  if (!supabase) throw new Error('Δεν έχει ρυθμιστεί το Supabase.')
  const { data, error } = await supabase.functions.invoke('newsletter', { body: { action: 'subscribe', email, lang, source } })
  const body = data as { ok?: boolean; error?: string } | null
  if (error || !body?.ok) throw new Error(body?.error ?? error?.message ?? 'Κάτι πήγε στραβά.')
  return true
}
export const confirmSubscription = (token: string) => rpc<{ ok: boolean; hint?: string }>('newsletter_confirm', { p_token: token })
export const unsubscribeByToken  = (token: string) => rpc<{ ok: boolean; hint?: string }>('newsletter_unsubscribe', { p_token: token })
