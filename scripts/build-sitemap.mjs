// Writes dist/sitemap.xml after the build. Reads the live tables through the public (anon) key,
// exactly like a visitor would; if Supabase is unreachable the static routes are still written,
// so a network hiccup can never fail a deploy.
import { writeFileSync, existsSync, mkdirSync } from 'node:fs'

const SITE = (process.env.VITE_SITE_URL || 'https://gnc3on3.gr').replace(/\/$/, '')
const URL_ = process.env.VITE_SUPABASE_URL
const KEY = process.env.VITE_SUPABASE_ANON_KEY

const STATIC = [
  ['/', 1.0, 'daily'],
  ['/archive', 0.9, 'weekly'],
  ['/news', 0.9, 'daily'],
  ['/rankings', 0.8, 'weekly'],
  ['/rentals', 0.7, 'monthly'],
  ['/sponsors', 0.6, 'monthly'],
  ['/register', 0.8, 'weekly'],
  ['/contact', 0.5, 'yearly'],
  ['/about', 0.5, 'yearly'],
  ['/kanonismoi', 0.5, 'yearly'],
  ['/volunteer', 0.5, 'yearly'],
  ['/oroi', 0.3, 'yearly'],
]

async function rows(table, select, order) {
  if (!URL_ || !KEY) return []
  const q = `${URL_}/rest/v1/${table}?select=${select}${order ? `&order=${order}` : ''}&limit=2000`
  try {
    const r = await fetch(q, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`)
    return await r.json()
  } catch (e) {
    console.warn(`sitemap: skipping ${table} (${e.message})`)
    return []
  }
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const day = d => (d ? new Date(d).toISOString().slice(0, 10) : undefined)

const [news, cities, tours] = await Promise.all([
  rows('news', 'slug,published_on', 'published_on.desc'),
  rows('cities', 'id'),
  rows('tournaments', 'slug,starts_on'),
])

const urls = [
  ...STATIC.map(([loc, pri, freq]) => ({ loc, pri, freq })),
  ...news.filter(n => n.slug).map(n => ({ loc: `/news/${n.slug}`, pri: 0.7, freq: 'monthly', last: day(n.published_on) })),
  ...cities.filter(c => c.id).map(c => ({ loc: `/cities/${c.id}`, pri: 0.7, freq: 'monthly' })),
  ...tours.filter(t => t.slug).map(t => ({ loc: `/tournaments/${t.slug}`, pri: 0.8, freq: 'weekly', last: day(t.starts_on) })),
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${esc(SITE + u.loc)}</loc>${u.last ? `<lastmod>${u.last}</lastmod>` : ''}<changefreq>${u.freq}</changefreq><priority>${u.pri}</priority></url>`).join('\n')}
</urlset>
`
if (!existsSync('dist')) mkdirSync('dist')
writeFileSync('dist/sitemap.xml', xml)
console.log(`sitemap: ${urls.length} urls -> dist/sitemap.xml`)
