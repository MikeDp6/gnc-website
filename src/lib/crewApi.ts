// The standing team: a crew exists on its own, and a tournament entry can later point at one.
// Everything goes through the security-definer functions in 024 — the tables are closed.
import { supabase } from './supabase'
import type { Crew } from '@/data/types'

const sb = () => { if (!supabase) throw new Error('Supabase not configured'); return supabase }

export async function fetchMyCrews(): Promise<Crew[]> {
  const { data, error } = await sb().rpc('my_crews')
  if (error) throw new Error(error.message)
  return (data as Crew[]) ?? []
}

export async function createMyCrew(p: { name: string; city?: string; mates?: string[] }): Promise<Crew> {
  const { data, error } = await sb().rpc('create_my_crew', {
    p_name: p.name, p_city: p.city || null,
    p_mates: (p.mates ?? []).map(x => x.trim()).filter(Boolean),
  })
  if (error) throw new Error(error.message)
  return data as Crew
}

export async function inviteToMyCrew(crewId: string, email: string): Promise<Crew> {
  const { data, error } = await sb().rpc('invite_to_my_crew', { p_crew: crewId, p_email: email })
  if (error) throw new Error(error.message)
  return data as Crew
}

export async function respondCrewInvite(crewId: string, accept: boolean): Promise<Crew | null> {
  const { data, error } = await sb().rpc('respond_crew_invite', { p_crew: crewId, p_accept: accept })
  if (error) throw new Error(error.message)
  return (data as Crew) ?? null
}

/** Turns invites addressed to this email into pending memberships. Safe to call on every sign-in. */
export async function claimCrewInvites(): Promise<number> {
  const { data, error } = await sb().rpc('claim_crew_invites')
  if (error) throw new Error(error.message)
  return (data as number) ?? 0
}

/**
 * Asks the edge function to post the crew's pending email invitations. Best-effort: the invitation
 * already exists in the database, so a mail that does not go out is a nuisance, not data loss.
 */
export async function sendCrewInvites(crewId: string): Promise<number> {
  const { data, error } = await sb().functions.invoke('send-crew-invites', { body: { crewId } })
  if (error) throw new Error(error.message)
  return (data as { sent?: number } | null)?.sent ?? 0
}
