/**
 * Social-card renderer. Facebook, Viber, WhatsApp, Twitter and friends do not run JavaScript,
 * so they would all see the site's default card no matter which page was shared. vercel.json
 * sends only those crawlers here (a normal visitor never touches this file) and this returns a
 * bare page carrying the right title, description and image for the article, tournament or city.
 */
const SITE = (process.env.VITE_SITE_URL || 'https://gnc3on3.gr').replace(/\/$/, '')
const DB = process.env.VITE_SUPABASE_URL
const KEY = process.env.VITE_SUPABASE_ANON_KEY

const MONTHS = ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου']
const dateRange = (a, b) => {
  if (!a) return ''
  const s = new Date(a), e = new Date(b || a)
  const m = MONTHS[e.getMonth()]
  return s.getTime() === e.getTime() || s.getMonth() !== e.getMonth()
    ? `${s.getDate()} ${MONTHS[s.getMonth()]}${s.getTime() === e.getTime() ? '' : ` – ${e.getDate()} ${m}`} ${e.getFullYear()}`
    : `${s.getDate()}–${e.getDate()} ${m} ${e.getFullYear()}`
}

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const abs = u => (!u ? `${SITE}/og.jpg` : /^https?:/.test(u) ? u : SITE + (u.startsWith('/') ? u : `/${u}`))

async function one(table, filter, select) {
  if (!DB || !KEY) return null
  const r = await fetch(`${DB}/rest/v1/${table}?${filter}&select=${select}&limit=1`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  })
  if (!r.ok) return null
  const rows = await r.json()
  return rows[0] ?? null
}

export default async function handler(req, res) {
  const { type = '', slug = '', t: regSlug = '' } = req.query ?? {}
  let url = `${SITE}/${type}/${slug}`
  let title = 'GNC 3on3 — Τουρνουά 3on3 σε όλη την Ελλάδα'
  let desc = 'Πρόγραμμα, όμιλοι, νοκ-άουτ, δηλώσεις συμμετοχής και αρχείο διοργανώσεων σε όλη την Ελλάδα.'
  let image = `${SITE}/og.jpg`
  let kind = 'website'

  try {
    if (type === 'news') {
      const n = await one('news', `slug=eq.${encodeURIComponent(slug)}`, 'title,excerpt,image_url')
      if (n) { title = `${n.title} — GNC 3on3`; desc = n.excerpt || desc; image = abs(n.image_url); kind = 'article' }
    } else if (type === 'tournaments') {
      const t = await one('tournaments', `slug=eq.${encodeURIComponent(slug)}`, 'name,venue,starts_on,ends_on,cover_url,poster_url,cities(name)')
      // the poster is what people recognise from Instagram; the cover photo is only the fallback
      if (t) { title = `${t.name} — GNC 3on3`; desc = [dateRange(t.starts_on, t.ends_on), t.venue, t.cities?.name].filter(Boolean).join(' · '); image = abs(t.poster_url || t.cover_url) }
    } else if (type === 'register') {
      // /register?t=<slug> — or plain /register, which opens on the tournament taking entries now
      const sel = 'name,slug,venue,starts_on,ends_on,registration_deadline,cover_url,poster_url'
      const t = regSlug
        ? await one('tournaments', `slug=eq.${encodeURIComponent(regSlug)}`, sel)
        : await one('tournaments', 'status=eq.registration&is_public=eq.true&order=starts_on.asc', sel)
      url = `${SITE}/register${t ? `?t=${encodeURIComponent(t.slug)}` : ''}`
      if (t) {
        const dl = t.registration_deadline ? new Date(t.registration_deadline) : null
        title = `Δήλωσε ομάδα — ${t.name}`
        desc = [dateRange(t.starts_on, t.ends_on), t.venue, dl ? `Δηλώσεις ως ${dl.toLocaleDateString('el-GR', { day: 'numeric', month: 'long', timeZone: 'Europe/Athens' })}` : ''].filter(Boolean).join(' · ')
        image = abs(t.poster_url || t.cover_url)
      } else { title = 'Δήλωσε ομάδα — GNC 3on3' }
    } else if (type === 'cities') {
      const c = await one('cities', `id=eq.${encodeURIComponent(slug)}`, 'name,image_url')
      if (c) { title = `${c.name} — GNC 3on3`; desc = `Η στάση της περιοδείας GNC 3on3 στην πόλη ${c.name}.`; image = abs(c.image_url) }
    }
  } catch {
    // a card with the site defaults is still a working card
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400')
  res.status(200).send(`<!doctype html><html lang="el"><head><meta charset="utf-8">
<title>${esc(title)}</title>
<link rel="canonical" href="${esc(url)}">
<meta name="description" content="${esc(desc)}">
<meta property="og:site_name" content="GNC 3on3">
<meta property="og:type" content="${kind}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:url" content="${esc(url)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(image)}">
</head><body><h1>${esc(title)}</h1><p>${esc(desc)}</p><p><a href="${esc(url)}">${esc(url)}</a></p></body></html>`)
}
