// Admin writes. All go through RLS: the signed-in user must be in public.admins.
import { supabase } from './supabase'

const sb = () => { if (!supabase) throw new Error('Supabase not configured'); return supabase }
const run = async <T,>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> => {
  const { data, error } = await p
  if (error) throw new Error(error.message)
  return data as T
}

// ---------- tournaments ----------
export interface TournamentInput {
  slug: string; name: string; name_en?: string | null; city_id?: string | null; venue?: string | null; address?: string | null
  starts_on: string; ends_on: string; courts: number; status: string; is_public: boolean; schedule_public?: boolean; auto_approve?: boolean; registration_deadline?: string | null; cover_url?: string | null; poster_url?: string | null
}
export const listTournaments = () => run<Array<TournamentInput & { id: string; settings_json: Record<string, unknown> }>>(
  sb().from('tournaments').select('id,slug,name,name_en,city_id,venue,address,starts_on,ends_on,courts,status,is_public,schedule_public,registration_deadline,cover_url,poster_url,settings_json').order('starts_on', { ascending: false }))
export const getTournament = (id: string) => run<TournamentInput & { id: string; settings_json: Record<string, unknown> }>(
  sb().from('tournaments').select('id,slug,name,name_en,city_id,venue,address,starts_on,ends_on,courts,status,is_public,schedule_public,auto_approve,registration_deadline,cover_url,poster_url,settings_json').eq('id', id).single())
/** Calendar date as YYYY-MM-DD in local time. toISOString() is UTC: in Greece local midnight is 21:00
 *  or 22:00 of the previous day there, which is how day 1 of 10/10 used to be stored as 09/10. */
export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const calendar = (from: string, to: string) => {
  const out: string[] = []
  for (let d = new Date(from + 'T12:00:00'), b = new Date(to + 'T12:00:00'); d <= b; d.setDate(d.getDate() + 1)) out.push(ymd(d))
  return out
}

export const createTournament = async (t: TournamentInput) => {
  const row = await run<{ id: string }>(sb().from('tournaments').insert(t).select('id').single())
  // one day per calendar day between starts_on and ends_on
  const days = calendar(t.starts_on, t.ends_on).map((date, i) => ({ tournament_id: row.id, day_index: i + 1, date, courts: t.courts }))
  if (days.length) await run(sb().from('tournament_days').insert(days))
  return row.id
}

/**
 * Keep the schedule days in step with the tournament dates. Existing days are re-dated in place (their
 * times, courts and any matches stay attached); missing days are added; surplus days are removed only
 * when no match sits on them — otherwise the change is refused rather than silently orphaning games.
 */
async function syncDays(id: string, from: string, to: string, courts?: number) {
  const want = calendar(from, to)
  const have = await run<Array<{ id: string; day_index: number; date: string }>>(sb().from('tournament_days').select('id,day_index,date').eq('tournament_id', id).order('day_index'))
  const extra = have.slice(want.length)
  if (extra.length) {
    const used = await run<Array<{ id: string }>>(sb().from('matches').select('id').in('day_id', extra.map(d => d.id)).limit(1))
    if (used.length) throw new Error('Οι νέες ημερομηνίες έχουν λιγότερες μέρες, αλλά υπάρχουν αγώνες στις μέρες που περισσεύουν. Μετακίνησέ τους πρώτα από το Πρόγραμμα.')
    await run(sb().from('tournament_days').delete().in('id', extra.map(d => d.id)))
  }
  for (let i = 0; i < Math.min(want.length, have.length); i++) {
    if (have[i].date !== want[i]) await run(sb().from('tournament_days').update({ date: want[i] }).eq('id', have[i].id))
  }
  const add = want.slice(have.length).map((date, k) => ({ tournament_id: id, day_index: have.length + k + 1, date, ...(courts ? { courts } : {}) }))
  if (add.length) await run(sb().from('tournament_days').insert(add))
}

export const updateTournament = async (id: string, t: Partial<TournamentInput> & { settings_json?: Record<string, unknown> }) => {
  await run(sb().from('tournaments').update(t).eq('id', id))
  if (t.starts_on && t.ends_on) await syncDays(id, t.starts_on, t.ends_on, t.courts)
}
export const deleteTournament = (id: string) => run(sb().from('tournaments').delete().eq('id', id))

// ---------- reference ----------
export const listCities = () => run<Array<{ id: string; name: string }>>(sb().from('cities').select('id,name').order('sort_order'))
export const listCategories = () => run<Array<{ id: string; label: string; short: string; color_key: string; sort_order: number }>>(sb().from('categories').select('id,label,short,color_key,sort_order').order('sort_order'))

// ---------- days & categories of a tournament ----------
export const listDays = (tid: string) => run<Array<{ id: string; day_index: number; date: string; start_time: string; end_time: string; courts: number }>>(
  sb().from('tournament_days').select('id,day_index,date,start_time,end_time,courts').eq('tournament_id', tid).order('day_index'))
export const updateDay = (id: string, patch: { start_time?: string; end_time?: string; courts?: number }) => run(sb().from('tournament_days').update(patch).eq('id', id))
export const listTournamentCategories = (tid: string) => run<Array<{ category_id: string; format: string; qualifiers: number | null; max_teams: number | null; sort_order: number }>>(
  sb().from('tournament_categories').select('category_id,format,qualifiers,max_teams,sort_order').eq('tournament_id', tid).order('sort_order'))
export const upsertTournamentCategory = (tid: string, c: { category_id: string; format: string; qualifiers: number | null; max_teams?: number | null; sort_order: number }) =>
  run(sb().from('tournament_categories').upsert({ tournament_id: tid, ...c }))
export const removeTournamentCategory = (tid: string, cid: string) => run(sb().from('tournament_categories').delete().match({ tournament_id: tid, category_id: cid }))

// ---------- teams ----------
export interface TeamRow { id: string; category_id: string; name: string; city: string | null; status: string; checked_in_at: string | null }
/** invite_code is deliberately not selected — it is closed to direct reads since 020. */
export const listTeams = (tid: string) => run<TeamRow[]>(sb().from('teams').select('id,category_id,name,city,status,checked_in_at').eq('tournament_id', tid).order('category_id').order('name'))
export const addTeams = (tid: string, rows: Array<{ category_id: string; name: string; city?: string | null }>) =>
  run(sb().from('teams').upsert(rows.map(r => ({ tournament_id: tid, status: 'active', ...r })), { onConflict: 'tournament_id,category_id,name', ignoreDuplicates: true }))
export interface RosterPlayer { id: string; user_id: string | null; first_name: string; last_name: string; birth_year: number | null; email: string | null; phone: string | null; guardian_name: string | null }
/** Everything the Excel export needs: each team with its roster and the players' contact details. */
export interface TeamExport {
  id: string; category_id: string; name: string; city: string | null; status: string; checked_in_at: string | null; created_at: string; captain_id: string | null
  team_players: Array<{ role: string; accepted_at: string | null; players: RosterPlayer | null }>
}
export const exportTeams = (tid: string) => run<TeamExport[]>(sb().from('teams')
  .select('id,category_id,name,city,status,checked_in_at,created_at,captain_id,team_players(role,accepted_at,players(id,user_id,first_name,last_name,birth_year,email,phone,guardian_name))')
  .eq('tournament_id', tid).order('category_id').order('name') as unknown as PromiseLike<{ data: TeamExport[] | null; error: { message: string } | null }>)
export const updateTeam = (id: string, patch: Partial<Pick<TeamRow, 'name' | 'city' | 'status' | 'category_id'>> & { checked_in_at?: string | null }) => run(sb().from('teams').update(patch).eq('id', id))
export const deleteTeam = (id: string) => run(sb().from('teams').delete().eq('id', id))

// ---------- roster (admin, also on the day at the court) ----------
export type PlayerPatch = Partial<Pick<RosterPlayer, 'first_name' | 'last_name' | 'birth_year' | 'email' | 'phone' | 'guardian_name'>>
/** Edits the person, not just this team's line: a player with a profile sees the change everywhere. */
export const updatePlayer = (id: string, patch: PlayerPatch) => run(sb().from('players').update(patch).eq('id', id))
export const setMemberConfirmed = (team: string, player: string, yes: boolean) =>
  run(sb().from('team_players').update({ accepted_at: yes ? new Date().toISOString() : null }).match({ team_id: team, player_id: player }))
/** Takes the player off this team only; the person and their history stay. */
export const removeMember = (team: string, player: string) => run(sb().from('team_players').delete().match({ team_id: team, player_id: player }))
export async function setCaptain(team: string, player: string) {
  await run(sb().from('team_players').update({ role: 'player' }).eq('team_id', team).eq('role', 'captain'))
  await run(sb().from('team_players').update({ role: 'captain', accepted_at: new Date().toISOString() }).match({ team_id: team, player_id: player }))
  await run(sb().from('teams').update({ captain_id: player }).eq('id', team))
}
/**
 * Adds a person to a team. An email that already belongs to a player reuses that player — one person,
 * one history — and fills in whatever of the typed details they were missing.
 */
export async function addMember(team: string, p: { first_name: string; last_name: string; birth_year: number | null; email: string | null; phone: string | null }) {
  let id: string | null = null
  if (p.email) {
    const found = await run<Array<RosterPlayer>>(sb().from('players').select('id,user_id,first_name,last_name,birth_year,email,phone,guardian_name').ilike('email', p.email).limit(1))
    if (found[0]) {
      id = found[0].id
      const fill: PlayerPatch = {}
      if (!found[0].phone && p.phone) fill.phone = p.phone
      if (!found[0].birth_year && p.birth_year) fill.birth_year = p.birth_year
      if (Object.keys(fill).length) await updatePlayer(id, fill)
    }
  }
  if (!id) id = (await run<{ id: string }>(sb().from('players').insert({ ...p, since_year: new Date().getFullYear() }).select('id').single())).id
  await run(sb().from('team_players').upsert({ team_id: team, player_id: id, role: 'player', accepted_at: new Date().toISOString() }, { onConflict: 'team_id,player_id', ignoreDuplicates: true }))
  return id
}
export const createTeam = (tid: string, t: { category_id: string; name: string; city?: string | null; status?: string }) =>
  run<{ id: string }>(sb().from('teams').insert({ tournament_id: tid, status: 'active', ...t }).select('id').single())

// ---------- matches / results ----------
export interface MatchRowA { id: string; code: string | null; category_id: string; phase: string; label: string; day_id: string | null; court: number | null; slot_time: string | null; home_team_id: string | null; away_team_id: string | null; home_label: string | null; away_label: string | null; home_score: number | null; away_score: number | null; status: string }
export const listMatches = (tid: string) => run<MatchRowA[]>(sb().from('matches').select('id,code,category_id,phase,label,day_id,court,slot_time,home_team_id,away_team_id,home_label,away_label,home_score,away_score,status').eq('tournament_id', tid).order('slot_time'))
/** Recompute the bracket seeds of a category from its group standings (no-op while the groups run). */
export const resolveSeeds = (tid: string, cid: string) => run(sb().rpc('resolve_seeds', { p_tournament: tid, p_category: cid }))

export const setScore = (id: string, home: number | null, away: number | null, status: 'scheduled' | 'live' | 'final') =>
  run(sb().from('matches').update({ home_score: home, away_score: away, status }).eq('id', id))
export const moveMatch = (id: string, patch: { day_id?: string | null; court?: number; slot_time?: string }) => run(sb().from('matches').update({ ...patch, manual_override: true }).eq('id', id))

// ---------- winners (archive) ----------
export const setWinner = (tid: string, cid: string, place: number, team_id: string) => run(sb().from('tournament_winners').upsert({ tournament_id: tid, category_id: cid, place, team_id }))
