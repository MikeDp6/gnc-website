// API layer: Supabase → frontend Bundle. Every query uses the anon key and goes through RLS (public read only).
import type { ArchiveItem, Bundle, Category, CategoryKey, City, CityPartner, CityVideo, Group, Match, NewsItem, Photo, Player, PlayerRank, RentalItem, SeasonEvent, SiteStats, Sponsor, Stop, Team, TickerItem, Tournament } from '@/data/types'
import { news as mockNews, rentals as mockRentals, cities as mockCities, season2026, sponsorList } from '@/data/mock'
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
type TourRow = { id: string; slug: string; name: string; city_id: string | null; venue: string | null; address: string | null; starts_on: string; ends_on: string; courts: number; status: string; cover_url: string | null; poster_url: string | null; registration_deadline: string | null; arrivals_json: Tournament['arrivals'] | null; schedule_public: boolean | null }
type DayRow = { id: string; tournament_id: string; day_index: number; date: string; start_time: string }
type TCRow = { tournament_id: string; category_id: string; qualifiers: number | null; sort_order: number }
type TeamRow = { id: string; tournament_id: string; category_id: string; name: string; city: string | null; captain_id: string | null; status: string; checked_in_at: string | null }
type TPRow = { team_id: string; player_id: string; role: string }
type PlayerRow = { id: string; display_name: string; nickname?: string | null; city: string | null; since_year: number | null; avatar_url?: string | null }
type GroupRow = { id: string; tournament_id: string; category_id: string; name: string; sort_order: number; note: string | null }
type StandRow = { group_id: string; team_id: string; played: number; wins: number; losses: number; points_for: number; points_against: number; points: number }
type MatchRow = { id: string; tournament_id: string; category_id: string; phase: Match['phase']; label: string; group_id: string | null; day_id: string | null; court: number | null; slot_time: string | null; home_team_id: string | null; away_team_id: string | null; home_label: string | null; away_label: string | null; home_score: number | null; away_score: number | null; status: string }
type WinnerRow = { tournament_id: string; category_id: string; team_id: string; place: number }
type TickerRow = { tag: string; text: string; text_en: string | null; tone: 'blue' | 'orange' }
type SponsorRow = { name: string; url: string | null; logo_url: string | null; tier?: Sponsor['tier'] | null; blurb?: string | null }
import type { MediaLink } from '@/components/MediaCard'
type PhotoRow = { id: string; url: string; caption: string | null; credit: string | null; tournament_id: string | null; city_id: string | null }
type CityRow = { id: string; name: string; name_en: string | null; lat: number | null; lng: number | null; image_url?: string | null; videos?: CityVideo[] | null; years?: number[] | null; partners?: CityPartner[] | null }
type NewsRow = { id: string; slug: string; title: string; excerpt: string | null; body: string | null; tag: string; published_on: string; image_url: string | null; image_pos?: string | null; source_url: string | null }
type RentalRow = { id: string; name: string; blurb: string | null; price: string; image_url: string | null }
type SeasonRow = { id: string; city_id: string | null; label: string | null; venue: string | null; starts_on: string; ends_on: string; done: boolean; registration_open: boolean; poster_url: string | null }
type StatsRow = { cities: number; tournaments: number; teams: number; players: number; matches: number; since_year: number; population: number; spectators: number }
const MONTHS_SHORT = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μάι', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ']
/** "7 Σεπ 2026" */
const shortDate = (iso: string) => { const D = d(iso); return `${D.getDate()} ${MONTHS_SHORT[D.getMonth()]} ${D.getFullYear()}` }
/** "25/01 - 26/01" (the calendar format used on gnc3on3.gr) */
const ddmm = (iso: string) => { const D = d(iso); return `${String(D.getDate()).padStart(2, '0')}/${String(D.getMonth() + 1).padStart(2, '0')}` }
/** content tables arrive with migration 008; until it runs, fall back to the built-in content instead of failing the whole bundle */
const orElse = <T,>(p: Promise<T>, fallback: T) => p.catch(err => { console.warn('[gnc] content table missing, using built-in content:', err?.message); return fallback })

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
    q<TourRow[]>(sb.from('tournaments').select('id,slug,name,city_id,venue,address,starts_on,ends_on,courts,status,cover_url,poster_url,registration_deadline,arrivals_json,schedule_public').order('starts_on')),
    q<DayRow[]>(sb.from('tournament_days').select('id,tournament_id,day_index,date,start_time').order('day_index')),
    q<TCRow[]>(sb.from('tournament_categories').select('tournament_id,category_id,qualifiers,sort_order')),
    orElse(q<CityRow[]>(sb.from('cities').select('id,name,name_en,lat,lng,image_url,videos,years,partners').order('sort_order')), null).then(r => r ?? q<CityRow[]>(sb.from('cities').select('id,name,name_en,lat,lng').order('sort_order'))),
    q<TickerRow[]>(sb.from('ticker_items').select('tag,text,text_en,tone').eq('active', true).order('sort_order')),
    orElse(q<SponsorRow[]>(sb.from('sponsors').select('name,url,logo_url,tier,blurb').eq('active', true).order('sort_order')), null).then(r => r ?? q<SponsorRow[]>(sb.from('sponsors').select('name,url,logo_url').eq('active', true).order('sort_order'))),
    // places come from the results themselves (category_places), with tournament_winners as the manual override inside it
    orElse(q<WinnerRow[]>(sb.from('category_places').select('tournament_id,category_id,team_id,place').lte('place', 1)), null)
      .then(r => r ?? q<WinnerRow[]>(sb.from('tournament_winners').select('tournament_id,category_id,team_id,place'))),
  ])
  const [newsRows, rentalRows, seasonRows, statsRow, photoRows, linkRows] = await Promise.all([
    // image_pos arrives with migration 036; until it has run, fall back to the old column list
    orElse(q<NewsRow[]>(sb.from('news').select('id,slug,title,excerpt,body,tag,published_on,image_url,image_pos,source_url').eq('published', true).order('published_on', { ascending: false })), null)
      .then(r => r ?? orElse(q<NewsRow[]>(sb.from('news').select('id,slug,title,excerpt,body,tag,published_on,image_url,source_url').eq('published', true).order('published_on', { ascending: false })), null)),
    orElse(q<RentalRow[]>(sb.from('rentals').select('id,name,blurb,price,image_url').eq('active', true).order('sort_order')), null),
    orElse(q<SeasonRow[]>(sb.from('season_events').select('id,city_id,label,venue,starts_on,ends_on,done,registration_open,poster_url').order('starts_on')), null),
    orElse(q<StatsRow>(sb.from('site_stats').select('*').single()), null),
    orElse(q<PhotoRow[]>(sb.from('photos').select('id,url,caption,credit,tournament_id,city_id').order('sort_order')), null),
    orElse(q<MediaLink[]>(sb.from('media_links').select('id,url,platform,kind,title,thumb_url,sort_order,tournament_id').order('sort_order')), null),
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
  const players = playerIds.length ? await orElse(q<PlayerRow[]>(sb.from('players_public').select('id,display_name,nickname,city,since_year,avatar_url').in('id', playerIds)), null).then(r => r ?? q<PlayerRow[]>(sb.from('players_public').select('id,display_name,city,since_year').in('id', playerIds))) : []

  const cityName = (id: string | null) => cities.find(c => c.id === id)?.name ?? ''
  const dayIndex = new Map(days.map(x => [x.id, x.day_index]))
  const catById = new Map(cats.map(c => [c.id, c]))

  const categories: Category[] = cats.map(c => ({ id: c.id, key: c.color_key, name: c.label, short: c.short }))

  const tournaments: Tournament[] = tours.map(t => {
    const tdays = days.filter(x => x.tournament_id === t.id)
    const tcats = tcs.filter(x => x.tournament_id === t.id).sort((a, b) => a.sort_order - b.sort_order)
    return {
      id: t.id, slug: t.slug, name: t.name, city: cityName(t.city_id), cityId: t.city_id ?? undefined, venue: t.venue ?? '', address: t.address ?? undefined,
      dates: dateRange(t.starts_on, t.ends_on),
      startsAt: `${t.starts_on}T${(tdays[0]?.start_time ?? '17:00').slice(0, 5)}:00+03:00`,
      days: tdays.map(x => `${DAYS[d(x.date).getDay()]} ${d(x.date).getDate()}/${d(x.date).getMonth() + 1}`),
      courts: t.courts, status: t.status === 'done' || t.status === 'archived' ? 'done' : t.status === 'live' ? 'live' : t.status === 'registration' ? 'registration' : 'upcoming',
      teamsCount: teams.filter(x => x.tournament_id === t.id).length,
      categoryIds: tcats.map(x => x.category_id), cover: t.cover_url ?? '/img/gnc/hero-gnc-sunset.jpg', poster: t.poster_url ?? undefined,
      arrivals: t.arrivals_json ?? undefined, schedulePublic: t.schedule_public ?? true,
    }
  })

  const teamList: Team[] = teams.map(t => ({
    id: t.id, name: t.name, categoryId: t.category_id, tournamentId: t.tournament_id, city: t.city ?? undefined, captainId: t.captain_id ?? undefined,
    playerIds: tps.filter(x => x.team_id === t.id).map(x => x.player_id),
  }))
  const playerList: Player[] = players.map(p => ({ id: p.id, name: p.display_name, nickname: p.nickname ?? undefined, city: p.city ?? undefined, since: p.since_year ?? undefined, avatar: p.avatar_url ?? undefined, teamId: tps.find(x => x.player_id === p.id)?.team_id }))

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

  // the bundle only carries the current tournament's teams, so the winners of past ones are fetched by id
  const winnerIds = [...new Set(winners.map(w => w.team_id).filter(id => !teams.some(t => t.id === id)))]
  const winnerNames = new Map<string, string>(teams.map(t => [t.id, t.name]))
  if (winnerIds.length) {
    const rows = await orElse(q<Array<{ id: string; name: string }>>(sb.from('teams').select('id,name').in('id', winnerIds)), [])
    rows.forEach(r => winnerNames.set(r.id, r.name))
  }

  const tints: ArchiveItem['tint'][] = ['orange', 'blue', 'mono', 'teal']
  const archive: ArchiveItem[] = tournaments.filter(t => t.status === 'done').reverse().map((t, i) => {
    const w = winners.filter(x => x.tournament_id === t.id && x.place === 1)
    const D = d(tours.find(x => x.id === t.id)!.starts_on)
    return { id: t.id, city: t.city, when: `${MONTHS[D.getMonth()]} ${D.getFullYear()}`, title: `${t.categoryIds.length} κατηγορίες`,
      blurb: w.length ? 'Νικητές: ' + w.map(x => `${winnerNames.get(x.team_id) ?? '—'} (${catById.get(x.category_id)?.short ?? x.category_id})`).join(', ') : 'Αποτελέσματα, brackets και φωτογραφίες', tint: tints[i % 4] }
  })

  const tickerList: TickerItem[] = ticker.map(x => ({ tag: x.tag, text: x.text, textEn: x.text_en ?? undefined, tone: x.tone }))

  const news: NewsItem[] = newsRows ? newsRows.map((n, i) => ({ id: n.id, slug: n.slug, tag: n.tag, date: shortDate(n.published_on), publishedOn: n.published_on ?? undefined, title: n.title, excerpt: n.excerpt ?? '', body: n.body ?? undefined, tint: tints[i % 4], image: n.image_url ?? undefined, imagePos: n.image_pos ?? undefined, source: n.source_url ?? undefined })) : mockNews
  const rentals: RentalItem[] = rentalRows ? rentalRows.map(r => ({ id: r.id, name: r.name, blurb: r.blurb ?? '', price: r.price, image: r.image_url ?? undefined })) : mockRentals
  const cityList: City[] = cities.filter(c => c.lat != null && c.lng != null).map(c => {
    const m = mockCities.find(x => x.id === c.id)   // media fallback until 008 has run
    return { id: c.id, name: c.name, nameEn: c.name_en ?? undefined, lat: c.lat!, lng: c.lng!, image: c.image_url ?? m?.image, years: c.years?.length ? c.years : m?.years, videos: c.videos?.length ? c.videos : m?.videos, partners: c.partners?.length ? c.partners : undefined }
  })
  const season: SeasonEvent[] = seasonRows ? seasonRows.map(e => {
    const city = cities.find(c => c.id === e.city_id)
    return { id: e.id, cityId: e.city_id ?? '', city: city?.name ?? e.label ?? '', dates: e.starts_on === e.ends_on ? ddmm(e.starts_on) : `${ddmm(e.starts_on)} - ${ddmm(e.ends_on)}`, venue: e.venue ?? '', month: MONTHS_SHORT[d(e.starts_on).getMonth()], done: e.done, label: e.label ?? undefined, poster: e.poster_url ?? undefined, startsOn: e.starts_on }
  }) : season2026
  const sponsorsOut: Sponsor[] = sponsors.length ? sponsors.map(s => ({ name: s.name, url: s.url ?? undefined, logo: s.logo_url ?? undefined, tier: s.tier ?? 'partner', blurb: s.blurb ?? undefined })) : sponsorList
  const photos: Photo[] = (photoRows ?? []).map(p => ({ id: p.id, url: p.url, caption: p.caption ?? undefined, credit: p.credit ?? undefined, tournamentId: p.tournament_id ?? undefined, cityId: p.city_id ?? undefined }))

  const stats: SiteStats = statsRow
    ? { cities: statsRow.cities, tournaments: statsRow.tournaments, teams: statsRow.teams, players: statsRow.players, matches: statsRow.matches, sinceYear: statsRow.since_year, population: statsRow.population ?? 0, spectators: statsRow.spectators ?? 0 }
    : { cities: cityList.length, tournaments: tournaments.length, teams: teamList.length, players: playerList.length, matches: matchList.filter(m => m.status === 'final').length, sinceYear: 2018, population: 0, spectators: 0 }

  return { categories, tournaments, teams: teamList, players: playerList, matches: matchList, groups: groupList, stops, archive, ticker: tickerList, sponsors: sponsors.map(s => s.name), news, rentals, cities: cityList, season, sponsorList: sponsorsOut, stats, photos, mediaLinks: linkRows ?? [] }
}

type PlayerRankRow = { player_id: string; display_name: string; city: string | null; category_id: string | null; tournaments: number; teams: number; played: number; wins: number; losses: number; gold: number; silver: number; bronze: number; points: number }

/** Διαχρονική κατάταξη παικτών — φορτώνεται μόνο από τη σελίδα /rankings, όχι με το πακέτο της αρχικής. */
export async function fetchRankings(): Promise<PlayerRank[]> {
  const sb = supabase
  if (!sb) return []
  const players = await q<PlayerRankRow[]>(sb.from('player_rankings').select('*').order('points', { ascending: false }).limit(600))
  return players.map(p => ({ id: p.player_id, name: p.display_name, city: p.city ?? undefined, categoryId: p.category_id ?? undefined, tournaments: p.tournaments, teams: p.teams, played: p.played, wins: p.wins, losses: p.losses, gold: p.gold, silver: p.silver, bronze: p.bronze, points: p.points }))
}

/** Realtime: call `onChange` whenever a match row changes. Returns an unsubscribe. No-op without Supabase. */
export function subscribeMatches(onChange: () => void): () => void {
  const sb = supabase
  if (!sb) return () => {}
  const ch = sb.channel('public:matches').on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, onChange).subscribe()
  return () => { sb.removeChannel(ch) }
}


/**
 * Teams, groups and matches of ONE tournament, fetched when someone opens a page of a finished
 * tournament. The bundle carries only the current stop, to keep every visit small.
 */
export async function fetchTournamentExtra(tid: string): Promise<{ teams: Team[]; groups: Group[]; matches: Match[] } | null> {
  const sb = supabase
  if (!sb) return null
  const q = <T,>(p: PromiseLike<{ data: T | null; error: unknown }>) => p.then(({ data }) => (data ?? []) as T)
  const [teams, groups, standings, matches, tcs, days, tps] = await Promise.all([
    q<TeamRow[]>(sb.from('teams').select('id,tournament_id,category_id,name,city,captain_id,status,checked_in_at').eq('tournament_id', tid).order('name')),
    q<GroupRow[]>(sb.from('groups').select('id,tournament_id,category_id,name,sort_order,note').eq('tournament_id', tid).order('sort_order')),
    q<StandRow[]>(sb.from('group_standings').select('*')),
    q<MatchRow[]>(sb.from('matches').select('id,tournament_id,category_id,phase,label,group_id,day_id,court,slot_time,home_team_id,away_team_id,home_label,away_label,home_score,away_score,status').eq('tournament_id', tid).order('slot_time')),
    q<TCRow[]>(sb.from('tournament_categories').select('tournament_id,category_id,qualifiers,sort_order').eq('tournament_id', tid)),
    q<DayRow[]>(sb.from('tournament_days').select('id,tournament_id,day_index,date,start_time').eq('tournament_id', tid).order('day_index')),
    q<TPRow[]>(sb.from('team_players').select('team_id,player_id,role')),
  ])
  const dayIndex = new Map(days.map(x => [x.id, x.day_index]))
  return {
    teams: teams.map(t => ({ id: t.id, name: t.name, categoryId: t.category_id, tournamentId: t.tournament_id, city: t.city ?? undefined, captainId: t.captain_id ?? undefined, playerIds: tps.filter(x => x.team_id === t.id).map(x => x.player_id) })),
    groups: groups.map(g => {
      const tc = tcs.find(x => x.category_id === g.category_id)
      const nGroups = groups.filter(x => x.category_id === g.category_id).length || 1
      const perGroup = tc?.qualifiers ? Math.ceil(tc.qualifiers / nGroups) : 0
      const rows = standings.filter(s2 => s2.group_id === g.id)
        .sort((a, b) => b.points - a.points || (b.points_for - b.points_against) - (a.points_for - a.points_against) || b.points_for - a.points_for)
      return { id: g.id, categoryId: g.category_id, name: g.name, note: g.note ?? undefined,
        rows: rows.map((r, i) => ({ teamId: r.team_id, played: r.played, wins: r.wins, losses: r.losses, pointsFor: r.points_for, pointsAgainst: r.points_against, points: r.points, qualifies: i < perGroup })) }
    }),
    matches: matches.map(m => ({
      id: m.id, tournamentId: m.tournament_id, categoryId: m.category_id, phase: m.phase, label: m.label,
      day: (dayIndex.get(m.day_id ?? '') ?? 1) as 1 | 2, time: (m.slot_time ?? '').slice(0, 5), court: m.court ?? 1,
      homeId: m.home_team_id ?? undefined, awayId: m.away_team_id ?? undefined, homeLabel: m.home_label ?? undefined, awayLabel: m.away_label ?? undefined,
      homeScore: m.home_score ?? undefined, awayScore: m.away_score ?? undefined,
      status: m.status === 'final' ? 'final' : m.status === 'live' ? 'live' : 'scheduled',
    })),
  }
}
