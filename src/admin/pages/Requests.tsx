import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Btn, PageTitle, Toast } from '../ui'
import { cn } from '@/lib/cn'

type Pending = { id: string; name: string; category_id: string; status: string; city: string | null; created_at: string; tournament_id: string; tournaments: { name: string } | null; players: { display_name: string; email: string | null; phone: string | null } | null }
type Req = { id: string; kind: string; name: string; email: string; phone: string | null; org: string | null; subject: string | null; item: string | null; event_date: string | null; message: string | null; handled: boolean; created_at: string }

/** Inbox: team registrations awaiting approval + contact/quote requests from the site. */
export function Requests() {
  const [teams, setTeams] = useState<Pending[]>([]); const [reqs, setReqs] = useState<Req[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const say = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(null), 2500) }, [])
  const load = useCallback(async () => {
    if (!supabase) return
    const a = await supabase.from('teams').select('id,name,category_id,status,city,created_at,tournament_id,tournaments(name),players!teams_captain_id_fkey(display_name,email,phone)').in('status', ['pending', 'waitlist']).order('created_at', { ascending: false })
    if (a.error) say(a.error.message); else setTeams(a.data as unknown as Pending[])
    const b = await supabase.from('contact_requests').select('*').order('created_at', { ascending: false }).limit(100)
    if (b.error) say(b.error.message); else setReqs(b.data as Req[])
  }, [say])
  useEffect(() => { load() }, [load])
  const setStatus = async (id: string, status: string) => { const r = await supabase!.from('teams').update({ status }).eq('id', id); if (r.error) say(r.error.message); else { say(status === 'active' ? 'Εγκρίθηκε' : 'Ενημερώθηκε'); load() } }
  const handled = async (id: string, v: boolean) => { const r = await supabase!.from('contact_requests').update({ handled: v }).eq('id', id); if (r.error) say(r.error.message); else load() }
  const fmt = (s: string) => new Date(s).toLocaleString('el-GR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  return (
    <>
      <PageTitle a="Αιτήματα" b={`(${teams.length + reqs.filter(r => !r.handled).length})`} />
      <div className="mb-3 kicker">Δηλώσεις ομάδων προς έγκριση</div>
      <div className="card mb-8 overflow-hidden">
        {teams.map(t => (
          <div key={t.id} className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-line px-4 py-3 text-[13px] md:grid-cols-[90px_1fr_1fr_1fr_auto]">
            <div className="mono text-dim">{fmt(t.created_at)}</div>
            <div><b>{t.name}</b>{t.city && <span className="text-dim"> · {t.city}</span>}<div className="text-[11px] uppercase tracking-[.08em] text-dim">{t.category_id} · {t.tournaments?.name}</div></div>
            <div className="text-dim">{t.players?.display_name}<div className="text-[12px]">{t.players?.email} · {t.players?.phone}</div></div>
            <div><span className={cn('rounded-full border px-2 py-[2px] text-[10px] font-bold uppercase tracking-[.1em]', t.status === 'waitlist' ? 'border-orange text-orange' : 'border-line text-dim')}>{t.status === 'waitlist' ? 'Λίστα αναμονής' : 'Εκκρεμεί'}</span></div>
            <div className="flex gap-1"><Btn className="px-3 py-1 text-[11px]" onClick={() => setStatus(t.id, 'active')}>Έγκριση</Btn><Btn variant="ghost" className="px-3 py-1 text-[11px]" onClick={() => setStatus(t.id, 'waitlist')}>Λίστα</Btn><Btn variant="danger" className="px-3 py-1 text-[11px]" onClick={() => setStatus(t.id, 'removed')}>Απόρριψη</Btn><Link to={`/admin/tournaments/${t.tournament_id}`} className="px-2 py-1 text-[11px] text-orange">→</Link></div>
          </div>
        ))}
        {!teams.length && <div className="p-6 text-dim">Καμία εκκρεμής δήλωση.</div>}
      </div>
      <div className="mb-3 kicker">Επικοινωνία & προσφορές</div>
      <div className="card overflow-hidden">
        {reqs.map(r => (
          <div key={r.id} className={cn('grid grid-cols-[90px_1fr_auto] items-start gap-3 border-t border-line px-4 py-3 text-[13px]', r.handled && 'opacity-50')}>
            <div className="mono text-dim">{fmt(r.created_at)}<div className="mt-1 text-[10px] uppercase tracking-[.1em]">{r.kind === 'quote' ? 'Προσφορά' : 'Επικοινωνία'}</div></div>
            <div><b>{r.name}</b>{r.org && <span className="text-dim"> · {r.org}</span>} <span className="text-dim">· {r.email}{r.phone ? ` · ${r.phone}` : ''}</span>
              <div className="mt-1 text-dim">{r.item && <b className="text-white">{r.item} · </b>}{r.subject && <b className="text-white">{r.subject} · </b>}{r.event_date && <span>{r.event_date} · </span>}{r.message}</div></div>
            <label className="flex items-center gap-2 text-[11px] uppercase tracking-[.08em] text-dim"><input type="checkbox" checked={r.handled} onChange={e => handled(r.id, e.target.checked)} />Έγινε</label>
          </div>
        ))}
        {!reqs.length && <div className="p-6 text-dim">Κανένα αίτημα.</div>}
      </div>
      <Toast msg={toast} />
    </>
  )
}
