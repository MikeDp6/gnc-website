/**
 * Builds supabase/import/photos_from_wp.sql from the WordPress export: every photo an article used
 * (its cover and the ones inside the text), tied to the city that article is about.
 *
 *   node scripts/seed-photos.mjs
 *
 * Posters, schedules, sponsor strips and Instagram graphics are left out by name; a few slip
 * through, and those are quicker to delete in the admin than to upload by hand.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const news = JSON.parse(readFileSync(resolve(root, 'supabase/import/news.json'), 'utf8'))

// the alias lists live with the site code; read them out of the TypeScript source so there is one copy
const src = readFileSync(resolve(root, 'src/lib/cityMatch.ts'), 'utf8')
const cut = (from, to) => src.slice(src.indexOf(from), src.indexOf(to))
const ALIASES = {}
for (const block of [cut('CITY_ALIASES', 'CITY_STEMS_EL'), cut('CITY_STEMS_EL: Record', '/** lower case')]) {
  for (const m of block.matchAll(/'?([a-z-]+)'?\s*:\s*\[([^\]]+)\]/g)) {
    ALIASES[m[1]] = [...(ALIASES[m[1]] ?? []), ...[...m[2].matchAll(/'([^']+)'/g)].map(x => x[1])]
  }
}

const norm = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/\u03c2/g, '\u03c3').replace(/[^a-z0-9\u0370-\u03ff]+/g, ' ').trim()
const cityOf = text => {
  const s = ` ${norm(text)} `
  let best
  for (const [id, aliases] of Object.entries(ALIASES)) {
    for (const a of aliases) if (s.includes(a) && (!best || a.length > best.len)) best = { id, len: a.length }
  }
  return best?.id
}

const SKIP = /poster|schedule|banner|sponsor|instagram|frame|giveaway|logo|afisa|teams_|form|market|cropped|screenshot|stigmiotypo|1x1|tour-2026|tour_2026|calendar/i
const rows = []
const seen = new Set()

for (const a of news) {
  const city = cityOf(`${a.slug} ${a.title}`)
  if (!city) continue
  const urls = [a.image_url, ...[...(a.body || '').matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)].map(m => m[1])]
  for (const u of urls) {
    if (!u || !u.startsWith('/img/')) continue
    const file = decodeURIComponent(u.split('/').pop())
    if (SKIP.test(file)) continue
    if (!existsSync(resolve(root, 'public', u.replace(/^\//, '')))) continue
    const key = `${city}|${u}`
    if (seen.has(key)) continue
    seen.add(key)
    rows.push({ city, url: u, caption: a.title.slice(0, 180) })
  }
}

const q = s => `'${String(s).replace(/'/g, "''")}'`
const sql = `-- Photo gallery seeded from the WordPress export: ${rows.length} photos across ${new Set(rows.map(r => r.city)).size} cities.
-- Safe to run twice: a photo already stored for that city is skipped.
insert into public.photos (city_id, url, caption, sort_order)
select v.city_id, v.url, v.caption, v.sort_order
from (values
${rows.map((r, i) => `  (${q(r.city)}, ${q(r.url)}, ${q(r.caption)}, ${i})`).join(',\n')}
) as v(city_id, url, caption, sort_order)
where not exists (select 1 from public.photos p where p.city_id = v.city_id and p.url = v.url);
`
writeFileSync(resolve(root, 'supabase/import/photos_from_wp.sql'), sql)
const per = {}
for (const r of rows) per[r.city] = (per[r.city] || 0) + 1
console.log(`${rows.length} photos -> supabase/import/photos_from_wp.sql`)
console.log(Object.entries(per).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c}:${n}`).join('  '))
