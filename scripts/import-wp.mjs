#!/usr/bin/env node
// Import the WordPress export (Εργαλεία → Εξαγωγή → Όλο το περιεχόμενο → .xml) of gnc3on3.gr into the GNC CMS.
//
//   node scripts/import-wp.mjs path/to/gnc3on3.WordPress.xml
//
// Produces:
//   supabase/import/news_from_wp.sql   — insert statements for public.news (run in the Supabase SQL editor)
//   supabase/import/wp-media.txt       — every media URL the posts use (fetch-wp-media.ps1 downloads them to public/img/wp/)
// Images in the articles are rewritten to /img/wp/<filename> so nothing on the new site depends on the old host.
// No dependencies: the WXR file is regular enough for a small hand parser.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const file = process.argv[2]
if (!file) { console.error('usage: node scripts/import-wp.mjs <export.xml>'); process.exit(1) }
const xml = readFileSync(file, 'utf8')

const unCdata = s => s.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, '$1')
const tag = (block, name) => { const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`)); return m ? unCdata(m[1].trim()) : '' }
const tags = (block, name) => [...block.matchAll(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'g'))].map(m => unCdata(m[1].trim()))
const entities = s => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#8217;|&rsquo;/g, '’').replace(/&#8216;|&lsquo;/g, '‘').replace(/&#8220;|&ldquo;/g, '“').replace(/&#8221;|&rdquo;/g, '”').replace(/&#8211;|&ndash;/g, '–').replace(/&#8212;|&mdash;/g, '—').replace(/&hellip;/g, '…').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
const sql = s => s == null || s === '' ? 'null' : `'${String(s).replace(/'/g, "''")}'`

const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => m[1])
const attachments = new Map()   // id → url
for (const it of items) if (tag(it, 'wp:post_type') === 'attachment') attachments.set(tag(it, 'wp:post_id'), tag(it, 'wp:attachment_url'))

const media = new Set()
const localName = url => { try { return decodeURIComponent(new URL(url).pathname.split('/').pop() || '') } catch { return url.split('/').pop() } }
const localise = url => {
  if (!url) return null
  if (/^data:/i.test(url)) return null                       // inline base64 images: dropped, not downloadable
  if (!/^https?:\/\//i.test(url)) return url                 // already a local path
  media.add(url)
  return '/img/wp/' + localName(url)
}

/** Good-enough WordPress HTML → Markdown (headings, paragraphs, lists, bold/italic, links, images). Gutenberg comments and layout tags are dropped. */
function toMarkdown(html) {
  let s = html.replace(/<!--[\s\S]*?-->/g, '')
  s = s.replace(/<figure[^>]*>([\s\S]*?)<\/figure>/gi, '$1').replace(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/gi, '\n*$1*\n')
  s = s.replace(/<img[^>]*src="([^"]+)"[^>]*>/gi, (_, src) => { const u = localise(src); return u ? `\n![](${u})\n` : '' })
  s = s.replace(/<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, n, t) => `\n${'#'.repeat(Math.max(2, +n))} ${t.replace(/<[^>]+>/g, '').trim()}\n`)
  s = s.replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, '**$2**').replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, '*$2*')
  s = s.replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, t) => `[${t.replace(/<[^>]+>/g, '').trim()}](${href})`)
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, t) => `- ${t.replace(/<[^>]+>/g, '').trim()}\n`).replace(/<\/?(ul|ol)[^>]*>/gi, '\n')
  s = s.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<p[^>]*>/gi, '')
  s = s.replace(/<[^>]+>/g, '')
  s = entities(s).split('\n').map(l => l.trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim()
  return s
}

const posts = items.filter(it => tag(it, 'wp:post_type') === 'post' && tag(it, 'wp:status') === 'publish')
const rows = posts.map(it => {
  const title = entities(tag(it, 'title'))
  const slug = decodeURIComponent(tag(it, 'wp:post_name')).slice(0, 120) || title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const date = tag(it, 'wp:post_date').slice(0, 10)
  const content = tag(it, 'content:encoded')
  const body = toMarkdown(content)
  const excerptRaw = entities(tag(it, 'excerpt:encoded').replace(/<[^>]+>/g, '')).trim()
  const firstPara = body.split('\n\n').find(p => p && !p.startsWith('#') && !p.startsWith('![')) ?? ''
  const excerpt = (excerptRaw || firstPara).replace(/\*\*/g, '').slice(0, 320)
  const thumbId = (it.match(/<wp:meta_key><!\[CDATA\[_thumbnail_id\]\]><\/wp:meta_key>\s*<wp:meta_value><!\[CDATA\[(\d+)\]\]>/) || [])[1]
  const thumb = thumbId && attachments.get(thumbId)
  const firstImg = (content.match(/<img[^>]*src="([^"]+)"/i) || [])[1]
  const image = localise(thumb || firstImg)
  const cats = tags(it, 'category').map(entities)
  const hay = (title + ' ' + cats.join(' ')).toLowerCase()
  const tagName =
      /αποτελ|απολογ|recap|ολοκληρ|νικητ|αποθέωση|έπεσε η αυλαία|κύπελλ/.test(hay) ? 'Αποτελέσματα'
    : /δηλώσ|συμμετοχ|εγγραφ|δήλωσε|registration/.test(hay) ? 'Δηλώσεις'
    : /πρόγραμμα|ωράρι|schedule|ομιλ|όμιλο|κλήρωση/.test(hay) ? 'Πρόγραμμα'
    : 'Νέα'
  return { slug, title, excerpt, body, tag: tagName, date, image, source: tag(it, 'link') }
})

mkdirSync(resolve('supabase/import'), { recursive: true })

const src = file.split(/[\\/]/).pop()
const INSERT = 'insert into public.news (slug,title,excerpt,body,tag,published_on,image_url,source_url) values'
const UPSERT = 'on conflict (slug) do update set title=excluded.title, excerpt=excluded.excerpt, body=excluded.body, tag=excluded.tag, published_on=excluded.published_on, image_url=coalesce(excluded.image_url, news.image_url), source_url=excluded.source_url;'
const values = r => `  (${sql(r.slug)},${sql(r.title)},${sql(r.excerpt)},${sql(r.body)},${sql(r.tag)},'${r.date}',${sql(r.image)},${sql(r.source)})`

// The Supabase SQL editor is a browser textarea — a 1 MB paste is painful, so the output is split into
// files of at most ~200 KB. Run them in order; each one is self-contained and can be re-run safely.
const MAX = 150 * 1024
const chunks = [[]]
let size = 0
for (const r of rows) {
  const line = values(r)
  if (size + line.length > MAX && chunks[chunks.length - 1].length) { chunks.push([]); size = 0 }
  chunks[chunks.length - 1].push(line)
  size += line.length + 2
}
const pad = n => String(n).padStart(2, '0')
const names = []
chunks.forEach((lines, i) => {
  const head = [`-- generated by scripts/import-wp.mjs from ${src} — part ${i + 1}/${chunks.length} (${lines.length} of ${rows.length} posts)`]
  if (i === 0) head.push(
    '-- first, drop any seeded copy of these articles that came in with migration 008 under a shortened slug',
    `delete from public.news where (source_url in (${rows.map(r => sql(r.source)).join(',')}) or title in (${rows.map(r => sql(r.title)).join(',')})) and slug not in (${rows.map(r => sql(r.slug)).join(',')});`)
  const name = `news_from_wp_${pad(i + 1)}.sql`
  writeFileSync(resolve('supabase/import/' + name), [...head, INSERT, lines.join(',\n'), UPSERT].join('\n') + '\n')
  names.push(name)
})
writeFileSync(resolve('supabase/import/wp-media.txt'), [...media].join('\n') + '\n')
// same rows as JSON, for scripts/push-news.mjs (the SQL editor rejects pastes this size)
writeFileSync(resolve('supabase/import/news.json'), JSON.stringify(rows.map(r => ({
  slug: r.slug, title: r.title, excerpt: r.excerpt || null, body: r.body || null,
  tag: r.tag, published_on: r.date, image_url: r.image, source_url: r.source || null,
})), null, 1))
console.log(`${rows.length} posts → supabase/import/news.json (για το push-news.mjs) + ${names.length} αρχεία SQL · ${media.size} media → supabase/import/wp-media.txt`)
