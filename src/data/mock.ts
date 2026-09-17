// Mock data for development — Pefki 2026 registrations (real team names) + invented results.
// Replaced by the API layer (src/lib/api.ts) once the backend is wired.
import type { ArchiveItem, Bundle, Category, City, Group, Match, NewsItem, Player, RentalItem, SeasonEvent, Sponsor, Stop, Team, TickerItem, Tournament } from './types'

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
    categoryIds: categories.map(c => c.id), cover: '/img/gnc/gnc3on3_patra2-min.jpg',
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

export const sponsors = ['LOUX', 'Σκέντζος', 'Kerasidis Group', 'Affidea', 'Wilson', 'My Way Hotel', 'Crossover', 'Vlastaras', 'SBIE', 'Yayaz', 'Theocar', 'Stegno', 'Account Saints']

// Latest articles from gnc3on3.gr (images downloaded by scripts/fetch-assets.ps1)
export const news: NewsItem[] = [
  { id: 'n1', slug: 'apotheosi-tou-basket-sto-my-way-gnc-3on3-tis-patras-mia-mega', tag: 'Αποτελέσματα', date: '7 Σεπ 2026', title: 'Αποθέωση του μπάσκετ στο MY WAY GNC 3on3 της Πάτρας – Μια μεγάλη γιορτή αθλητισμού με ρυθμό και θέαμα προς τιμήν του Κώστα Πετρόπουλου!', excerpt: 'Το MY WAY GNC 3on3 στην Πάτρα (4-6 Σεπτεμβρίου) εξελίχθηκε σε κορυφαίο γεγονός streetball με περισσότερες από 180 ομάδες και συναυλία των Alcatrash. Η διοργάνωση, αφιερωμένη στη μνήμη του Κώστα Πετρόπουλου, χαρακτηρίστηκε «πραγματική γιορτή του αθλητισμού» με εκατοντάδες συμμετέχοντες.', tint: 'orange', image: '/img/gnc/gnc-patra-1-scaled.jpg', source: 'https://gnc3on3.gr/apotheosi-tou-basket-sto-my-way-gnc-3on3-tis-patras-mia-megali-giorti-athlitismou-me-rythmo-kai-theama-pros-timin-tou-kosta-petropoulou/' },
  { id: 'n2', slug: 'me-apolyti-epitychia-oloklirothike-to-gnc-3on3-vonitsa-2026-', tag: 'Αποτελέσματα', date: '30 Αυγ 2026', title: 'Με απόλυτη επιτυχία ολοκληρώθηκε το GNC 3on3 | ΒΟΝΙΤΣΑ 2026: Μια αξέχαστη καλοκαιρινή γιορτή του μπάσκετ!', excerpt: 'Το GNC 3on3 ΒΟΝΙΤΣΑ 2026 πραγματοποιήθηκε στις 20 και 21 Αυγούστου, μετατρέποντας την παραλία σε καλοκαιρινό αθλητικό ραντεβού με εκατοντάδες αθλητές όλων των ηλικιών και δωρεάν συμμετοχή για όλες τις ομάδες. Η εκδήλωση στέφθηκε με απόλυτη οργανωτική και αγωνιστική επιτυχία χάρη στη συμβολή της Περιφέρειας Δυτικής Ελλάδας, του Δήμου Ακτίου-Βόνιτσας και του Αθλητικού Ομίλου Βόνιτσας.', tint: 'blue', image: '/img/gnc/gnc-vonitsa-apologistiko-scaled.jpg', source: 'https://gnc3on3.gr/me-apolyti-epitychia-oloklirothike-to-gnc-3on3-vonitsa-2026-mia-axechasti-kalokairini-giorti-tou-basket/' },
  { id: 'n3', slug: 'megalo-tournoua-basket-3x3-me-dorean-symmetochi-ston-dimo-ly', tag: 'Δηλώσεις', date: '29 Αυγ 2026', title: 'Μεγάλο Τουρνουά Μπάσκετ 3×3 με Δωρεάν Συμμετοχή στον Δήμο Λυκόβρυσης – Πεύκης (19-20 Σεπτεμβρίου 2026)', excerpt: 'Ο Δήμος Λυκόβρυσης – Πεύκης διοργανώνει δωρεάν τουρνουά μπάσκετ 3x3 στις 19-20 Σεπτεμβρίου 2026 στο 1ο Γενικό Λύκειο Πεύκης, σε συνεργασία με την Περιφέρεια Αττικής και το GNC 3on3. Η διοργάνωση είναι ανοιχτή σε όλες τις ηλικίες και επίπεδα, με εγγραφή μέσω ηλεκτρονικής φόρμας.', tint: 'mono', image: '/img/gnc/gnc-pefki-3x3-1-scaled.jpg', source: 'https://gnc3on3.gr/megalo-tournoua-basket-3x3-me-dorean-symmetochi-ston-dimo-lykovrysis-pefkis-19-20-septemvriou-2026/' },
  { id: 'n4', slug: 'basket-chamogela-mousiki-kai-lampsi-pagkosmiou-sto-gnc-3on3-', tag: 'Αποτελέσματα', date: '11 Αυγ 2026', title: 'Μπάσκετ, χαμόγελα, μουσική και λάμψη… παγκοσμίου στο GNC 3on3 της Σκάλας!', excerpt: 'Το GNC 3on3 της Σκάλας ολοκληρώθηκε με επιτυχία, με πολλές ομάδες και μια εντυπωσιακή ατμόσφαιρα γεμάτη μπάσκετ και μουσική. Τιμήθηκε ο 18χρονος Δημήτρης Πούλος από τη Σκάλα, πλέον αθλητής του Προμηθέα, για την κατάκτηση του παγκόσμιου σχολικού πρωταθλήματος τον Ιούνιο στη Σερβία.', tint: 'teal', image: '/img/gnc/gnc-3on3-skala-post-scaled.jpg', source: 'https://gnc3on3.gr/basket-chamogela-mousiki-kai-lampsi-pagkosmiou-sto-gnc-3on3-tis-skalas/' },
]
// Rent equipment — as listed on gnc3on3.gr/enoikiaseis
export const rentals: RentalItem[] = [
  { id: 'r1', name: 'Γήπεδο ENLIO SES Elite', blurb: 'Δάπεδο μπάσκετ 3×3 ENLIO — το επίσημο δάπεδο των Ολυμπιακών Αγώνων. FIBA approved courts, στήσιμο και αποξήλωση από την ομάδα μας.', price: 'Ζήτησε προσφορά', image: '/img/gnc/0071.jpg' },
  { id: 'r2', name: 'Μπασκέτα Schelde SAM 3×3', blurb: 'Η μπασκέτα των Ολυμπιακών Αγώνων και των παγκόσμιων πρωταθλημάτων 3×3.', price: 'Ζήτησε προσφορά', image: '/img/gnc/SCHELDE-240x300.png' },
  { id: 'r3', name: 'Μπασκέτα Artisport Black 17', blurb: 'Υδραυλικού τύπου, πιστοποιημένη FIBA approved για 3×3.', price: 'Ζήτησε προσφορά', image: '/img/gnc/black-17.jpg' },
  { id: 'r4', name: 'Κινητή μπασκέτα ολυμπιακού τύπου', blurb: 'Για γήπεδα 5×5 και εκδηλώσεις σε ανοιχτούς χώρους.', price: 'Ζήτησε προσφορά', image: '/img/gnc/basketball-olympic.png' },
  { id: 'r5', name: 'Video wall 12 m²', blurb: 'Waterproof οθόνη LED 4×3 μ. (pitch 3.8) για σκορ, replays και χορηγούς.', price: 'Ζήτησε προσφορά', image: '/img/gnc/ΟΘΟΝΗ-768x513.jpg' },
  { id: 'r6', name: 'Διαφημιστικές πινακίδες LED 20 μ.', blurb: 'Περιμετρικές LED πινακίδες 20 μέτρων για χορηγούς γύρω από το γήπεδο.', price: 'Ζήτησε προσφορά', image: '/img/gnc/010-768x512.jpg' },
]

export const cities: City[] = [
  { id: 'patra', name: 'Πάτρα', nameEn: 'Patras', lat: 38.2466, lng: 21.7346, image: '/img/gnc/gnc3on3_patra2-min.jpg', years: [2025, 2024, 2023], videos: [{"kind": "instagram", "id": "DFkIbCnMlLx"}, {"kind": "instagram", "id": "C_qkaYgMoeG"}, {"kind": "instagram", "id": "C_vsAbpMd7D"}, {"kind": "instagram", "id": "C_qu6cGsgw_"}, {"kind": "instagram", "id": "C_0SuqcugtB"}, {"kind": "instagram", "id": "C_n7em0MMYZ"}, {"kind": "youtube", "id": "vMBvhlDaIOE"}, {"kind": "instagram", "id": "CwsbKKnsWDq"}] },
  { id: 'athina', name: 'Αθήνα', nameEn: 'Athens', lat: 37.9838, lng: 23.7275, image: '/img/gnc/IMG_6714.jpg' },
  { id: 'agrinio', name: 'Αγρίνιο', nameEn: 'Agrinio', lat: 38.621, lng: 21.407, image: '/img/gnc/gnc3on3_agrinio-min.png', years: [2024, 2023], videos: [{"kind": "instagram", "id": "C7ZYWoMs629"}, {"kind": "instagram", "id": "C7YWW7_MgWr"}, {"kind": "instagram", "id": "C7eyDURMUCC"}, {"kind": "youtube", "id": "98WRdRds2Bg"}, {"kind": "instagram", "id": "CtmlgBPMEHE"}] },
  { id: 'kavala', name: 'Καβάλα', nameEn: 'Kavala', lat: 40.9397, lng: 24.4019, image: '/img/gnc/gnc3on3_kavala-min.jpg' },
  { id: 'alexandroupoli', name: 'Αλεξανδρούπολη', nameEn: 'Alexandroupoli', lat: 40.8457, lng: 25.874 },
  { id: 'igoumenitsa', name: 'Ηγουμενίτσα', nameEn: 'Igoumenitsa', lat: 39.507, lng: 20.266, years: [2024], videos: [{"kind": "instagram", "id": "C70yjQgMaIc"}] },
  { id: 'metamorfosi', name: 'Μεταμόρφωση', nameEn: 'Metamorfosi', lat: 38.065, lng: 23.76 },
  { id: 'irakleio', name: 'Ηράκλειο', nameEn: 'Heraklion', lat: 35.3387, lng: 25.1442, image: '/img/gnc/gnc3on3_irakleio-min.jpg', years: [2024, 2023], videos: [{"kind": "instagram", "id": "C7y-wW0sZ_U"}, {"kind": "instagram", "id": "C79mhZ_MDJ7"}, {"kind": "instagram", "id": "C7_leMZMxIR"}, {"kind": "instagram", "id": "C8ACH-hMAHZ"}, {"kind": "instagram", "id": "C8AYy3hMu7b"}, {"kind": "instagram", "id": "C8Ahp1dNl0F"}, {"kind": "instagram", "id": "C8CpzJeMJKE"}, {"kind": "instagram", "id": "C7-BZbmM1a2"}, {"kind": "youtube", "id": "WnSf1bIJUyE"}, {"kind": "instagram", "id": "CuXAELAgT0a"}, {"kind": "instagram", "id": "CuZ4Gh-LW1c"}] },
  { id: 'chania', name: 'Χανιά', nameEn: 'Chania', lat: 35.5138, lng: 24.018, image: '/img/gnc/gnc3on3_chania-min.jpg', years: [2024], videos: [{"kind": "instagram", "id": "C8M8Ljrgo78"}] },
  { id: 'ierapetra', name: 'Ιεράπετρα', nameEn: 'Ierapetra', lat: 35.01, lng: 25.742 },
  { id: 'thessaloniki', name: 'Θεσσαλονίκη', nameEn: 'Thessaloniki', lat: 40.6401, lng: 22.9444, image: '/img/gnc/gnc3on3_thessaloniki-min.jpg' },
  { id: 'penteli', name: 'Πεντέλη', nameEn: 'Penteli', lat: 38.05, lng: 23.86 },
  { id: 'peiraias', name: 'Πειραιάς', nameEn: 'Piraeus', lat: 37.942, lng: 23.647 },
  { id: 'paramythia', name: 'Παραμυθιά', nameEn: 'Paramythia', lat: 39.47, lng: 20.51 },
  { id: 'pyrgos', name: 'Πύργος', nameEn: 'Pyrgos', lat: 37.675, lng: 21.441, years: [2024, 2023], videos: [{"kind": "instagram", "id": "C9nQW7wsnbK"}, {"kind": "instagram", "id": "C9zMP1nMUjv"}, {"kind": "youtube", "id": "4yQ0lbJHM-U"}, {"kind": "instagram", "id": "CvP8XRfNDMA"}] },
  { id: 'korinthos', name: 'Κόρινθος', nameEn: 'Corinth', lat: 37.939, lng: 22.932, years: [2024], videos: [{"kind": "instagram", "id": "C9BG3pet08R"}, {"kind": "instagram", "id": "C9FxmEbMr_q"}, {"kind": "instagram", "id": "C9M_aQXMKyZ"}, {"kind": "instagram", "id": "C9FAbspMwAF"}] },
  { id: 'vonitsa', name: 'Βόνιτσα', nameEn: 'Vonitsa', lat: 38.92, lng: 20.885, image: '/img/gnc/gnc-vonitsa-apologistiko-scaled.jpg' },
  { id: 'skala', name: 'Σκάλα Λακωνίας', nameEn: 'Skala', lat: 36.85, lng: 22.665, image: '/img/gnc/gnc-3on3-skala-post-scaled.jpg', years: [2024], videos: [{"kind": "instagram", "id": "C-rufldMY8Y"}] },
  { id: 'gastouni', name: 'Γαστούνη', nameEn: 'Gastouni', lat: 37.85, lng: 21.26, years: [2024], videos: [{"kind": "instagram", "id": "C-YX8W8MjLS"}, {"kind": "instagram", "id": "C-fAAeeML6m"}] },
  { id: 'amfilochia', name: 'Αμφιλοχία', nameEn: 'Amfilochia', lat: 38.86, lng: 21.17, years: [2024], videos: [{"kind": "instagram", "id": "C_559pmMamj"}, {"kind": "instagram", "id": "DAAwxfzsgzK"}] },
  { id: 'kalampaka', name: 'Καλαμπάκα', nameEn: 'Kalampaka', lat: 39.705, lng: 21.627, years: [2024], videos: [{"kind": "instagram", "id": "C_LAjmyMKsh"}] },
  { id: 'kourouta', name: 'Κουρούτα', nameEn: 'Kourouta', lat: 37.82, lng: 21.3, years: [2024, 2023], videos: [{"kind": "instagram", "id": "C-LHiSjMlbj"}, {"kind": "instagram", "id": "C-LZX_asaCi"}, {"kind": "instagram", "id": "C-TLr7KM6NB"}, {"kind": "youtube", "id": "VHZd32aumWQ"}, {"kind": "instagram", "id": "CvkkVbesBhr"}] },
  { id: 'moschato', name: 'Μοσχάτο', nameEn: 'Moschato', lat: 37.955, lng: 23.68 },
  { id: 'aigio', name: 'Αίγιο', nameEn: 'Aigio', lat: 38.25, lng: 22.081, image: '/img/gnc/gnc3on3_aigio-1-min.jpg', years: [2023], videos: [{"kind": "youtube", "id": "gc3YnsfcNN8"}, {"kind": "instagram", "id": "CwdT9BGMfih"}] },
  { id: 'akrata', name: 'Ακράτα', nameEn: 'Akrata', lat: 38.15, lng: 22.32, years: [2024], videos: [{"kind": "instagram", "id": "C9VHOn9M-dr"}, {"kind": "instagram", "id": "C9fBcbuMhhj"}] },
  { id: 'veroia', name: 'Βέροια', nameEn: 'Veria', lat: 40.524, lng: 22.202, years: [2023], videos: [{"kind": "youtube", "id": "wrWhDfYoxAo"}] },
  { id: 'drama', name: 'Δράμα', nameEn: 'Drama', lat: 41.153, lng: 24.147, years: [2023], videos: [{"kind": "youtube", "id": "-NCoGmzEvQ0"}] },
  { id: 'dytiki-achaia', name: 'Δυτική Αχαΐα', nameEn: 'West Achaia', lat: 38.15, lng: 21.55, years: [2024], videos: [{"kind": "instagram", "id": "C6T1VLxMpUB"}] },
  { id: 'kalamata', name: 'Καλαμάτα', nameEn: 'Kalamata', lat: 37.0389, lng: 22.1142, years: [2024, 2023], videos: [{"kind": "instagram", "id": "DAY04h4Meqh"}, {"kind": "instagram", "id": "DAg1HlBNaaw"}, {"kind": "youtube", "id": "MBIpokc17W4"}, {"kind": "instagram", "id": "CxQwJdAsAJi"}] },
  { id: 'karditsa', name: 'Καρδίτσα', nameEn: 'Karditsa', lat: 39.365, lng: 21.921, years: [2024], videos: [{"kind": "instagram", "id": "C-99K22MXer"}, {"kind": "instagram", "id": "C_aeo0tsQjv"}, {"kind": "instagram", "id": "C_LeIu2MTrs"}] },
  { id: 'komotini', name: 'Κομοτηνή', nameEn: 'Komotini', lat: 41.1224, lng: 25.4056, image: '/img/gnc/gnc3on3_komotini-1-min.jpg', years: [2023], videos: [{"kind": "youtube", "id": "VOcC1Ix2zQw"}, {"kind": "instagram", "id": "Ct02EOGMmi3"}] },
  { id: 'larisa', name: 'Λάρισα', nameEn: 'Larissa', lat: 39.639, lng: 22.4191, years: [2024], videos: [{"kind": "instagram", "id": "C61Qx3KMp7K"}, {"kind": "instagram", "id": "C6s0M69MAFL"}, {"kind": "instagram", "id": "C_F7FXdMWHC"}] },
  { id: 'mykonos', name: 'Μύκονος', nameEn: 'Mykonos', lat: 37.4467, lng: 25.3289, years: [2023], videos: [{"kind": "youtube", "id": "JWqlrnnOPbs"}, {"kind": "instagram", "id": "Cx3F4ussjTt"}, {"kind": "instagram", "id": "Cx3Sq8sMWur"}] },
  { id: 'paiania', name: 'Παιανία', nameEn: 'Paiania', lat: 37.955, lng: 23.855, years: [2024], videos: [{"kind": "instagram", "id": "C8ZrjU5sBEj"}, {"kind": "instagram", "id": "C8kK5pxspze"}] },
  { id: 'perama', name: 'Πέραμα', nameEn: 'Perama', lat: 37.965, lng: 23.57, years: [2024], videos: [{"kind": "instagram", "id": "C8UCTnGNoKq"}] },
  { id: 'rafina', name: 'Ραφήνα', nameEn: 'Rafina', lat: 38.02, lng: 24.01, image: '/img/gnc/gnc3on3_rafina-min.png', years: [2023], videos: [{"kind": "youtube", "id": "EA5vlAm5Lpw"}, {"kind": "instagram", "id": "CwU73UaO0r9"}] },
  { id: 'rethymno', name: 'Ρέθυμνο', nameEn: 'Rethymno', lat: 35.364, lng: 24.482, image: '/img/gnc/gnc3on3_rethymno-min.png' },
  { id: 'agios-nikolaos', name: 'Άγιος Νικόλαος', nameEn: 'Agios Nikolaos', lat: 35.19, lng: 25.715, image: '/img/gnc/gnc3on3_agiosnikolaos-min.jpg' },
  { id: 'pefki', name: 'Λυκόβρυση–Πεύκη', nameEn: 'Lykovrysi–Pefki', lat: 38.062, lng: 23.796, image: '/img/gnc/gnc-pefki-3x3-1-scaled.jpg' },
  { id: 'pallini', name: 'Παλλήνη', nameEn: 'Pallini', lat: 38.005, lng: 23.885 },
]

export const season2026: SeasonEvent[] = [
  { id: 's26-1', cityId: 'patra', city: 'Πάτρα', dates: '25/01 - 26/01', venue: 'Πλ. Γεωργίου', month: 'Ιαν', done: true },
  { id: 's26-2', cityId: 'patra', city: 'Πάτρα', dates: '19/03 - 20/03', venue: 'Πανεπιστήμιο Πατρών', month: 'Μαρ', done: true },
  { id: 's26-3', cityId: 'athina', city: 'Αθήνα', dates: '12/04 - 13/04', venue: 'Πλ. Κοτζιά', month: 'Απρ', done: true },
  { id: 's26-4', cityId: 'agrinio', city: 'Αγρίνιο', dates: '25/04 - 26/04', venue: 'Πλ. Δημοκρατίας', month: 'Απρ', done: true },
  { id: 's26-5', cityId: 'kavala', city: 'Καβάλα', dates: '10/05 - 11/05', venue: 'Πλατεία Ηρωών', month: 'Μάι', done: true },
  { id: 's26-6', cityId: 'alexandroupoli', city: 'Αλεξανδρούπολη', dates: '13/05 - 14/05', venue: 'ALEXPO', month: 'Μάι', done: true },
  { id: 's26-7', cityId: 'igoumenitsa', city: 'Ηγουμενίτσα', dates: '31/05 - 01/06', venue: 'Πλατεία Δημαρχείου', month: 'Ιουν', done: true },
  { id: 's26-8', cityId: 'metamorfosi', city: 'Μεταμόρφωση', dates: '07/06 - 08/06', venue: 'Πλατεία Δημαρχείου', month: 'Ιουν', done: true },
  { id: 's26-9', cityId: 'irakleio', city: 'Ηράκλειο', dates: '13/06 - 14/06 - 15/06', venue: 'Ενετικό Λιμάνι', month: 'Ιουν', done: true },
  { id: 's26-10', cityId: 'chania', city: 'Χανιά', dates: '18/06 - 19/06', venue: 'Εγκαταστάσεις Ο.Α.Χ.', month: 'Ιουν', done: true },
  { id: 's26-11', cityId: 'ierapetra', city: 'Ιεράπετρα', dates: '21/06 - 22/06', venue: 'Παραλιακή Πλατεία', month: 'Ιουν', done: true },
  { id: 's26-12', cityId: 'thessaloniki', city: 'Θεσσαλονίκη', dates: '27/06', venue: 'Πλατεία Αριστοτέλους', month: 'Ιουν', done: true, label: 'ΘΕΣΣΑΛΟΝΙΚΗ – UNDER ARMOUR 3x3' },
  { id: 's26-13', cityId: 'penteli', city: 'Πεντέλη', dates: '28/06 - 29/06', venue: 'Πλατεία Ηρώων Πολυτεχνείου', month: 'Ιουν', done: true },
  { id: 's26-14', cityId: 'patra', city: 'Πάτρα', dates: '01/07', venue: 'Μώλος Αγίου Νικολάου', month: 'Ιουλ', done: true },
  { id: 's26-15', cityId: 'peiraias', city: 'Πειραιάς', dates: '11/07', venue: 'Δημοτικό Θέατρο', month: 'Ιουλ', done: true, label: 'ΠΕΙΡΑΙΑΣ - UNDER ARMOYR 3x3' },
  { id: 's26-16', cityId: 'paramythia', city: 'Παραμυθιά', dates: '12/07 - 13/07', venue: 'Σχολείο Βούλγαρη', month: 'Ιουλ', done: true },
  { id: 's26-17', cityId: 'pyrgos', city: 'Πύργος', dates: '18-19-20/07', venue: 'κεντρική Πλατεία', month: 'Ιουλ', done: true },
  { id: 's26-18', cityId: 'korinthos', city: 'Κόρινθος', dates: '25-26-27/07', venue: 'Πλατεία Ηρώων Πολυτεχνείου', month: 'Ιουλ', done: true },
  { id: 's26-19', cityId: 'vonitsa', city: 'Βόνιτσα', dates: '30/07 - 31/07', venue: 'Παραλία Βόνιτσας', month: 'Ιουλ', done: true },
  { id: 's26-20', cityId: 'skala', city: 'Σκάλα Λακωνίας', dates: '02/08 - 03/08', venue: 'Σχολικό Συγκρότημα Σκάλας', month: 'Αυγ', done: true },
  { id: 's26-21', cityId: 'gastouni', city: 'Γαστούνη', dates: '08-09-20/08', venue: 'Κεντρική Πλατεία', month: 'Αυγ', done: true },
  { id: 's26-22', cityId: 'amfilochia', city: 'Αμφιλοχία', dates: '09 - 10/08', venue: 'Πλατεία Αμφιλοχίας', month: 'Αυγ', done: true },
  { id: 's26-23', cityId: 'kalampaka', city: 'Καλαμπάκα', dates: '23/08 - 24/08', venue: 'Πλατεία Ρήγα Φεραίου', month: 'Αυγ', done: true },
  { id: 's26-24', cityId: 'kourouta', city: 'Κουρούτα', dates: '26/08 - 27/08', venue: 'Πλατεία Κουρούτας', month: 'Αυγ', done: true },
  { id: 's26-25', cityId: 'patra', city: 'Πάτρα', dates: '29-30-31/08', venue: 'Πλατεία Γεωργίου', month: 'Αυγ', done: true, label: 'Πατρα Κωστας Πετροπουλος' },
  { id: 's26-26', cityId: 'moschato', city: 'Μοσχάτο', dates: '20/09 - 21/09', venue: 'Πλατεία Ηρώων Πολυτεχνείου', month: 'Σεπ', done: false },
]

// Sponsors as listed on gnc3on3.gr (logos: public/img/gnc/sponsors/<slug>.png when available)
export const sponsorList: Sponsor[] = [
  { name: 'LOUX', url: 'https://www.loux.gr/', tier: 'main', logo: '/img/gnc/sponsors/loux.png' }, { name: 'Σκέντζος', url: 'https://www.skentzos.com/', tier: 'partner', logo: '/img/gnc/sponsors/skentzos.png' }, { name: 'Kerasidis Group', url: 'https://kerasidisgroup.gr/', tier: 'partner', logo: '/img/gnc/sponsors/kerasidis-group.png' },
  { name: 'Affidea', url: 'https://affidea.gr/', tier: 'official', logo: '/img/gnc/sponsors/affidea.png' }, { name: 'Wilson', url: 'https://www.wilson.com/en-us/basketball', tier: 'official', logo: '/img/gnc/sponsors/wilson.png' }, { name: 'My Way Hotel', url: 'https://www.mywayhotel.gr/', tier: 'official', logo: '/img/gnc/sponsors/my-way-hotel.png' },
  { name: 'Crossover', url: 'https://crossoverbrand.com/el', tier: 'partner', logo: '/img/gnc/sponsors/crossover.png' }, { name: 'Vlastaras', url: 'https://www.vlastarasate.gr/', tier: 'partner', logo: '/img/gnc/sponsors/vlastaras.png' }, { name: 'SBIE', url: 'https://sbie.edu.gr/', tier: 'partner', logo: '/img/gnc/sponsors/sbie.png' },
  { name: 'Yayaz', url: 'https://www.instagram.com/yayaz_the_place_to_be', tier: 'partner', logo: '/img/gnc/sponsors/yayaz.png' }, { name: 'Theocar', url: 'https://theocar.com/en/', tier: 'partner', logo: '/img/gnc/sponsors/theocar.png' }, { name: 'Stegno', url: 'https://www.stegno.net', tier: 'partner', logo: '/img/gnc/sponsors/stegno.png' },
  { name: 'Account Saints', url: 'https://www.accountsaints.gr/', tier: 'partner', logo: '/img/gnc/sponsors/account-saints.png' },
  { name: 'Go Alexandroupolis', url: 'https://goalexandroupolis.com', tier: 'partner', logo: '/img/gnc/sponsors/go-alexandroupolis.png' },
]

/** Offline fallback counters — everything counted from the data we actually have, nothing invented. */
export const stats = { cities: cities.length, tournaments: season2026.length, teams: teams.length, players: players.length, matches: matches.filter(m => m.status === 'final').length, sinceYear: 2018 }

export const mockBundle: Bundle = { categories, tournaments, teams, players, matches, groups, stops, archive, ticker: tickerItems, sponsors, news, rentals, cities, season: season2026, sponsorList, stats, photos: [] }
