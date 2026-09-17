import { useEffect } from 'react'

const SITE = 'GNC 3on3'
const DEFAULT_IMG = '/og.jpg'

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
  }, [title, description, image])
}
