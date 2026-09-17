// Public write API (anonymous): registration, join by invite, contact/quote. All go through SECURITY DEFINER RPCs (007_registration.sql).
import { supabase } from './supabase'

const rpc = async <T,>(fn: string, args: Record<string, unknown>): Promise<T> => {
  if (!supabase) throw new Error('Το site τρέχει σε λειτουργία επίδειξης — η φόρμα δεν στέλνει.')
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw new Error(error.message)
  return data as T
}

export interface RegisterInput { tournamentId: string; categoryId: string; teamName: string; city?: string; first: string; last: string; email: string; phone: string; birthYear?: number; guardian?: string; mates: string[] }
export const registerTeam = (i: RegisterInput) => rpc<{ team_id: string; invite_code: string; status: 'pending' | 'waitlist' }>('register_team', {
  p_tournament: i.tournamentId, p_category: i.categoryId, p_team_name: i.teamName, p_city: i.city ?? null,
  p_first: i.first, p_last: i.last, p_email: i.email, p_phone: i.phone, p_birth_year: i.birthYear ?? null, p_guardian: i.guardian ?? null, p_mates: i.mates.filter(Boolean),
})
export const joinTeam = (code: string, p: { first: string; last: string; email: string; phone: string; birthYear?: number; guardian?: string }) =>
  rpc<{ team_id: string; team_name: string }>('join_team', { p_code: code, p_first: p.first, p_last: p.last, p_email: p.email, p_phone: p.phone, p_birth_year: p.birthYear ?? null, p_guardian: p.guardian ?? null })
export const submitContact = (kind: 'contact' | 'quote', f: { name: string; email: string; phone?: string; org?: string; subject?: string; item?: string; eventDate?: string; message?: string }) =>
  rpc<string>('submit_contact', { p_kind: kind, p_name: f.name, p_email: f.email, p_phone: f.phone ?? null, p_org: f.org ?? null, p_subject: f.subject ?? null, p_item: f.item ?? null, p_event_date: f.eventDate || null, p_message: f.message ?? null })
export const subscribe = (email: string, lang: 'el' | 'en', source = 'footer') => rpc<boolean>('subscribe', { p_email: email, p_lang: lang, p_source: source })
