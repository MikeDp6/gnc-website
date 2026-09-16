// Mock data for development — Pefki 2026 registrations (real team names) + invented results.
// Replaced by the API layer (src/lib/api.ts) once the backend is wired.
import type { ArchiveItem, Bundle, Category, City, Group, Match, NewsItem, Player, RentalItem, Stop, Team, TickerItem, Tournament } from './types'

export const categories: Category[] = [
  { id: 'u11_mixed', key: 'u11', name: 'U11 MIXED', short: 'U11' },
  { id: 'u13_mixed', key: 'u13', name: 'U13 MIXED', short: 'U13' },
  { id: 'u15_men', key: 'u15', name: 'U15 MEN', short: 'U15' },
  { id: 'u18_men', key: 'u18', name: 'U18 MEN', short: 'U18 MEN' },
  { id: 'u18_women', key: 'u18', name: 'U18 WOMEN', short: 'U18 WOMEN' },
  { id: 'o18_men', key: 'o18', name: '18+ MEN', short: '18+ MEN' },
  { id: 'o18_women', key: 'o18', name: '18+ WOMEN', short: '18+ WOMEN' },
  { id: 'o35_men', key: 'o35', name: '35+ MEN', short: '35+ MEN' },
]

const t = (id: string, name: string, categoryId: string, extra: Partial<Team> = {}): Team => ({ id, name, categoryId, tournamentId: 'pefki26', ...extra })

export const teams: Team[] = [
  t('glyka', 'Γλυκά Νερά', 'u11_mixed'), t('sfent', 'ΣΦΕΝΤΟΝΑΚΙΑ', 'u11_mixed'), t('heat', 'PEFKI HEAT', 'u11_mixed'), t('wolves', 'Wolves', 'u11_mixed'),
  t('killers', 'Pefki Killers', 'u13_mixed'), t('coolaids', 'Cool Aids', 'u13_mixed'),
  t('clutch', 'Clutch time', 'u15_men'), t('fant3', 'Fantastic 3', 'u15_men'),
  t('xad', '3 ξάδερφοι 1 θρύλος', 'u18_men'), t('tesa', 'ΤεΣαΠεΠα', 'u18_men'), t('seamen', 'Sea Men', 'u18_men'), t('atal', 'Ατάλαντοι Hawks', 'u18_men'),
  t('kyps', 'KYPSELI STARS', 'u18_women'), t('start', 'THE STARTERS', 'u18_women'),
  t('ams', 'Athens Modelsprint', 'o18_men'), t('kapi', 'ΚΑΠΗ Σεπολίων', 'o18_men'), t('barca', 'BARCA PEFKIS', 'o18_men'), t('peronia', 'Peronia bc', 'o18_men'),
  t('erasi', 'Erasitechnes BC', 'o35_men', { city: 'Αθήνα', captainId: 'p1', playerIds: ['p1', 'p2', 'p3', 'p4'] }),
  t('rafina', 'RAFINA WARRIORS', 'o35_men'), t('managg', 'ΜΑΝΑΓΓΙΑΡΤ', 'o35_men'), t('dalai', 'Δαλάι Κλάμα', 'o35_men'),
  t('baba', 'Babasket', 'o35_men'), t('chicago', 'Chicago Cools', 'o35_men'), t('faethon', 'ΦΑΕΘΩΝ', 'o35_men'), t('retro', 'Retro Ballers', 'o35_men'),
]

export const players: Player[] = [
  { id: 'p1', name: 'Γιώργος Αντωνίου', city: 'Αθήνα', since: 2019, teamId: 'erasi' },
  { id: 'p2', name: 'Νίκος Καραμάνος', teamId: 'erasi' },
  { id: 'p3', name: 'Δημήτρης Πετρίδης', teamId: 'erasi' },
  { id: 'p4', name: 'Στέλιος Λαμπρόπουλος', teamId: 'erasi' },
]

export const tournaments: Tournament[] = [
  {
    id: 'pefki26', slug: 'pefki-2026', name: 'Λυκόβρυση–Πεύκη 2026', city: 'Λυκόβρυση–Πεύκη', cityId: 'pefki',
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
  m('m1', 'u11_mixed', 'group', 'Όμιλος Α', 1, '17:00', 1, 'glyka', 'heat', [14, 9], 'final'),
  m('m2', 'u11_mixed', 'group', 'Όμιλος Α', 1, '17:00', 2, 'sfent', 'wolves', [11, 12], 'final'),
  m('m3', 'u18_men', 'group', 'Όμιλος Α', 1, '17:20', 1, 'xad', 'atal', [21, 16], 'final'),
  m('m4', 'u13_mixed', 'group', 'Όμιλος', 1, '17:20', 2, 'killers', 'coolaids', [18, 15], 'final'),
  m('m5', 'u18_men', 'group', 'Όμιλος Α', 1, '17:40', 1, 'tesa', 'seamen', [14, 9], 'live'),
  m('m6', 'u15_men', 'group', 'Όμιλος', 1, '17:40', 2, 'clutch', 'fant3'),
  m('m7', 'u11_mixed', 'group', 'Όμιλος Α', 1, '18:00', 1, 'glyka', 'sfent'),
  m('m8', 'u18_women', 'group', 'Όμιλος', 1, '18:00', 2, 'kyps', 'start'),
  m('m9', 'o35_men', 'group', 'Όμιλος Α', 1, '18:20', 1, 'erasi', 'faethon', [21, 12], 'final'),
  m('m10', 'o35_men', 'group', 'Όμιλος Β', 1, '18:20', 2, 'rafina', 'retro'),
  m('m11', 'o18_men', 'group', 'Όμιλος Α', 1, '18:40', 1, 'ams', 'kapi'),
  m('m12', 'o18_men', 'group', 'Όμιλος Β', 1, '18:40', 2, 'barca', 'peronia'),
  m('m13', 'o35_men', 'group', 'Όμιλος Α', 1, '19:40', 2, 'managg', 'erasi', [14, 17], 'final'),
  m('m14', 'o35_men', 'group', 'Όμιλος Α', 1, '21:00', 1, 'erasi', 'baba', [19, 12], 'final'),
  // knockout 35+
  m('k1', 'o35_men', 'qf', 'Προημιτελικός 1', 2, '20:00', 1, 'erasi', 'dalai'),
  m('k2', 'o35_men', 'qf', 'Προημιτελικός 2', 2, '20:00', 2, 'rafina', 'faethon'),
  m('k3', 'o35_men', 'qf', 'Προημιτελικός 3', 2, '20:20', 1, 'managg', 'chicago'),
  m('k4', 'o35_men', 'qf', 'Προημιτελικός 4', 2, '20:20', 2, 'retro', 'baba'),
  m('k5', 'o35_men', 'sf', 'Ημιτελικός 1', 2, '21:20', 1, undefined, undefined, undefined, 'scheduled', ['Νικ. Προημ. 1', 'Νικ. Προημ. 4']),
  m('k6', 'o35_men', 'sf', 'Ημιτελικός 2', 2, '21:20', 2, undefined, undefined, undefined, 'scheduled', ['Νικ. Προημ. 2', 'Νικ. Προημ. 3']),
  m('k7', 'o35_men', 'final', 'Τελικός', 2, '22:20', 1, undefined, undefined, undefined, 'scheduled', ['Νικ. Ημιτελικού 1', 'Νικ. Ημιτελικού 2']),
]

export const groups: Group[] = [
  {
    id: 'g35a', categoryId: 'o35_men', name: 'Όμιλος Α', note: 'Μπλε = προκρίνονται στα νοκ-άουτ',
    rows: [
      { teamId: 'erasi', played: 3, wins: 3, losses: 0, pointsFor: 57, pointsAgainst: 31, points: 6, qualifies: true },
      { teamId: 'managg', played: 3, wins: 2, losses: 1, pointsFor: 48, pointsAgainst: 39, points: 5, qualifies: true },
      { teamId: 'baba', played: 3, wins: 1, losses: 2, pointsFor: 40, pointsAgainst: 45, points: 4, qualifies: false },
      { teamId: 'faethon', played: 3, wins: 0, losses: 3, pointsFor: 28, pointsAgainst: 58, points: 3, qualifies: false },
    ],
  },
  {
    id: 'g35b', categoryId: 'o35_men', name: 'Όμιλος Β', note: 'Ισοβαθμία: μεταξύ τους αγώνας → διαφορά πόντων',
    rows: [
      { teamId: 'rafina', played: 3, wins: 3, losses: 0, pointsFor: 61, pointsAgainst: 35, points: 6, qualifies: true },
      { teamId: 'retro', played: 3, wins: 2, losses: 1, pointsFor: 50, pointsAgainst: 44, points: 5, qualifies: true },
      { teamId: 'chicago', played: 3, wins: 1, losses: 2, pointsFor: 41, pointsAgainst: 47, points: 4, qualifies: false },
      { teamId: 'dalai', played: 3, wins: 0, losses: 3, pointsFor: 30, pointsAgainst: 56, points: 3, qualifies: false },
    ],
  },
  {
    id: 'g11a', categoryId: 'u11_mixed', name: 'Όμιλος Α', note: 'Οι 2 πρώτοι στον τελικό',
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

export const tickerItems: TickerItem[] = [
  { tag: 'LIVE', text: 'U18 MEN · ΤΕΣΑΠΕΠΑ – SEA MEN · ΓΗΠΕΔΟ 1', tone: 'orange' },
  { tag: 'ΕΠΟΜΕΝΟ', text: 'ΛΥΚΟΒΡΥΣΗ–ΠΕΥΚΗ · 19–20 ΣΕΠ', tone: 'blue' },
  { tag: 'ΔΗΛΩΣΕΙΣ', text: 'ΠΑΛΛΗΝΗ · ΑΝΟΙΧΤΕΣ ΕΩΣ 3 ΟΚΤ', tone: 'orange' },
  { tag: 'ΠΡΟΓΡΑΜΜΑ', text: 'ΠΕΥΚΗ · ΑΝΑΡΤΗΘΗΚΕ', tone: 'blue' },
  { tag: 'ΝΕΟ', text: 'ΤΟ APP ΤΗΣ GNC ΣΤΟ APP STORE & GOOGLE PLAY', tone: 'orange' },
  { tag: 'ΑΡΧΕΙΟ', text: 'ΠΑΛΛΗΝΗ 2026 · ΝΙΚΗΤΕΣ ΑΝΑ ΚΑΤΗΓΟΡΙΑ', tone: 'blue' },
]

export const sponsors = ['Χορηγός 1', 'Χορηγός 2', 'Δήμος Λυκόβρυσης–Πεύκης', 'Χορηγός 3', 'Χορηγός 4', 'Media partner', 'Χορηγός 5']

export const news: NewsItem[] = [
  { id: 'n1', slug: 'pefki-programma', tag: 'Πρόγραμμα', date: '16 Σεπ 2026', title: 'Αναρτήθηκε το πρόγραμμα της Πεύκης', excerpt: '52 ομάδες, 8 κατηγορίες, δύο γήπεδα. Δες πότε παίζει η ομάδα σου.', tint: 'orange' },
  { id: 'n2', slug: 'pallini-diloseis', tag: 'Δηλώσεις', date: '12 Σεπ 2026', title: 'Άνοιξαν οι δηλώσεις για την Παλλήνη', excerpt: 'Φθινοπωρινό τουρνουά 10–11 Οκτωβρίου στο Κλειστό Παλλήνης, 7 κατηγορίες.', tint: 'blue' },
  { id: 'n3', slug: 'app', tag: 'Νέο', date: '8 Σεπ 2026', title: 'Το app της GNC στο App Store και Google Play', excerpt: 'Πρόγραμμα, ειδοποιήσεις 15΄ πριν τον αγώνα σου, QR check-in.', tint: 'mono' },
  { id: 'n4', slug: 'pallini-2026-nikites', tag: 'Αποτελέσματα', date: '15 Ιουν 2026', title: 'Παλλήνη 2026: οι νικητές', excerpt: 'GOONLANDERS στους 18+, PINK ROSES στους 40+, ΘΥΜΙΟΛΑΣ στο U18, COURT KINGS στο U15.', tint: 'teal' },
]
export const rentals: RentalItem[] = [
  { id: 'r1', name: 'Φορητό γήπεδο 3on3', blurb: 'Δάπεδο, μπασκέτα, περίφραξη. Στήσιμο και αποξήλωση από την ομάδα μας.', price: 'Ζήτησε προσφορά' },
  { id: 'r2', name: 'Πακέτο διοργάνωσης', blurb: 'Γήπεδα, γραμματεία, scoreboard, ηχητικά, εκφωνητής. Για δήμους και εταιρείες.', price: 'Ζήτησε προσφορά' },
  { id: 'r3', name: 'Scoreboard & ηχητικά', blurb: 'Ηλεκτρονικός πίνακας, χρονόμετρο, ηχοσύστημα για εκδηλώσεις.', price: 'Ζήτησε προσφορά' },
  { id: 'r4', name: 'Μπασκέτες & μπάλες', blurb: 'Φορητές μπασκέτες και μπάλες Νο6 για σχολεία, camps, γιορτές.', price: 'Ζήτησε προσφορά' },
]

export const cities: City[] = [
  { id: 'thessaloniki', name: 'Θεσσαλονίκη', nameEn: 'Thessaloniki', lat: 40.6401, lng: 22.9444 },
  { id: 'komotini', name: 'Κομοτηνή', nameEn: 'Komotini', lat: 41.1224, lng: 25.4056 },
  { id: 'drama', name: 'Δράμα', nameEn: 'Drama', lat: 41.153, lng: 24.147 },
  { id: 'veroia', name: 'Βέροια', nameEn: 'Veria', lat: 40.524, lng: 22.202 },
  { id: 'larisa', name: 'Λάρισα', nameEn: 'Larissa', lat: 39.639, lng: 22.4191 },
  { id: 'kalampaka', name: 'Καλαμπάκα', nameEn: 'Kalampaka', lat: 39.705, lng: 21.627 },
  { id: 'karditsa', name: 'Καρδίτσα', nameEn: 'Karditsa', lat: 39.365, lng: 21.921 },
  { id: 'igoumenitsa', name: 'Ηγουμενίτσα', nameEn: 'Igoumenitsa', lat: 39.507, lng: 20.266 },
  { id: 'amfilochia', name: 'Αμφιλοχία', nameEn: 'Amfilochia', lat: 38.86, lng: 21.17 },
  { id: 'agrinio', name: 'Αγρίνιο', nameEn: 'Agrinio', lat: 38.621, lng: 21.407 },
  { id: 'patra', name: 'Πάτρα', nameEn: 'Patras', lat: 38.2466, lng: 21.7346 },
  { id: 'aigio', name: 'Αίγιο', nameEn: 'Aigio', lat: 38.25, lng: 22.081 },
  { id: 'xylokastro', name: 'Ξυλόκαστρο', nameEn: 'Xylokastro', lat: 38.078, lng: 22.63 },
  { id: 'pyrgos', name: 'Πύργος', nameEn: 'Pyrgos', lat: 37.675, lng: 21.441 },
  { id: 'amaliada', name: 'Αμαλιάδα', nameEn: 'Amaliada', lat: 37.8, lng: 21.35 },
  { id: 'korinthos', name: 'Κόρινθος', nameEn: 'Corinth', lat: 37.939, lng: 22.932 },
  { id: 'kalamata', name: 'Καλαμάτα', nameEn: 'Kalamata', lat: 37.0389, lng: 22.1142 },
  { id: 'gytheio', name: 'Γύθειο', nameEn: 'Gytheio', lat: 36.759, lng: 22.566 },
  { id: 'peiraias', name: 'Πειραιάς', nameEn: 'Piraeus', lat: 37.942, lng: 23.647 },
  { id: 'athina', name: 'Αθήνα', nameEn: 'Athens', lat: 37.9838, lng: 23.7275 },
  { id: 'pallini', name: 'Παλλήνη', nameEn: 'Pallini', lat: 38.005, lng: 23.885 },
  { id: 'rafina', name: 'Ραφήνα', nameEn: 'Rafina', lat: 38.02, lng: 24.01 },
  { id: 'mykonos', name: 'Μύκονος', nameEn: 'Mykonos', lat: 37.4467, lng: 25.3289 },
  { id: 'chania', name: 'Χανιά', nameEn: 'Chania', lat: 35.5138, lng: 24.018 },
  { id: 'irakleio', name: 'Ηράκλειο', nameEn: 'Heraklion', lat: 35.3387, lng: 25.1442 },
  { id: 'pefki', name: 'Λυκόβρυση–Πεύκη', nameEn: 'Lykovrysi–Pefki', lat: 38.062, lng: 23.796 },
]

export const mockBundle: Bundle = { categories, tournaments, teams, players, matches, groups, stops, archive, ticker: tickerItems, sponsors, news, rentals, cities }
