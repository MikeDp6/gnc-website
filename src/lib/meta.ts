import { useEffect } from 'react'

const SITE = 'GNC 3on3'
const DEFAULT_IMG = '/og.jpg'

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) { el = document.createElement('link'); el.rel = rel; document.head.appendChild(el) }
  el.href = href
}

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
  el.setAttribute('content', value)
}

/** Per-page <title> + Open Graph / Twitter tags, so shares on Instagram, Viber, WhatsApp and Facebook show the right card. */
export function useMeta(title?: string, description?: string, image?: string) {
  useEffect(() => {
    const full = title ? `${title} — ${SITE}` : `${SITE} — Τουρνουά 3on3 σε όλη την Ελλάδα`
    const desc = description ?? 'Τα τουρνουά 3on3 της GNC: πρόγραμμα, όμιλοι, νοκ-άουτ, δηλώσεις συμμετοχής και αρχείο διοργανώσεων σε όλη την Ελλάδα.'
    const img = new URL(image || DEFAULT_IMG, window.location.origin).href
    document.title = full
    setMeta('name', 'description', desc)
    setMeta('property', 'og:title', full); setMeta('property', 'og:description', desc); setMeta('property', 'og:image', img)
    setMeta('property', 'og:url', window.location.href); setMeta('property', 'og:type', 'website'); setMeta('property', 'og:site_name', SITE)
    setMeta('name', 'twitter:card', 'summary_large_image'); setMeta('name', 'twitter:title', full); setMeta('name', 'twitter:description', desc); setMeta('name', 'twitter:image', img)
    // one address per page for Google, without the ?utm=… a share can add
    setLink('canonical', window.location.origin + window.location.pathname)
  }, [title, description, image])
}

/**
 * Structured data (schema.org) for the page, so Google can show a tournament as an event
 * and an article with its date. Pass null while the data is still loading.
 */
export function useJsonLd(data: object | null) {
  const json = data ? JSON.stringify(data) : ''
  useEffect(() => {
    if (!json) return
    const el = document.createElement('script')
    el.type = 'application/ld+json'
    el.text = json
    document.head.appendChild(el)
    return () => { el.remove() }
  }, [json])
}
