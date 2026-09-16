import { Fragment, type ReactNode } from 'react'

/** Tiny Markdown renderer for the static content pages (headings, paragraphs, lists, bold, links). No dependency. */
export function Markdown({ text }: { text: string }) {
  const lines = text.split('\n')
  const out: ReactNode[] = []
  let list: { type: 'ul' | 'ol'; items: string[] } | null = null
  const flush = () => { if (list) { const L = list; out.push(L.type === 'ul' ? <ul key={out.length} className="my-4 list-disc space-y-2 pl-6">{L.items.map((i, k) => <li key={k}>{inline(i)}</li>)}</ul> : <ol key={out.length} className="my-4 list-decimal space-y-2 pl-6">{L.items.map((i, k) => <li key={k}>{inline(i)}</li>)}</ol>); list = null } }
  for (const raw of lines) {
    const l = raw.trim()
    if (!l) { flush(); continue }
    const h = l.match(/^(#{1,4})\s+(.*)/)
    if (h) { flush(); const n = h[1].length; const cls = n <= 2 ? 'disp mt-12 text-[40px] md:text-[52px]' : n === 3 ? 'disp mt-10 text-[30px] text-orange' : 'mt-8 text-[16px] font-bold uppercase tracking-[.06em] text-white'; out.push(<div key={out.length} className={cls}>{inline(h[2])}</div>); continue }
    const ul = l.match(/^[-*]\s+(.*)/); const ol = l.match(/^\d+[.)]\s+(.*)/)
    if (ul) { if (!list || list.type !== 'ul') { flush(); list = { type: 'ul', items: [] } } list.items.push(ul[1]); continue }
    if (ol && !/^\d+\.\d/.test(l)) { if (!list || list.type !== 'ol') { flush(); list = { type: 'ol', items: [] } } list.items.push(ol[1]); continue }
    flush(); out.push(<p key={out.length} className="my-3 leading-relaxed">{inline(l)}</p>)
  }
  flush()
  return <div className="text-[16px] text-[#d9d8d3]">{out}</div>
}

function inline(s: string): ReactNode {
  // **bold** and [text](url) / bare urls
  const parts = s.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|https?:\/\/\S+)/g)
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) return <b key={i} className="text-white">{p.slice(2, -2)}</b>
    const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/); if (m) return <a key={i} href={m[2]} target="_blank" rel="noreferrer" className="text-orange underline">{m[1]}</a>
    if (/^https?:\/\//.test(p)) return <a key={i} href={p} target="_blank" rel="noreferrer" className="break-all text-orange underline">{p}</a>
    return <Fragment key={i}>{p}</Fragment>
  })
}
