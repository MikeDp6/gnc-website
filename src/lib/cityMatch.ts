/**
 * Matching a WordPress article (or an old photo file) to one of the tour's cities.
 * Article slugs are Latin transliterations of Greek titles, so the city shows up in a handful of
 * spellings and cases; this is the list of them, kept in one place because the site and the import
 * script both need it.
 */
export const CITY_ALIASES: Record<string, string[]> = {
  patra: ['patra', 'patras', 'patron'],
  athina: ['athina', 'athinas', 'athens'],
  agrinio: ['agrinio', 'agriniou'],
  kavala: ['kavala', 'kavalas'],
  alexandroupoli: ['alexandroupoli', 'alexandroupolis'],
  igoumenitsa: ['igoumenitsa', 'igoumenitsas'],
  metamorfosi: ['metamorfosi', 'metamorfosis'],
  irakleio: ['irakleio', 'iraklio', 'irakleiou', 'irakliou', 'heraklion'],
  chania: ['chania', 'chanion', 'chanion'],
  ierapetra: ['ierapetra', 'ierapetras'],
  thessaloniki: ['thessaloniki', 'thessalonikis'],
  penteli: ['penteli', 'pentelis'],
  peiraias: ['peiraias', 'peiraia', 'piraeus'],
  paramythia: ['paramythia', 'paramythias'],
  pyrgos: ['pyrgos', 'pyrgou'],
  korinthos: ['korinthos', 'korintho', 'korinthou'],
  vonitsa: ['vonitsa', 'vonitsas'],
  skala: ['skala', 'skalas'],
  gastouni: ['gastouni', 'gastounis'],
  amfilochia: ['amfilochia', 'amfilohia', 'amfilochias'],
  kalampaka: ['kalampaka', 'kalabaka', 'kalampakas'],
  kourouta: ['kourouta', 'kouroyta', 'kouroutas'],
  moschato: ['moschato', 'moschatou'],
  aigio: ['aigio', 'aigiou'],
  akrata: ['akrata', 'akratas'],
  veroia: ['veroia', 'verias', 'veria'],
  drama: ['dramas', 'drama'],
  'dytiki-achaia': ['dytiki-achaia', 'dytikis-achaias', 'dyt-achaia', 'dytikis-achaia'],
  kalamata: ['kalamata', 'kalamatas'],
  karditsa: ['karditsa', 'karditsas'],
  komotini: ['komotini', 'komotinis'],
  larisa: ['larisa', 'larisas', 'larissa'],
  mykonos: ['mykonos', 'mykono', 'mykonou'],
  paiania: ['paiania', 'paianias'],
  perama: ['perama', 'peramatos'],
  rafina: ['rafina', 'rafinas'],
  rethymno: ['rethymno', 'rethymnou', 'rethumno'],
  'agios-nikolaos': ['agios-nikolaos', 'agiou-nikolaou', 'agiosnikolaos'],
  pefki: ['pefki', 'pefkis', 'lykovrysi', 'lykovrysis'],
  pallini: ['pallini', 'pallinis'],
}


/**
 * The Greek side: article titles are in Greek and the slug is cut short, so the title is often the
 * only place the city shows. Each entry is a stem without its ending, so it also catches the
 * genitive (Πάτρα / Πάτρας, Χανιά / Χανίων, Ηράκλειο / Ηρακλείου).
 */
export const CITY_STEMS_EL: Record<string, string[]> = {
  patra: ['πατρα'],
  athina: ['αθηνα', 'αθην'],
  agrinio: ['αγρινι'],
  kavala: ['καβαλα'],
  alexandroupoli: ['αλεξανδρουπολ'],
  igoumenitsa: ['ηγουμενιτσ'],
  metamorfosi: ['μεταμορφωσ'],
  irakleio: ['ηρακλει'],
  chania: ['χανι'],
  ierapetra: ['ιεραπετρ'],
  thessaloniki: ['θεσσαλονικ'],
  penteli: ['πεντελ'],
  peiraias: ['πειραι'],
  paramythia: ['παραμυθι'],
  pyrgos: ['πυργ'],
  korinthos: ['κορινθ'],
  vonitsa: ['βονιτσ'],
  skala: ['σκαλα λακων', 'σκαλα'],
  gastouni: ['γαστουν'],
  amfilochia: ['αμφιλοχι'],
  kalampaka: ['καλαμπακ'],
  kourouta: ['κουρουτ'],
  moschato: ['μοσχατ'],
  aigio: ['αιγι'],
  akrata: ['ακρατ'],
  veroia: ['βεροι'],
  drama: ['δραμα'],
  'dytiki-achaia': ['δυτικη αχαι', 'δυτικης αχαι'],
  kalamata: ['καλαματ'],
  karditsa: ['καρδιτσ'],
  komotini: ['κομοτην'],
  larisa: ['λαρισ'],
  mykonos: ['μυκον'],
  paiania: ['παιανι'],
  perama: ['περαμα'],
  rafina: ['ραφην'],
  rethymno: ['ρεθυμν'],
  'agios-nikolaos': ['αγιος νικολα', 'αγιου νικολα'],
  pefki: ['λυκοβρυσ', 'πευκ'],
  pallini: ['παλλην'],
}

/** lower case, accents stripped, everything that is not a letter or digit turned into a dash */
export function norm(s: string): string {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

/** The city an article belongs to, from its slug (and title as a fallback), or undefined. */
export function cityOf(text: string): string | undefined {
  const s = ` ${norm(text)} `
  let best: { id: string; len: number } | undefined
  const look = (table: Record<string, string[]>) => {
    for (const [id, aliases] of Object.entries(table)) {
      for (const a of aliases) {
        if (s.includes(a) && (!best || a.length > best.len)) best = { id, len: a.length }
      }
    }
  }
  look(CITY_ALIASES)
  look(CITY_STEMS_EL)
  return best?.id
}
