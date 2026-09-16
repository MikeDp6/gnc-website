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
}

export interface NewsItem { id: string; slug: string; tag: string; date: string; title: string; excerpt: string; tint: 'orange' | 'blue' | 'mono' | 'teal'; image?: string }
export interface RentalItem { id: string; name: string; blurb: string; price: string; image?: string }
