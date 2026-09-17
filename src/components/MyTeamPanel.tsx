import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { MyTeam } from '@/data/types'
import { cn } from '@/lib/cn'

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Εκκρεμεί έγκριση', cls: 'border-orange text-orange' },
  active: { label: 'Εγκρίθηκε', cls: 'border-ok text-ok' },
  waitlist: { label: 'Λίστα αναμονής', cls: 'border-line text-dim' },
}

/**
 * The captain's side of a team: who is in, who is missing, and the invite link — which used to
 * appear once on the success screen and then existed nowhere. Teammates see the same card without
 * the invite.
 */
export function MyTeamPanel({ teams }: { teams: MyTeam[] }) {
  if (!teams.length) return null
  return (
    <div className="flex flex-col gap-4">
      {teams.map(t => <TeamCard key={t.team_id} t={t} />)}
    </div>
  )
}

function TeamCard({ t }: { t: MyTeam }) {
  const s = STATUS[t.status] ?? { label: t.status, cls: 'border-line text-dim' }
  const slots = [...t.roster, ...Array(Math.max(0, 4 - t.roster.length)).fill(null)] as Array<MyTeam['roster'][number] | null>
  const missing = 4 - t.roster.length

  return (
    <div className="card rounded-band p-6 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-extrabold uppercase tracking-[.12em] text-orange">{t.category}</div>
          <div className="mt-1 text-[24px] font-bold leading-tight">{t.name}</div>
          <Link to={`/tournaments/${t.slug}`} className="mt-1 inline-block text-[13px] text-dim hover:text-orange">
            {t.tournament}{t.venue ? ` · ${t.venue}` : ''} →
          </Link>
        </div>
        <span className={cn('shrink-0 rounded-full border px-3 py-[6px] text-[11px] font-extrabold uppercase tracking-[.12em]', s.cls)}>{s.label}</span>
      </div>

      <div className="mt-6">
        <div className="kicker mb-3">Ρόστερ <span className="text-mute">{t.roster.length}/4</span></div>
        <div className="grid gap-2 sm:grid-cols-2">
          {slots.map((p, i) => p ? (
            <div key={p.player_id} className="flex items-center justify-between gap-3 rounded-[12px] border border-line px-4 py-3">
              <span className="truncate text-[15px] font-semibold">{p.name}</span>
              {p.role === 'captain' && <span className="shrink-0 rounded-[5px] bg-orange px-[7px] py-[2px] text-[9px] font-extrabold tracking-[.1em] text-[#111]">ΑΡΧΗΓΟΣ</span>}
            </div>
          ) : (
            <div key={`empty-${i}`} className="flex items-center gap-3 rounded-[12px] border border-dashed border-line px-4 py-3 text-[14px] text-mute">
              <span className="text-[18px] leading-none">+</span> Κενή θέση
            </div>
          ))}
        </div>
      </div>

      {t.captain && t.invite_code && <Invite code={t.invite_code} team={t.name} missing={missing} invites={t.invites ?? []} />}
    </div>
  )
}

function Invite({ code, team, missing, invites }: { code: string; team: string; missing: number; invites: MyTeam['invites'] }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/join/${code}`
  const text = `Μπες στην ομάδα ${team} για το GNC 3on3: ${url}`
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* ignore */ }
  }
  const btn = 'pop inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-[9px] text-[12px] font-bold uppercase tracking-[.06em] hover:border-orange hover:text-orange'

  return (
    <div className="mt-6 rounded-[16px] border border-orange/50 bg-orange/[.07] p-5">
      <div className="kicker mb-2 text-orange-soft">Σύνδεσμος πρόσκλησης</div>
      <p className="mb-3 text-[13px] text-dim">
        {missing > 0
          ? `Λείπουν ${missing === 1 ? 'ένας συμπαίκτης' : `${missing} συμπαίκτες`}. Στείλε τον σύνδεσμο — συμπληρώνουν μόνο τα δικά τους στοιχεία.`
          : 'Η ομάδα είναι πλήρης. Κράτα τον σύνδεσμο αν χρειαστεί αντικατάσταση.'}
      </p>
      <div className="mono mb-3 break-all rounded-[10px] bg-black/30 px-4 py-3 text-[14px] font-bold">{url}</div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copy} className={btn}>{copied ? 'Αντιγράφηκε ✓' : 'Αντιγραφή'}</button>
        <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" className={btn}>WhatsApp</a>
        <a href={`viber://forward?text=${encodeURIComponent(text)}`} className={btn}>Viber</a>
        <a href={`mailto:?subject=${encodeURIComponent(`Ομάδα ${team} — GNC 3on3`)}&body=${encodeURIComponent(text)}`} className={btn}>Email</a>
      </div>

      {invites && invites.length > 0 && (
        <div className="mt-5 border-t border-white/12 pt-4">
          <div className="kicker mb-2">Όσους κάλεσες</div>
          <div className="flex flex-col gap-[6px]">
            {invites.map(i => (
              <div key={i.email} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="truncate text-dim">{i.email}</span>
                <span className={cn('shrink-0 text-[11px] font-bold uppercase tracking-[.1em]', i.joined ? 'text-ok' : 'text-mute')}>
                  {i.joined ? 'Μπήκε ✓' : 'Εκκρεμεί'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
