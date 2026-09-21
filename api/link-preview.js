/**
 * Link preview for the admin "Media" page.
 *   GET /api/link-preview?url=<post>  → { title, image, site } read from the post's Open Graph tags,
 *                                        asked for the way Facebook's own crawler asks, so public
 *                                        Instagram / Facebook posts answer with their card.
 *   GET /api/link-preview?img=<image> → the image bytes, so the browser can shrink it and keep a
 *                                        copy (Facebook / Instagram image URLs expire after a while).
 * Only those platforms' hosts are accepted: this must not become an open proxy.
 */
const PAGE_HOSTS = /(^|\.)(instagram\.com|facebook\.com|fb\.watch|fb\.com|youtube\.com|youtu\.be|tiktok\.com)$/i
const IMG_HOSTS = /(^|\.)(fbcdn\.net|cdninstagram\.com|ytimg\.com|tiktokcdn\.com|tiktokcdn-eu\.com)$/i
const UA = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'

const decode = s => String(s ?? '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
const meta = (html, prop) => {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*>`, 'i')
  const tag = html.match(re)?.[0]; if (!tag) return null
  return decode(tag.match(/content=["']([^"']*)["']/i)?.[1] ?? '') || null
}
const host = u => { try { return new URL(u).hostname } catch { return '' } }

export default async function handler(req, res) {
  const { url = '', img = '' } = req.query ?? {}
  try {
    if (img) {
      if (!IMG_HOSTS.test(host(img))) return res.status(400).json({ error: 'host' })
      const r = await fetch(img, { headers: { 'User-Agent': UA } })
      if (!r.ok) return res.status(502).json({ error: 'image ' + r.status })
      const buf = Buffer.from(await r.arrayBuffer())
      if (buf.length > 8e6) return res.status(413).json({ error: 'too big' })
      res.setHeader('Content-Type', r.headers.get('content-type') || 'image/jpeg')
      res.setHeader('Cache-Control', 'private, max-age=300')
      return res.status(200).send(buf)
    }
    if (!PAGE_HOSTS.test(host(url))) return res.status(400).json({ error: 'Μόνο σύνδεσμοι Instagram, Facebook, YouTube ή TikTok' })
    const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'el,en;q=0.8' }, redirect: 'follow' })
    const html = (await r.text()).slice(0, 600000)
    const title = meta(html, 'og:title') || html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || null
    const image = meta(html, 'og:image') || meta(html, 'twitter:image')
    res.setHeader('Cache-Control', 'private, max-age=60')
    return res.status(200).json({ title: title ? decode(title).trim() : null, image, site: meta(html, 'og:site_name'), description: meta(html, 'og:description') })
  } catch (e) {
    return res.status(502).json({ error: String(e?.message || e) })
  }
}
