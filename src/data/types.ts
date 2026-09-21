export type CategoryKey = 'u11' | 'u13' | 'u15' | 'u18' | 'o18' | 'o35'

export interface Category {
  id: string
  key: CategoryKey          // colour family
  name: string              // "U11 MIXED", "35+ MEN"
  short: string             // "U11", "35+"
}

export interface Team {
  id: string
  name: string
  categoryId: string
  tournamentId?: string
  city?: string
  captainId?: string
  playerIds?: string[]
}

export interface PlayerHistoryRow {
  tournamentId: string; slug: string; tournament: string; startsOn: string; status: string
  teamId: string; team: string; captain: boolean
  category: string; categoryShort: string; colorKey: string
  played: number; wins: number; losses: number; place?: number
}
export interface TeamHistoryRow {
  tournamentId: string; slug: string; tournament: string; startsOn: string; teamId: string
  category: string; colorKey: string; played: number; wins: number; losses: number; place?: number
}
/** The signed-in player's own row — includes contact details, never leaves their own session. */
export interface MyPlayer {
  id: string; first_name: string; last_name: string; display_name: string; nickname: string | null
  email: string | null; phone: string | null; city: string | null; birth_year: number | null
  since_year: number | null; avatar_url: string | null; public_profile: boolean
  guardian_name: string | null; created_at: string
}

export interface Player {
  id: string
  name: string
  nickname?: string
  city?: string
  since?: number
  teamId?: string
  avatar?: string
}

export type MatchStatus = 'scheduled' | 'live' | 'final'
export type Phase = 'group' | 'qf' | 'sf' | 'final' | 'r16'

export interface Match {
  id: string
  tournamentId: string
  categoryId: string
  phase: Phase
  label: string             // "Όμιλος Α", "Προημιτελικός 1"
  day: 1 | 2
  time: string              // "17:00"
  court: number
  homeId?: string           // undefined = TBD
  awayId?: string
  homeLabel?: string        // placeholder text when TBD ("1ος Ομίλου Α")
  awayLabel?: string
  homeScore?: number
  awayScore?: number
  status: MatchStatus
}

export interface StandingRow {
  teamId: string
  played: number
  wins: number
  losses: number
  pointsFor: number
  pointsAgainst: number
  points: number
  qualifies: boolean
}

export interface Group {
  id: string
  categoryId: string
  name: string              // "Όμιλος Α"
  rows: StandingRow[]
  note?: string
}

export interface Tournament {
  id: string
  slug: string
  name: string              // "Λυκόβρυση–Πεύκη 2026"
  city: string
  cityId?: string
  venue: string
  address?: string
  dates: string             // "19–20 Σεπτεμβρίου 2026"
  startsAt: string          // ISO
  days: string[]            // ["Σάββατο 19/9", "Κυριακή 20/9"]
  courts: number
  status: 'upcoming' | 'registration' | 'live' | 'done'
  teamsCount: number
  categoryIds: string[]
  cover?: string
  poster?: string          // κατακόρυφη αφίσα της διοργάνωσης
  arrivals?: ArrivalsPublic // δημοσιευμένες ώρες προσέλευσης (ανεξάρτητα από το πρόγραμμα)
  schedulePublic?: boolean  // false = μόνο ώρες προσέλευσης στο κοινό
}

/** Snapshot published by the admin: when each category shows up, plus whatever knockout is decided. */
export interface ArrivalsPublic {
  at: string
  lead: number
  rows: Array<{ day: number; dayLabel: string; categoryId: string; category: string; color: string; first: string; arrive: string; phase: 'group' | 'ko' }>
  ko: Array<{ categoryId: string; category: string; color: string; day: number; dayLabel: string; time: string; court: number; label: string; home: string; away: string }>
}

export interface Stop {
  id: string
  name: string
  dateShort: { day: string; month: string }
  detail: string
  status: 'next' | 'registration' | 'soon' | 'done'
}

export interface ArchiveItem {
  id: string
  city: string
  when: string
  title: string
  blurb: string
  tint: 'orange' | 'blue' | 'mono' | 'teal'
}

export interface SiteStats { cities: number; tournaments: number; teams: number; players: number; matches: number; sinceYear: number; population: number; spectators: number }
export interface TeamRank { key: string; name: string; teamId?: string; categoryId?: string; tournaments: number; played: number; wins: number; losses: number; pointsFor: number; pointsAgainst: number; gold: number; silver: number; bronze: number; points: number }
export interface PlayerRank { id: string; name: string; city?: string; categoryId?: string; tournaments: number; teams: number; played: number; wins: number; losses: number; gold: number; silver: number; bronze: number; points: number }

export interface TickerItem { tag: string; text: string; textEn?: string; tone: 'blue' | 'orange' }

/** Everything the public site needs, loaded once (active tournament + marketing). Same shape from Supabase or mock. */
export interface Bundle {
  categories: Category[]
  tournaments: Tournament[]
  teams: Team[]
  players: Player[]
  matches: Match[]
  groups: Group[]
  stops: Stop[]
  archive: ArchiveItem[]
  ticker: TickerItem[]
  sponsors: string[]
  news: NewsItem[]
  rentals: RentalItem[]
  cities: City[]
  season: SeasonEvent[]
  sponsorList: Sponsor[]
  stats: SiteStats
  photos: Photo[]
  mediaLinks?: import('@/components/MediaCard').MediaLink[]
}

export interface CityVideo { kind: 'youtube' | 'instagram'; id: string }
export interface CityPartner { name: string; role?: string; url?: string }
export interface City { id: string; name: string; nameEn?: string; lat: number; lng: number; image?: string; years?: number[]; videos?: CityVideo[]; partners?: CityPartner[] }
/** One row of the yearly calendar (from gnc3on3.gr/calendar) — lighter than a full Tournament */
export interface SeasonEvent { id: string; cityId: string; city: string; dates: string; venue: string; month: string; done: boolean; label?: string; poster?: string }
export type SponsorTier = 'main' | 'official' | 'partner' | 'media'
export interface Sponsor { name: string; url?: string; logo?: string; tier: SponsorTier; blurb?: string }
export interface Photo { id: string; url: string; caption?: string; credit?: string; tournamentId?: string; cityId?: string }

export interface NewsItem { id: string; slug: string; tag: string; date: string; publishedOn?: string; title: string; excerpt: string; body?: string; tint: 'orange' | 'blue' | 'mono' | 'teal'; image?: string; imagePos?: string; source?: string }
export interface RentalItem { id: string; name: string; blurb: string; price: string; image?: string }

/** A team the signed-in player belongs to, as my_teams() returns it. */
export interface MyTeamMate { player_id: string; name: string; role: 'captain' | 'player'; joined_at: string | null }
export interface MyTeamInvite { email: string; joined: boolean }
export interface MyTeam {
  team_id: string; name: string; status: string; captain: boolean
  category: string; category_short: string
  tournament: string; slug: string; starts_on: string; tournament_status: string; venue: string | null
  invite_code: string | null
  roster: MyTeamMate[]
  invites: MyTeamInvite[] | null
}
/** Where a player stands in the all-time table. */
export interface RankSpot { position: number; total: number; points: number }
export interface PlayerRank2 { overall?: RankSpot; byCategory: Array<RankSpot & { categoryId: string }> }

/** A standing team — exists with or without a tournament. */
export interface CrewMember { player_id: string; name: string; avatar: string | null; role: 'captain' | 'player'; accepted: boolean }
export interface CrewInvite { email: string; sent: boolean }
export interface Crew {
  id: string; name: string; city: string | null
  captain: boolean            // am I the captain of it
  accepted?: boolean          // my own membership: false while the invitation is pending
  members: CrewMember[]; invites: CrewInvite[]
}
