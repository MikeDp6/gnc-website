// Player profiles: the public history of any player, and the signed-in player's own record.
import { supabase } from './supabase'
import type { PlayerHistoryRow, TeamHistoryRow, MyPlayer } from '@/data/types'

const sb = () => { if (!supabase) throw new Error('Δεν έχει ρυθμιστεί το Supabase.') ; return supabase }

type HistRow = { player_id: string; tournament_id: string; team_id: string; team_name: string; captain: boolean; played: number; wins: number; losses: number; slug: string; tournament_name: string; starts_on: string; status: string; city_id: string | null; category_label: string; category_short: string; color_key: string; place: number | null }
type TeamHistRow = { team_key: string; team_id: string; tournament_id: string; slug: string; tournament_name: string; starts_on: string; category_label: string; color_key: string; played: number; wins: number; losses: number; place: number | null }

const mapHist = (r: HistRow): PlayerHistoryRow => ({
  tournamentId: r.tournament_id, slug: r.slug, tournament: r.tournament_name, startsOn: r.starts_on, status: r.status,
  teamId: r.team_id, team: r.team_name, captain: r.captain, category: r.category_label, categoryShort: r.category_short,
  colorKey: r.color_key, played: r.played, wins: r.wins, losses: r.losses, place: r.place ?? undefined,
})

/** Every tournament a player has appeared in, newest first. Empty when the database is not configured. */
export async function fetchPlayerHistory(playerId: string): Promise<PlayerHistoryRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('player_history').select('*').eq('player_id', playerId).order('starts_on', { ascending: false })
  if (error) { console.warn('[gnc] player_history:', error.message); return [] }
  return (data as HistRow[]).map(mapHist)
}

/** The same for a team name (teams are one row per tournament, so history is keyed by the name). */
export async function fetchTeamHistory(teamKey: string): Promise<TeamHistoryRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('team_history').select('*').eq('team_key', teamKey.trim().toLowerCase()).order('starts_on', { ascending: false })
  if (error) { console.warn('[gnc] team_history:', error.message); return [] }
  return (data as TeamHistRow[]).map(r => ({
    tournamentId: r.tournament_id, slug: r.slug, tournament: r.tournament_name, startsOn: r.starts_on, teamId: r.team_id,
    category: r.category_label, colorKey: r.color_key, played: r.played, wins: r.wins, losses: r.losses, place: r.place ?? undefined,
  }))
}

/** Public profile of one player (name, nickname, city, photo) — no contact details are exposed. */
export async function fetchPlayerPublic(id: string) {
  if (!supabase) return null
  const { data, error } = await supabase.from('players_public').select('*').eq('id', id).maybeSingle()
  if (error) { console.warn('[gnc] players_public:', error.message); return null }
  return data as { id: string; display_name: string; nickname: string | null; city: string | null; since_year: number | null; avatar_url: string | null } | null
}

/** Links the signed-in account to the player row created when they registered. Returns the player id, if any. */
export async function claimPlayer(): Promise<string | null> {
  const { data, error } = await sb().rpc('claim_player')
  if (error) throw new Error(error.message)
  return (data as { player_id: string | null })?.player_id ?? null
}

export async function fetchMyPlayer(): Promise<MyPlayer | null> {
  const { data, error } = await sb().rpc('my_player')
  if (error) throw new Error(error.message)
  return (data as MyPlayer) ?? null
}

export async function updateMyPlayer(p: { first?: string; last?: string; nickname?: string | null; city?: string | null; avatar?: string | null; isPublic?: boolean }): Promise<MyPlayer> {
  const { data, error } = await sb().rpc('update_my_player', {
    p_first: p.first ?? null, p_last: p.last ?? null, p_nickname: p.nickname ?? null,
    p_city: p.city ?? null, p_avatar: p.avatar ?? null, p_public: p.isPublic ?? null,
  })
  if (error) throw new Error(error.message)
  return data as MyPlayer
}

/** Uploads a profile photo to media/avatars/<user id>/… and returns its public URL. */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `avatars/${userId}/${Date.now().toString(36)}.${ext}`
  const { error } = await sb().storage.from('media').upload(path, file, { upsert: true, contentType: file.type || undefined, cacheControl: '3600' })
  if (error) throw new Error(error.message)
  return sb().storage.from('media').getPublicUrl(path).data.publicUrl
}
