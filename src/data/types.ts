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

export interface Player {
  id: string
  name: string
  city?: string
  since?: number
  teamId?: string
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

export interface SiteStats { cities: number; tournaments: number; teams: number; players: number; matches: number; sinceYear: number }
export interface TeamRank { key: string; name: string; teamId?: string; tournaments: number; played: number; wins: number; losses: number; pointsFor: number; pointsAgainst: number; gold: number; silver: number; bronze: number; points: number }
export interface PlayerRank { id: string; name: string; city?: string; tournaments: number; teams: number; played: number; wins: number; losses: number; gold: number; silver: number; bronze: number; points: number }

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
}

export interface CityVideo { kind: 'youtube' | 'instagram'; id: string }
export interface City { id: string; name: string; nameEn?: string; lat: number; lng: number; image?: string; years?: number[]; videos?: CityVideo[] }
/** One row of the yearly calendar (from gnc3on3.gr/calendar) — lighter than a full Tournament */
export interface SeasonEvent { id: string; cityId: string; city: string; dates: string; venue: string; month: string; done: boolean; label?: string }
export type SponsorTier = 'main' | 'official' | 'partner' | 'media'
export interface Sponsor { name: string; url?: string; logo?: string; tier: SponsorTier; blurb?: string }
export interface Photo { id: string; url: string; caption?: string; credit?: string; tournamentId?: string; cityId?: string }

export interface NewsItem { id: string; slug: string; tag: string; date: string; title: string; excerpt: string; body?: string; tint: 'orange' | 'blue' | 'mono' | 'teal'; image?: string; source?: string }
export interface RentalItem { id: string; name: string; blurb: string; price: string; image?: string }
