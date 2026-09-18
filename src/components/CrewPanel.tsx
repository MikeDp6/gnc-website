import { useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Field, TextInput } from '@/components/ui/Form'
import { cn } from '@/lib/cn'
import type { Crew } from '@/data/types'

/**
 * One standing team. Members who have not answered yet are shown as waiting rather than hidden —
 * the captain needs to see who is still missing before a tournament, not be told everything is fine.
 */
export function CrewPanel({ crew, onInvite, busy }: { crew: Crew; onInvite?: (email: string) => Promise<void>; busy?: boolean }) {
  const [email, setEmail] = useState('')
  const [open, setOpen] = useState(false)
  const waiting = crew.members.filter(m => !m.accepted).length + crew.invites.length

  const send = async () => {
    if (!onInvite || !email.trim()) return
    await onInvite(email.trim())
    setEmail(''); setOpen(false)
  }

  return (
    <div className="card rounded-band p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="disp text-[28px] leading-none">{crew.name}</div>
          <div className="mt-[6px] text-[13px] text-dim">
            {[crew.city, `${crew.members.filter(m => m.accepted).length} μέλη`].filter(Boolean).join(' · ')}
            {waiting > 0 && <span className="text-orange"> · {waiting} σε αναμονή</span>}
          </div>
        </div>
        {crew.captain && <span className="rounded-full border border-orange px-3 py-[5px] text-[10px] font-extrabold uppercase tracking-[.12em] text-orange">Αρχηγός</span>}
      </div>

      <div className="mt-5 flex flex-col">
        {crew.members.map(m => (
          <div key={m.player_id} className="flex items-center gap-3 border-t border-line py-3">
            {m.avatar
              ? <img src={m.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
              : <Avatar name={m.name} size={36} tone={m.role === 'captain' ? 'orange' : 'blue'} />}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold">{m.name}</div>
              {m.role === 'captain' && <div className="text-[11px] uppercase tracking-[.1em] text-mute">Αρχηγός</div>}
            </div>
            <span className={cn('shrink-0 rounded-full border px-[10px] py-[3px] text-[10px] font-extrabold uppercase tracking-[.1em]',
              m.accepted ? 'border-line text-dim' : 'border-orange text-orange')}>
              {m.accepted ? 'Μέλος' : 'Περιμένει απάντηση'}
            </span>
          </div>
        ))}

        {crew.invites.map(i => (
          <div key={i.email} className="flex items-center gap-3 border-t border-line py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-dashed border-line text-[14px] text-mute">@</span>
            <div className="min-w-0 flex-1 truncate text-[14px] text-dim">{i.email}</div>
            <span className="shrink-0 rounded-full border border-dashed border-line px-[10px] py-[3px] text-[10px] font-extrabold uppercase tracking-[.1em] text-mute">
              Δεν έχει λογαριασμό
            </span>
          </div>
        ))}
      </div>

      {crew.captain && onInvite && (
        <div className="mt-4 border-t border-line pt-4">
          {open ? (
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Email συμπαίκτη" className="min-w-[220px] flex-1">
                <TextInput value={email} disabled={busy} inputMode="email" autoFocus
                  onChange={e => setEmail(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send() }} />
              </Field>
              <button type="button" onClick={send} disabled={busy || !email.trim()}
                className="pop rounded-full bg-white px-5 py-[10px] text-[12px] font-bold uppercase tracking-[.06em] text-[#111] disabled:opacity-45">
                Στείλε πρόσκληση
              </button>
              <button type="button" onClick={() => { setOpen(false); setEmail('') }} className="text-[12px] font-bold uppercase tracking-[.08em] text-dim hover:text-white">Άκυρο</button>
            </div>
          ) : (
            <button type="button" onClick={() => setOpen(true)} className="text-[12px] font-bold uppercase tracking-[.08em] text-orange">+ Πρόσθεσε συμπαίκτη</button>
          )}
        </div>
      )}
    </div>
  )
}
