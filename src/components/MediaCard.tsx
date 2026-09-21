import { cn } from '@/lib/cn'

export type MediaKind = 'photos' | 'album' | 'video' | 'reel'
export type Platform = 'instagram' | 'facebook' | 'youtube' | 'tiktok' | 'other'
export interface MediaLink { id: string; url: string; platform: Platform; kind: MediaKind; title: string | null; thumb_url: string | null; sort_order: number; tournament_id?: string | null }

export const KIND_LABEL: Record<MediaKind, string> = { photos: 'Φωτογραφίες', album: 'Άλμπουμ', video: 'Βίντεο', reel: 'Reel' }
const PLATFORM_LABEL: Record<Platform, string> = { instagram: 'Instagram', facebook: 'Facebook', youtube: 'YouTube', tiktok: 'TikTok', other: 'Σύνδεσμος' }
const PLATFORM_TINT: Record<Platform, string> = { instagram: '#E1306C', facebook: '#1877F2', youtube: '#FF0033', tiktok: '#25F4EE', other: '#8A9096' }

export function detectPlatform(u: string): Platform {
  const h = (() => { try { return new URL(u.trim()).hostname } catch { return '' } })()
  if (/instagram\.com$/i.test(h)) return 'instagram'
  if (/(facebook\.com|fb\.watch|fb\.com)$/i.test(h)) return 'facebook'
  if (/(youtube\.com|youtu\.be)$/i.test(h)) return 'youtube'
  if (/tiktok\.com$/i.test(h)) return 'tiktok'
  return 'other'
}

/**
 * Portrait card for a post that lives on Instagram / Facebook: the post's cover, what it is
 * (photos, video, reel), a title, and where tapping it takes you. Opens the post in a new tab.
 */
export function MediaCard({ m, preview, className }: { m: MediaLink; preview?: boolean; className?: string }) {
  const video = m.kind === 'video' || m.kind === 'reel'
  const Tag = preview ? 'div' : 'a'
  return (
    <Tag {...(preview ? {} : { href: m.url, target: '_blank', rel: 'noreferrer' })}
      className={cn('group card pop relative block aspect-[4/5] overflow-hidden rounded-[18px] bg-[#131316]', className)}>
      {m.thumb_url
        ? <img src={m.thumb_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
        : <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(255,135,0,.25),transparent_60%)]"><span className="disp text-[42px] text-white/15">GNC</span></div>}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,11,.35)_0%,rgba(10,10,11,0)_28%,rgba(10,10,11,0)_45%,rgba(10,10,11,.92)_100%)]" />
      <div className="absolute left-3 top-3 flex items-center gap-[6px] rounded-full bg-[#0A0A0B]/75 px-3 py-[5px] text-[10px] font-extrabold uppercase tracking-[.1em] text-white backdrop-blur">
        <i className="h-2 w-2 rounded-full" style={{ background: PLATFORM_TINT[m.platform] }} />{PLATFORM_LABEL[m.platform]}
      </div>
      {video && (
        <div className="absolute left-1/2 top-[42%] grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-[#0A0A0B]/55 backdrop-blur transition-transform group-hover:scale-110">
          <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-white" aria-hidden><path d="M7 4.5v15l13-7.5z" /></svg>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="text-[10px] font-extrabold uppercase tracking-[.12em] text-orange">{KIND_LABEL[m.kind]}</div>
        {m.title && <div className="disp mt-1 text-[20px] leading-[.95] text-white">{m.title}</div>}
        <div className="mt-2 text-[11px] font-bold uppercase tracking-[.08em] text-cement">Δες στο {PLATFORM_LABEL[m.platform]} ↗</div>
      </div>
    </Tag>
  )
}
