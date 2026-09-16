// Mock data for development — Pefki 2026 registrations (real team names) + invented results.
// Replaced by the API layer (src/lib/api.ts) once the backend is wired.
import type { ArchiveItem, Category, Group, Match, Player, Stop, Team, Tournament } from './types'

export const categories: Category[] = [
  { id: 'u11', key: 'u11', name: 'U11 MIXED', short: 'U11' },
  { id: 'u13', key: 'u13', name: 'U13 MIXED', short: 'U13' },
  { id: 'u15', key: 'u15', name: 'U15 MEN', short: 'U15' },
  { id: 'u18m', key: 'u18', name: 'U18 MEN', short: 'U18 MEN' },
  { id: 'u18w', key: 'u18', name: 'U18 WOMEN', short: 'U18 WOMEN' },
  { id: 'o18m', key: 'o18', name: '18+ MEN', short: '18+ MEN' },
  { id: 'o18w', key: 'o18', name: '18+ WOMEN', short: '18+ WOMEN' },
  { id: 'o35', key: 'o35', name: '35+ MEN', short: '35+ MEN' },
]

const t = (id: string, name: string, categoryId: string, extra: Partial<Team> = {}): Team => ({ id, name, categoryId, ...extra })

export const teams: Team[] = [
  t('glyka', 'Γλυκά Νερά', 'u11'), t('sfent', 'ΣΦΕΝΤΟΝΑΚΙΑ', 'u11'), t('heat', 'PEFKI HEAT', 'u11'), t('wolves', 'Wolves', 'u11'),
  t('killers', 'Pefki Killers', 'u13'), t('coolaids', 'Cool Aids', 'u13'),
  t('clutch', 'Clutch time', 'u15'), t('fant3', 'Fantastic 3', 'u15'),
  t('xad', '3 ξάδερφοι 1 θρύλος', 'u18m'), t('tesa', 'ΤεΣαΠεΠα', 'u18m'), t('seamen', 'Sea Men', 'u18m'), t('atal', 'Ατάλαντοι Hawks', 'u18m'),
  t('kyps', 'KYPSELI STARS', 'u18w'), t('start', 'THE STARTERS', 'u18w'),
  t('ams', 'Athens Modelsprint', 'o18m'), t('kapi', 'ΚΑΠΗ Σεπολίων', 'o18m'), t('barca', 'BARCA PEFKIS', 'o18m'), t('peronia', 'Peronia bc', 'o18m'),
  t('erasi', 'Erasitechnes BC', 'o35', { city: 'Αθήνα', captainId: 'p1', playerIds: ['p1', 'p2', 'p3', 'p4'] }),
  t('rafina', 'RAFINA WARRIORS', 'o35'), t('managg', 'ΜΑΝΑΓΓΙΑΡΤ', 'o35'), t('dalai', 'Δαλάι Κλάμα', 'o35'),
  t('baba', 'Babasket', 'o35'), t('chicago', 'Chicago Cools', 'o35'), t('faethon', 'ΦΑΕΘΩΝ', 'o35'), t('retro', 'Retro Ballers', 'o35'),
]

export const players: Player[] = [
  { id: 'p1', name: 'Γιώργος Αντωνίου', city: 'Αθήνα', since: 2019, teamId: 'erasi' },
  { id: 'p2', name: 'Νίκος Καραμάνος', teamId: 'erasi' },
  { id: 'p3', name: 'Δημήτρης Πετρίδης', teamId: 'erasi' },
  { id: 'p4', name: 'Στέλιος Λαμπρόπουλος', teamId: 'erasi' },
]

export const tournaments: Tournament[] = [
  {
    id: 'pefki26', slug: 'pefki-2026', name: 'Λυκόβρυση–Πεύκη 2026', city: 'Πεύκη',
    venue: 'Δημοτικό Γήπεδο Πεύκης', address: 'Ελ. Βενιζέλου 12, Πεύκη',
    dates: '19–20 Σεπτεμβρίου 2026', startsAt: '2026-09-19T17:00:00+03:00',
    days: ['Σάββατο 19/9', 'Κυριακή 20/9'], courts: 2, status: 'upcoming', teamsCount: 52,
    categoryIds: categories.map(c => c.id), cover: '/img/hero-dark.jpg',
  },
]

const m = (id: string, categoryId: string, phase: Match['phase'], label: string, day: 1 | 2, time: string, court: number,
  homeId?: string, awayId?: string, scores?: [number, number], status: Match['status'] = 'scheduled', labels?: [string, string]): Match => ({
  id, tournamentId: 'pefki26', categoryId, phase, label, day, time, court, homeId, awayId,
  homeScore: scores?.[0], awayScore: scores?.[1], status: scores ? status : status,
  homeLabel: labels?.[0], awayLabel: labels?.[1],
})

export const matches: Match[] = [
  m('m1', 'u11', 'group', 'Όμιλος Α', 1, '17:00', 1, 'glyka', 'heat', [14, 9], 'final'),
  m('m2', 'u11', 'group', 'Όμιλος Α', 1, '17:00', 2, 'sfent', 'wolves', [11, 12], 'final'),
  m('m3', 'u18m', 'group', 'Όμιλος Α', 1, '17:20', 1, 'xad', 'atal', [21, 16], 'final'),
  m('m4', 'u13', 'group', 'Όμιλος', 1, '17:20', 2, 'killers', 'coolaids', [18, 15], 'final'),
  m('m5', 'u18m', 'group', 'Όμιλος Α', 1, '17:40', 1, 'tesa', 'seamen', [14, 9], 'live'),
  m('m6', 'u15', 'group', 'Όμιλος', 1, '17:40', 2, 'clutch', 'fant3'),
  m('m7', 'u11', 'group', 'Όμιλος Α', 1, '18:00', 1, 'glyka', 'sfent'),
  m('m8', 'u18w', 'group', 'Όμιλος', 1, '18:00', 2, 'kyps', 'start'),
  m('m9', 'o35', 'group', 'Όμιλος Α', 1, '18:20', 1, 'erasi', 'faethon', [21, 12], 'final'),
  m('m10', 'o35', 'group', 'Όμιλος Β', 1, '18:20', 2, 'rafina', 'retro'),
  m('m11', 'o18m', 'group', 'Όμιλος Α', 1, '18:40', 1, 'ams', 'kapi'),
  m('m12', 'o18m', 'group', 'Όμιλος Β', 1, '18:40', 2, 'barca', 'peronia'),
  m('m13', 'o35', 'group', 'Όμιλος Α', 1, '19:40', 2, 'managg', 'erasi', [14, 17], 'final'),
  m('m14', 'o35', 'group', 'Όμιλος Α', 1, '21:00', 1, 'erasi', 'baba', [19, 12], 'final'),
  // knockout 35+
  m('k1', 'o35', 'qf', 'Προημιτελικός 1', 2, '20:00', 1, 'erasi', 'dalai'),
  m('k2', 'o35', 'qf', 'Προημιτελικός 2', 2, '20:00', 2, 'rafina', 'faethon'),
  m('k3', 'o35', 'qf', 'Προημιτελικός 3', 2, '20:20', 1, 'managg', 'chicago'),
  m('k4', 'o35', 'qf', 'Προημιτελικός 4', 2, '20:20', 2, 'retro', 'baba'),
  m('k5', 'o35', 'sf', 'Ημιτελικός 1', 2, '21:20', 1, undefined, undefined, undefined, 'scheduled', ['Νικ. Προημ. 1', 'Νικ. Προημ. 4']),
  m('k6', 'o35', 'sf', 'Ημιτελικός 2', 2, '21:20', 2, undefined, undefined, undefined, 'scheduled', ['Νικ. Προημ. 2', 'Νικ. Προημ. 3']),
  m('k7', 'o35', 'final', 'Τελικός', 2, '22:20', 1, undefined, undefined, undefined, 'scheduled', ['Νικ. Ημιτελικού 1', 'Νικ. Ημιτελικού 2']),
]

export const groups: Group[] = [
  {
    id: 'g35a', categoryId: 'o35', name: 'Όμιλος Α', note: 'Μπλε = προκρίνονται στα νοκ-άουτ',
    rows: [
      { teamId: 'erasi', played: 3, wins: 3, losses: 0, pointsFor: 57, pointsAgainst: 31, points: 6, qualifies: true },
      { teamId: 'managg', played: 3, wins: 2, losses: 1, pointsFor: 48, pointsAgainst: 39, points: 5, qualifies: true },
      { teamId: 'baba', played: 3, wins: 1, losses: 2, pointsFor: 40, pointsAgainst: 45, points: 4, qualifies: false },
      { teamId: 'faethon', played: 3, wins: 0, losses: 3, pointsFor: 28, pointsAgainst: 58, points: 3, qualifies: false },
    ],
  },
  {
    id: 'g35b', categoryId: 'o35', name: 'Όμιλος Β', note: 'Ισοβαθμία: μεταξύ τους αγώνας → διαφορά πόντων',
    rows: [
      { teamId: 'rafina', played: 3, wins: 3, losses: 0, pointsFor: 61, pointsAgainst: 35, points: 6, qualifies: true },
      { teamId: 'retro', played: 3, wins: 2, losses: 1, pointsFor: 50, pointsAgainst: 44, points: 5, qualifies: true },
      { teamId: 'chicago', played: 3, wins: 1, losses: 2, pointsFor: 41, pointsAgainst: 47, points: 4, qualifies: false },
      { teamId: 'dalai', played: 3, wins: 0, losses: 3, pointsFor: 30, pointsAgainst: 56, points: 3, qualifies: false },
    ],
  },
  {
    id: 'g11a', categoryId: 'u11', name: 'Όμιλος Α', note: 'Οι 2 πρώτοι στον τελικό',
    rows: [
      { teamId: 'glyka', played: 1, wins: 1, losses: 0, pointsFor: 14, pointsAgainst: 9, points: 2, qualifies: true },
      { teamId: 'wolves', played: 1, wins: 1, losses: 0, pointsFor: 12, pointsAgainst: 11, points: 2, qualifies: true },
      { teamId: 'sfent', played: 1, wins: 0, losses: 1, pointsFor: 11, pointsAgainst: 12, points: 1, qualifies: false },
      { teamId: 'heat', played: 1, wins: 0, losses: 1, pointsFor: 9, pointsAgainst: 14, points: 1, qualifies: false },
    ],
  },
]

export const stops: Stop[] = [
  { id: 's1', name: 'Λυκόβρυση–Πεύκη 2026', dateShort: { day: '19', month: 'ΣΕΠ' }, detail: '19–20 Σεπ · Δημοτικό Γήπεδο Πεύκης · U11 έως 35+', status: 'next' },
  { id: 's2', name: 'Παλλήνη — Φθινόπωρο', dateShort: { day: '10', month: 'ΟΚΤ' }, detail: '10–11 Οκτ · Κλειστό Παλλήνης · 7 κατηγορίες', status: 'registration' },
  { id: 's3', name: 'Θεσσαλονίκη', dateShort: { day: '24', month: 'ΟΚΤ' }, detail: '24–25 Οκτ · Πλατεία Αριστοτέλους', status: 'soon' },
  { id: 's4', name: 'Πάτρα', dateShort: { day: '7', month: 'ΝΟΕ' }, detail: '7–8 Νοε · Παμπελοποννησιακό', status: 'soon' },
  { id: 's5', name: 'Ηράκλειο', dateShort: { day: '21', month: 'ΝΟΕ' }, detail: '21–22 Νοε · Λιμάνι Ηρακλείου', status: 'soon' },
]

export const archive: ArchiveItem[] = [
  { id: 'a1', city: 'Παλλήνη', when: 'Ιούν 2026', title: '66 ομάδες, 7 κατηγορίες', blurb: 'Νικητές: GOONLANDERS (18+), PINK ROSES (40+), ΘΥΜΙΟΛΑΣ (U18)', tint: 'orange' },
  { id: 'a2', city: 'Καλαμάτα', when: 'Μάι 2026', title: 'Το 3on3 στην παραλία', blurb: 'Αποτελέσματα, brackets και φωτογραφίες', tint: 'blue' },
  { id: 'a3', city: 'Λάρισα', when: 'Απρ 2026', title: 'Πλατεία γεμάτη μπάλα', blurb: 'Αποτελέσματα, brackets και φωτογραφίες', tint: 'mono' },
  { id: 'a4', city: 'Μύκονος', when: 'Ιούλ 2025', title: 'Νησιώτικος τελικός', blurb: 'Αποτελέσματα, brackets και φωτογραφίες', tint: 'teal' },
]

export const tickerItems = [
  { tag: 'LIVE', text: 'U18 MEN · ΤΕΣΑΠΕΠΑ – SEA MEN · ΓΗΠΕΔΟ 1', tone: 'orange' as const },
  { tag: 'ΕΠΟΜΕΝΟ', text: 'ΛΥΚΟΒΡΥΣΗ–ΠΕΥΚΗ · 19–20 ΣΕΠ', tone: 'blue' as const },
  { tag: 'ΔΗΛΩΣΕΙΣ', text: 'ΠΑΛΛΗΝΗ · ΑΝΟΙΧΤΕΣ ΕΩΣ 3 ΟΚΤ', tone: 'orange' as const },
  { tag: 'ΠΡΟΓΡΑΜΜΑ', text: 'ΠΕΥΚΗ · ΑΝΑΡΤΗΘΗΚΕ', tone: 'blue' as const },
  { tag: 'ΝΕΟ', text: 'ΤΟ APP ΤΗΣ GNC ΣΤΟ APP STORE & GOOGLE PLAY', tone: 'orange' as const },
  { tag: 'ΑΡΧΕΙΟ', text: 'ΠΑΛΛΗΝΗ 2026 · ΝΙΚΗΤΕΣ ΑΝΑ ΚΑΤΗΓΟΡΙΑ', tone: 'blue' as const },
]

export const sponsors = ['Χορηγός 1', 'Χορηγός 2', 'Δήμος Λυκόβρυσης–Πεύκης', 'Χορηγός 3', 'Χορηγός 4', 'Media partner', 'Χορηγός 5']

// ---- lookup helpers ----
export const teamById = (id?: string) => teams.find(x => x.id === id)
export const categoryById = (id: string) => categories.find(x => x.id === id)!
export const playerById = (id?: string) => players.find(x => x.id === id)
export const tournamentBySlug = (slug: string) => tournaments.find(x => x.slug === slug)
