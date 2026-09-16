// API layer: Supabase → frontend Bundle. Every query uses the anon key and goes through RLS (public read only).
import type { ArchiveItem, Bundle, Category, CategoryKey, Group, Match, Player, Stop, Team, TickerItem, Tournament } from '@/data/types'
import { news as mockNews, rentals as mockRentals } from '@/data/mock'
import { supabase } from './supabase'

const MONTHS = ['ΙΑΝ', 'ΦΕΒ', 'ΜΑΡ', 'ΑΠΡ', 'ΜΑΪ', 'ΙΟΥΝ', 'ΙΟΥΛ', 'ΑΥΓ', 'ΣΕΠ', 'ΟΚΤ', 'ΝΟΕ', 'ΔΕΚ']
const MONTHS_LONG = ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου']
const DAYS = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο']
const d = (iso: string) => new Date(iso + 'T00:00:00')

/** "19–20 Σεπτεμβρίου 2026" */
function dateRange(a: string, b: string) {
  const A = d(a), B = d(b)
  if (a === b) return `${A.getDate()} ${MONTHS_LONG[A.getMonth()]} ${A.getFullYear()}`
  if (A.getMonth() === B.getMonth()) return `${A.getDate()}–${B.getDate()} ${MONTHS_LONG[A.getMonth()]} ${A.getFullYear()}`
  return `${A.getDate()} ${MONTHS_LONG[A.getMonth()]} – ${B.getDate()} ${MONTHS_LONG[B.getMonth()]} ${A.getFullYear()}`
}

// ---- row types (only the columns we read) ----
type CatRow = { id: string; label: string; short: string; color_key: CategoryKey; sort_order: number }
type TourRow = { id: string; slug: string; name: string; city_id: string | null; venue: string | null; address: string | null; starts_on: string; ends_on: string; courts: number; status: string; cover_url: string | null; registration_deadline: string | null }
type DayRow = { id: string; tournament_id: string; day_index: number; date: string; start_time: string }
type TCRow = { tournament_id: string; category_id: string; qualifiers: number | null; sort_order: number }
type TeamRow = { id: string; tournament_id: string; category_id: string; name: string; city: string | null; captain_id: string | null; status: string; checked_in_at: string | null }
type TPRow = { team_id: string; player_id: string; role: string }
type PlayerRow = { id: string; display_name: string; city: string | null; since_year: number | null }
type GroupRow = { id: string; tournament_id: string; category_id: string; name: string; sort_order: number; note: string | null }
type StandRow = { group_id: string; team_id: string; played: number; wins: number; losses: number; points_for: number; points_against: number; points: number }
type MatchRow = { id: string; tournament_id: string; category_id: string; phase: Match['phase']; label: string; group_id: string | null; day_id: string | null; court: number | null; slot_time: string | null; home_team_id: string | null; away_team_id: string | null; home_label: string | null; away_label: string | null; home_score: number | null; away_score: number | null; status: string }
type WinnerRow = { tournament_id: string; category_id: string; team_id: string; place: number }
type TickerRow = { tag: string; text: string; text_en: string | null; tone: 'blue' | 'orange' }
type SponsorRow = { name: string }
type CityRow = { id: string; name: string }

async function q<T>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await p
  if (error) throw new Error(error.message)
  return data as T
}

export async function fetchBundle(): Promise<Bundle> {
  const sb = supabase
  if (!sb) throw new Error('supabase not configured')

  const [cats, tours, days, tcs, cities, ticker, sponsors, winners] = await Promise.all([
    q<CatRow[]>(sb.from('categories').select('id,label,short,color_key,sort_order').order('sort_order')),
    q<TourRow[]>(sb.from('tournaments').select('id,slug,name,city_id,venue,address,starts_on,ends_on,courts,status,cover_url,registration_deadline').order('starts_on')),
    q<DayRow[]>(sb.from('tournament_days').select('id,tournament_id,day_index,date,start_time').order('day_index')),
    q<TCRow[]>(sb.from('tournament_categories').select('tournament_id,category_id,qualifiers,sort_order')),
    q<CityRow[]>(sb.from('cities').select('id,name')),
    q<TickerRow[]>(sb.from('ticker_items').select('tag,text,text_en,tone').eq('active', true).order('sort_order')),
    q<SponsorRow[]>(sb.from('sponsors').select('name').eq('active', true).order('sort_order')),
    q<WinnerRow[]>(sb.from('tournament_winners').select('tournament_id,category_id,team_id,place')),
  ])

  // active tournament = the first one that is not finished; fall back to the latest
  const active = tours.find(t => ['registration', 'upcoming', 'live'].includes(t.status)) ?? tours[tours.length - 1]
  const activeIds = active ? [active.id] : []

  const [teams, groups, standings, matches, tps] = await Promise.all([
    q<TeamRow[]>(sb.from('teams').select('id,tournament_id,category_id,name,city,captain_id,status,checked_in_at').in('tournament_id', activeIds).order('name')),
    q<GroupRow[]>(sb.from('groups').select('id,tournament_id,category_id,name,sort_order,note').in('tournament_id', activeIds).order('sort_order')),
    q<StandRow[]>(sb.from('group_standings').select('*')),
    q<MatchRow[]>(sb.from('matches').select('id,tournament_id,category_id,phase,label,group_id,day_id,court,slot_time,home_team_id,away_team_id,home_label,away_label,home_score,away_score,status').in('tournament_id', activeIds).order('slot_time')),
    q<TPRow[]>(sb.from('team_players').select('team_id,player_id,role')),
  ])
  const playerIds = [...new Set(tps.map(x => x.player_id))]
  const players = playerIds.length ? await q<PlayerRow[]>(sb.from('players_public').select('id,display_name,city,since_year').in('id', playerIds)) : []

  const cityName = (id: string | null) => cities.find(c => c.id === id)?.name ?? ''
  const dayIndex = new Map(days.map(x => [x.id, x.day_index]))
  const catById = new Map(cats.map(c => [c.id, c]))

  const categories: Category[] = cats.map(c => ({ id: c.id, key: c.color_key, name: c.label, short: c.short }))

  const tournaments: Tournament[] = tours.map(t => {
    const tdays = days.filter(x => x.tournament_id === t.id)
    const tcats = tcs.filter(x => x.tournament_id === t.id).sort((a, b) => a.sort_order - b.sort_order)
    return {
      id: t.id, slug: t.slug, name: t.name, city: cityName(t.city_id), venue: t.venue ?? '', address: t.address ?? undefined,
      dates: dateRange(t.starts_on, t.ends_on),
      startsAt: `${t.starts_on}T${(tdays[0]?.start_time ?? '17:00').slice(0, 5)}:00+03:00`,
      days: tdays.map(x => `${DAYS[d(x.date).getDay()]} ${d(x.date).getDate()}/${d(x.date).getMonth() + 1}`),
      courts: t.courts, status: t.status === 'done' || t.status === 'archived' ? 'done' : t.status === 'live' ? 'live' : t.status === 'registration' ? 'registration' : 'upcoming',
      teamsCount: teams.filter(x => x.tournament_id === t.id).length,
      categoryIds: tcats.map(x => x.category_id), cover: t.cover_url ?? '/img/hero-dark.jpg',
    }
  })

  const teamList: Team[] = teams.map(t => ({
    id: t.id, name: t.name, categoryId: t.category_id, tournamentId: t.tournament_id, city: t.city ?? undefined, captainId: t.captain_id ?? undefined,
    playerIds: tps.filter(x => x.team_id === t.id).map(x => x.player_id),
  }))
  const playerList: Player[] = players.map(p => ({ id: p.id, name: p.display_name, city: p.city ?? undefined, since: p.since_year ?? undefined, teamId: tps.find(x => x.player_id === p.id)?.team_id }))

  // qualifiers per group = ceil(KO size / groups in category)
  const groupList: Group[] = groups.map(g => {
    const tc = tcs.find(x => x.tournament_id === g.tournament_id && x.category_id === g.category_id)
    const nGroups = groups.filter(x => x.tournament_id === g.tournament_id && x.category_id === g.category_id).length || 1
    const perGroup = tc?.qualifiers ? Math.ceil(tc.qualifiers / nGroups) : 0
    const rows = standings.filter(s => s.group_id === g.id)
      .sort((a, b) => b.points - a.points || (b.points_for - b.points_against) - (a.points_for - a.points_against) || b.points_for - a.points_for)
    return {
      id: g.id, categoryId: g.category_id, name: g.name, note: g.note ?? undefined,
      rows: rows.map((r, i) => ({ teamId: r.team_id, played: r.played, wins: r.wins, losses: r.losses, pointsFor: r.points_for, pointsAgainst: r.points_against, points: r.points, qualifies: i < perGroup })),
    }
  })

  const matchList: Match[] = matches.map(m => ({
    id: m.id, tournamentId: m.tournament_id, categoryId: m.category_id, phase: m.phase, label: m.label,
    day: (dayIndex.get(m.day_id ?? '') ?? 1) as 1 | 2, time: (m.slot_time ?? '').slice(0, 5), court: m.court ?? 1,
    homeId: m.home_team_id ?? undefined, awayId: m.away_team_id ?? undefined, homeLabel: m.home_label ?? undefined, awayLabel: m.away_label ?? undefined,
    homeScore: m.home_score ?? undefined, awayScore: m.away_score ?? undefined,
    status: m.status === 'final' ? 'final' : m.status === 'live' ? 'live' : 'scheduled',
  }))

  // tour list = tournaments from today on, in order
  const stops: Stop[] = tournaments.filter(t => t.status !== 'done').map((t, i) => {
    const D = d(tours.find(x => x.id === t.id)!.starts_on)
    return { id: t.id, name: t.name, dateShort: { day: String(D.getDate()), month: MONTHS[D.getMonth()] }, detail: `${t.dates} · ${t.venue}`, status: i === 0 ? 'next' : t.status === 'registration' ? 'registration' : 'soon' }
  })

  const tints: ArchiveItem['tint'][] = ['orange', 'blue', 'mono', 'teal']
  const archive: ArchiveItem[] = tournaments.filter(t => t.status === 'done').reverse().map((t, i) => {
    const w = winners.filter(x => x.tournament_id === t.id && x.place === 1)
    const D = d(tours.find(x => x.id === t.id)!.starts_on)
    return { id: t.id, city: t.city, when: `${MONTHS[D.getMonth()]} ${D.getFullYear()}`, title: `${t.teamsCount} ομάδες, ${t.categoryIds.length} κατηγορίες`,
      blurb: w.length ? 'Νικητές: ' + w.map(x => `${teams.find(tt => tt.id === x.team_id)?.name ?? '—'} (${catById.get(x.category_id)?.short ?? x.category_id})`).join(', ') : 'Αποτελέσματα, brackets και φωτογραφίες', tint: tints[i % 4] }
  })

  const tickerList: TickerItem[] = ticker.map(x => ({ tag: x.tag, text: x.text, textEn: x.text_en ?? undefined, tone: x.tone }))

  // news & rentals: content tables come with the CMS step; until then the mock content is shown
  return { categories, tournaments, teams: teamList, players: playerList, matches: matchList, groups: groupList, stops, archive, ticker: tickerList, sponsors: sponsors.map(s => s.name), news: mockNews, rentals: mockRentals }
}

/** Realtime: call `onChange` whenever a match row changes. Returns an unsubscribe. No-op without Supabase. */
export function subscribeMatches(onChange: () => void): () => void {
  const sb = supabase
  if (!sb) return () => {}
  const ch = sb.channel('public:matches').on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, onChange).subscribe()
  return () => { sb.removeChannel(ch) }
}
