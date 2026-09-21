import { useCallback, useEffect, useMemo, useState } from 'react'
import * as api from '@/lib/adminApi'
import { cn } from '@/lib/cn'
import { Btn, Input, Select } from '../ui'
import { downloadXlsx, type Cell } from '../xlsx'

const ST: Record<string, string> = { pending: 'Εκκρεμεί', active: 'Ενεργή', waitlist: 'Λίστα αναμονής', removed: 'Αποσύρθηκε' }
const norm = (x: string) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const years = (v: string) => { const n = parseInt(v, 10); return Number.isFinite(n) && n > 1900 && n < 2100 ? n : null }
type Team = api.TeamExport
type Member = Team['team_players'][number]

/**
 * Every registered team of the tournament on one screen, with its people. Built for the day itself:
 * search a team or a player, fix a name or a phone in place, add the teammate who just turned up,
 * swap the captain, confirm, check in. Each field saves the moment you leave it.
 */
export function TeamsBoard({ tid, say }: { tid: string; say: (m: string) => void }) {
  const [teams, setTeams] = useState<Team[]>([])
  const [cats, setCats] = useState<Awaited<ReturnType<typeof api.listTournamentCategories>>>([])
  const [all, setAll] = useState<Awaited<ReturnType<typeof api.listCategories>>>([])
  const [q, setQ] = useState(''); const [cat, setCat] = useState(''); const [status, setStatus] = useState('live')
  const [bulk, setBulk] = useState(false); const [paste, setPaste] = useState(''); const [bulkCat, setBulkCat] = useState('')
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)

  const load = useCallback(() => api.exportTeams(tid).then(setTeams).catch(e => say(e.message)), [tid, say])
  useEffect(() => {
    api.listCategories().then(setAll).catch(() => {})
    api.listTournamentCategories(tid).then(c => { setCats(c); if (c[0]) setBulkCat(c[0].category_id) }).catch(() => {})
    load()
  }, [tid, load])
  const label = (cid: string) => all.find(c => c.id === cid)?.label ?? cid
  const order = useMemo(() => new Map(cats.map((c, i) => [c.category_id, i])), [cats])

  const shown = useMemo(() => {
    const k = norm(q.trim())
    return teams
      .filter(t => (!cat || t.category_id === cat) && (status === 'all' || (status === 'live' ? t.status !== 'removed' : t.status === status)))
      .filter(t => !k || norm(t.name).includes(k) || t.team_players.some(m => m.players && norm(`${m.players.first_name} ${m.players.last_name} ${m.players.email ?? ''} ${m.players.phone ?? ''}`).includes(k)))
      .sort((a, b) => (order.get(a.category_id) ?? 99) - (order.get(b.category_id) ?? 99) || a.name.localeCompare(b.name, 'el'))
  }, [teams, q, cat, status, order])
  // searching for a player opens the teams that contain them
  const isOpen = (id: string) => open.has(id) || q.trim().length > 1
  const toggle = (id: string) => setOpen(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  const totals = useMemo(() => cats.map(c => {
    const ts = teams.filter(t => t.category_id === c.category_id && t.status !== 'removed')
    return { id: c.category_id, teams: ts.length, active: ts.filter(t => t.status === 'active').length, players: ts.reduce((n, t) => n + t.team_players.length, 0), max: c.max_teams }
  }), [cats, teams])

  // ---------- local edits, then save ----------
  const patchTeam = (id: string, p: Partial<Team>) => setTeams(ts => ts.map(t => t.id === id ? { ...t, ...p } : t))
  const saveTeam = async (t: Team, p: Parameters<typeof api.updateTeam>[1]) => {
    try { await api.updateTeam(t.id, p); patchTeam(t.id, p as Partial<Team>); say('Αποθηκεύτηκε') } catch (e) { say((e as Error).message) }
  }
  const savePlayer = async (m: Member, p: api.PlayerPatch) => {
    if (!m.players) return
    const cur = m.players
    if (Object.entries(p).every(([k, v]) => (cur as unknown as Record<string, unknown>)[k] === v)) return
    try {
      await api.updatePlayer(cur.id, p)
      setTeams(ts => ts.map(t => ({ ...t, team_players: t.team_players.map(x => x.players?.id === cur.id ? { ...x, players: { ...x.players!, ...p } } : x) })))
      say('Αποθηκεύτηκε')
    } catch (e) { say((e as Error).message) }
  }
  const act = async (f: () => Promise<unknown>, ok: string) => { try { await f(); await load(); say(ok) } catch (e) { say((e as Error).message) } }

  const addBulk = async () => {
    const names = paste.split('\n').map(s => s.trim()).filter(Boolean)
    if (!bulkCat || !names.length) return
    await act(() => api.addTeams(tid, names.map(name => ({ category_id: bulkCat, name }))), `Προστέθηκαν ${names.length} ομάδες`)
    setPaste(''); setBulk(false)
  }
  const newTeam = async () => {
    const c = cat || cats[0]?.category_id; if (!c) return say('Πρόσθεσε πρώτα κατηγορίες')
    const name = prompt(`Όνομα νέας ομάδας (${label(c)}):`)?.trim(); if (!name) return
    try { const r = await api.createTeam(tid, { category_id: c, name }); await load(); setOpen(s => new Set(s).add(r.id)); say('Η ομάδα δημιουργήθηκε') } catch (e) { say((e as Error).message) }
  }

  const exportXlsx = async () => {
    setExporting(true)
    try {
      const tour = await api.getTournament(tid)
      const rows = [...teams].sort((a, b) => (order.get(a.category_id) ?? 99) - (order.get(b.category_id) ?? 99) || a.name.localeCompare(b.name, 'el'))
      const when = (x: string | null) => x ? new Date(x).toLocaleString('el-GR', { dateStyle: 'short', timeStyle: 'short' }) : ''
      const roster = (t: Team) => [...t.team_players].sort((a, b) => (a.role === 'captain' ? -1 : 0) - (b.role === 'captain' ? -1 : 0))
      const players: Cell[][] = [['Κατηγορία', 'Ομάδα', 'Κατάσταση', 'Ρόλος', 'Όνομα', 'Επώνυμο', 'Έτος γέννησης', 'Email', 'Κινητό', 'Κηδεμόνας', 'Επιβεβαίωσε', 'Πόλη ομάδας', 'Check-in', 'Δήλωση']]
      const summary: Cell[][] = [['Κατηγορία', 'Ομάδα', 'Κατάσταση', 'Αρχηγός', 'Email αρχηγού', 'Κινητό αρχηγού', 'Παίκτες', 'Σύνθεση', 'Πόλη', 'Check-in', 'Δήλωση']]
      for (const t of rows) {
        const r = roster(t), cap = r.find(x => x.role === 'captain')?.players
        for (const m of r) {
          const p = m.players; if (!p) continue
          players.push([label(t.category_id), t.name, ST[t.status] ?? t.status, m.role === 'captain' ? 'Αρχηγός' : 'Παίκτης', p.first_name, p.last_name, p.birth_year ?? '', p.email ?? '', p.phone ?? '', p.guardian_name ?? '', m.role === 'captain' || m.accepted_at ? 'Ναι' : 'Σε αναμονή', t.city ?? '', t.checked_in_at ? 'Ναι' : '', when(t.created_at)])
        }
        summary.push([label(t.category_id), t.name, ST[t.status] ?? t.status, cap ? `${cap.first_name} ${cap.last_name}` : '', cap?.email ?? '', cap?.phone ?? '', r.length, r.map(x => x.players ? `${x.players.first_name} ${x.players.last_name}` : '').filter(Boolean).join(', '), t.city ?? '', t.checked_in_at ? 'Ναι' : '', when(t.created_at)])
      }
      downloadXlsx(`${tour.slug}-omades-${api.ymd(new Date())}`, [
        { name: 'Ομάδες', rows: summary, widths: [14, 26, 14, 24, 30, 16, 9, 60, 16, 10, 16] },
        { name: 'Παίκτες', rows: players, widths: [14, 26, 14, 10, 16, 20, 14, 30, 16, 22, 13, 16, 10, 16] },
      ])
      say(`Εξαγωγή: ${rows.length} ομάδες, ${players.length - 1} παίκτες`)
    } catch (e) { say((e as Error).message) }
    setExporting(false)
  }

  if (!cats.length) return <div className="card p-6 text-dim">Πρόσθεσε πρώτα κατηγορίες στη διοργάνωση.</div>

  return (
    <div className="grid gap-4">
      {/* σύνολα ανά κατηγορία — πάτημα = φίλτρο */}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setCat('')} className={cn('rounded-[12px] border px-4 py-2 text-left', !cat ? 'border-orange bg-orange/10' : 'border-line hover:border-white/30')}>
          <div className="text-[11px] font-extrabold uppercase tracking-[.1em] text-dim">Σύνολο</div>
          <div className="text-[15px] font-bold">{totals.reduce((n, x) => n + x.teams, 0)} ομάδες · {totals.reduce((n, x) => n + x.players, 0)} παίκτες</div>
        </button>
        {totals.map(x => (
          <button key={x.id} type="button" onClick={() => setCat(c => c === x.id ? '' : x.id)} className={cn('rounded-[12px] border px-4 py-2 text-left', cat === x.id ? 'border-orange bg-orange/10' : 'border-line hover:border-white/30')}>
            <div className="text-[11px] font-extrabold uppercase tracking-[.1em] text-dim">{label(x.id)}</div>
            <div className="text-[15px] font-bold">{x.teams}{x.max ? `/${x.max}` : ''} ομάδες <span className="text-[12px] font-semibold text-mute">· {x.active} ενεργές · {x.players} παίκτες</span></div>
          </button>
        ))}
      </div>

      {/* εργαλεία */}
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Αναζήτηση ομάδας, παίκτη, email ή κινητού…" className="min-w-[240px] flex-1 py-2" />
        <Select value={status} onChange={e => setStatus(e.target.value)} className="w-auto py-2">
          <option value="live">Όλες εκτός αποσυρμένων</option><option value="active">Ενεργές</option><option value="pending">Εκκρεμείς</option>
          <option value="waitlist">Λίστα αναμονής</option><option value="removed">Αποσύρθηκαν</option><option value="all">Όλες</option>
        </Select>
        <Btn onClick={newTeam}>+ Νέα ομάδα</Btn>
        <Btn variant="ghost" onClick={() => setBulk(b => !b)}>Μαζική προσθήκη</Btn>
        <Btn variant="ghost" onClick={exportXlsx} disabled={exporting || !teams.length}>{exporting ? 'Ετοιμάζεται…' : '⬇ Excel'}</Btn>
        <button type="button" onClick={() => setOpen(s => s.size ? new Set() : new Set(shown.map(t => t.id)))} className="px-2 text-[12px] font-bold text-dim hover:text-white">{open.size ? 'Κλείσιμο όλων' : 'Άνοιγμα όλων'}</button>
      </div>

      {bulk && (
        <div className="card grid gap-3 p-4 md:grid-cols-[220px_1fr_auto] md:items-start">
          <Select value={bulkCat} onChange={e => setBulkCat(e.target.value)}>{cats.map(c => <option key={c.category_id} value={c.category_id}>{label(c.category_id)}</option>)}</Select>
          <textarea value={paste} onChange={e => setPaste(e.target.value)} rows={5} placeholder="Ονόματα ομάδων, ένα ανά γραμμή (επικόλληση από Excel/PDF)" className="w-full rounded-[10px] border border-line bg-transparent px-3 py-2 text-[14px] outline-none focus:border-white/30" />
          <Btn onClick={addBulk}>Προσθήκη {paste.split('\n').filter(s => s.trim()).length || ''}</Btn>
        </div>
      )}

      {/* ομάδες */}
      <div className="grid gap-3">
        {shown.map(t => <TeamCard key={t.id} t={t} open={isOpen(t.id)} onToggle={() => toggle(t.id)} cats={cats} label={label}
          saveTeam={saveTeam} savePlayer={savePlayer} act={act} patchTeam={patchTeam} />)}
        {!shown.length && <div className="card p-6 text-[14px] text-dim">{teams.length ? 'Καμία ομάδα δεν ταιριάζει στα φίλτρα.' : 'Δεν υπάρχουν ομάδες ακόμα.'}</div>}
      </div>
    </div>
  )
}

function TeamCard({ t, open, onToggle, cats, label, saveTeam, savePlayer, act, patchTeam }: {
  t: Team; open: boolean; onToggle: () => void
  cats: Array<{ category_id: string }>; label: (c: string) => string
  saveTeam: (t: Team, p: Parameters<typeof api.updateTeam>[1]) => Promise<void>
  savePlayer: (m: Member, p: api.PlayerPatch) => Promise<void>
  act: (f: () => Promise<unknown>, ok: string) => Promise<void>
  patchTeam: (id: string, p: Partial<Team>) => void
}) {
  const [adding, setAdding] = useState(false)
  const [n, setN] = useState({ first: '', last: '', year: '', email: '', phone: '' })
  const members = [...t.team_players].sort((a, b) => (a.role === 'captain' ? -1 : 0) - (b.role === 'captain' ? -1 : 0))
  const waiting = members.filter(m => m.role !== 'captain' && !m.accepted_at).length
  const add = async () => {
    if (!n.first.trim() || !n.last.trim()) return
    await act(() => api.addMember(t.id, { first_name: n.first.trim(), last_name: n.last.trim(), birth_year: years(n.year), email: n.email.trim().toLowerCase() || null, phone: n.phone.trim() || null }), 'Ο παίκτης προστέθηκε')
    setN({ first: '', last: '', year: '', email: '', phone: '' }); setAdding(false)
  }
  const field = (m: Member, k: keyof api.PlayerPatch, ph: string, cls = '', type = 'text') => (
    <Input type={type} defaultValue={(m.players?.[k] ?? '') as string} placeholder={ph} key={`${m.players?.id}-${k}-${m.players?.[k] ?? ''}`}
      onBlur={e => {
        const raw = e.target.value.trim()
        const v = k === 'birth_year' ? years(raw) : k === 'email' ? (raw.toLowerCase() || null) : (raw || null)
        if ((k === 'first_name' || k === 'last_name') && !v) { e.target.value = (m.players?.[k] ?? '') as string; return }
        savePlayer(m, { [k]: v } as api.PlayerPatch)
      }}
      className={cn('px-2 py-[6px] text-[13px]', cls)} />
  )

  return (
    <div className={cn('card overflow-hidden', t.status === 'removed' && 'opacity-60')}>
      <div className="flex flex-wrap items-center gap-2 p-3">
        <button type="button" onClick={onToggle} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-[13px] hover:border-white/30" aria-label="Άνοιγμα">{open ? '▾' : '▸'}</button>
        <Input defaultValue={t.name} key={t.name} onBlur={e => { const v = e.target.value.trim(); if (v && v !== t.name) saveTeam(t, { name: v }); else e.target.value = t.name }}
          className="min-w-[160px] flex-1 py-[6px] font-bold" />
        <Select value={t.category_id} onChange={e => { if (!confirm(`Μεταφορά της «${t.name}» στην ${label(e.target.value)}; Αν το πρόγραμμα έχει δημοσιευτεί, και οι δύο κατηγορίες θα ξαναφτιαχτούν στην επόμενη δημοσίευση.`)) { e.target.value = t.category_id; return } saveTeam(t, { category_id: e.target.value }) }} className="w-auto py-[6px] text-[12px]">
          {cats.map(c => <option key={c.category_id} value={c.category_id}>{label(c.category_id)}</option>)}
        </Select>
        <Select value={t.status} onChange={e => {
          const v = e.target.value
          // only active teams are in the schedule: changing that set means the category gets redrawn on the next publish
          if ((v === 'active') !== (t.status === 'active') && !confirm(`Η αλλαγή σε «${ST[v]}» αλλάζει τις ομάδες που μπαίνουν στο πρόγραμμα της κατηγορίας.\n\nΑν το πρόγραμμα έχει δημοσιευτεί και ξαναπατήσεις «Δημοσίευση προγράμματος», η κατηγορία θα ξαναφτιαχτεί και θα χαθούν τα σκορ της.\n\nΣυνέχεια;`)) { e.target.value = t.status; return }
          saveTeam(t, { status: v })
        }} className="w-auto py-[6px] text-[12px]">
          {Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <button type="button" onClick={() => { const v = t.checked_in_at ? null : new Date().toISOString(); saveTeam(t, { checked_in_at: v }); patchTeam(t.id, { checked_in_at: v }) }}
          className={cn('rounded-lg border px-3 py-[7px] text-[11px] font-bold uppercase tracking-[.08em]', t.checked_in_at ? 'border-ok text-ok' : 'border-line text-dim')}>{t.checked_in_at ? '✓ Check-in' : 'Check-in'}</button>
        <span className="text-[12px] text-mute">{members.length} παίκτες{waiting ? ` · ${waiting} σε αναμονή` : ''}</span>
        <button type="button" onClick={() => confirm(`Διαγραφή της ομάδας «${t.name}»; Οι παίκτες μένουν στο σύστημα.`) && act(() => api.deleteTeam(t.id), 'Η ομάδα διαγράφηκε')} className="ml-auto px-2 text-[12px] text-mute hover:text-red">Διαγραφή</button>
      </div>

      {open && (
        <div className="border-t border-line p-3">
          <div className="hidden grid-cols-[92px_1fr_1fr_76px_1.4fr_1fr_auto] gap-2 px-1 pb-1 text-[10px] font-extrabold uppercase tracking-[.1em] text-mute md:grid">
            <span>Ρόλος</span><span>Όνομα</span><span>Επώνυμο</span><span>Έτος</span><span>Email</span><span>Κινητό</span><span />
          </div>
          {members.map(m => m.players && (
            <div key={m.players.id} className="grid grid-cols-2 items-center gap-2 border-t border-line/60 py-2 first:border-t-0 md:grid-cols-[92px_1fr_1fr_76px_1.4fr_1fr_auto]">
              <div className="col-span-2 flex items-center gap-1 md:col-span-1">
                {m.role === 'captain'
                  ? <span className="rounded-full border border-orange px-2 py-[2px] text-[10px] font-extrabold uppercase text-orange">Αρχηγός</span>
                  : <button type="button" title={m.accepted_at ? 'Επιβεβαίωσε — πάτα για αναίρεση' : 'Σε αναμονή — πάτα για επιβεβαίωση'}
                      onClick={() => act(() => api.setMemberConfirmed(t.id, m.players!.id, !m.accepted_at), m.accepted_at ? 'Σε αναμονή' : 'Επιβεβαιώθηκε')}
                      className={cn('rounded-full border px-2 py-[2px] text-[10px] font-extrabold uppercase', m.accepted_at ? 'border-ok text-ok' : 'border-line text-mute')}>{m.accepted_at ? '✓ Μέσα' : 'Αναμονή'}</button>}
                {m.players.user_id && <span title="Έχει προφίλ — οι αλλαγές φαίνονται και στον λογαριασμό του" className="text-[12px]">👤</span>}
              </div>
              {field(m, 'first_name', 'Όνομα')}
              {field(m, 'last_name', 'Επώνυμο')}
              {field(m, 'birth_year', 'Έτος', '', 'number')}
              {field(m, 'email', 'email', 'col-span-2 md:col-span-1', 'email')}
              {field(m, 'phone', 'κινητό', '', 'tel')}
              <div className="flex items-center justify-end gap-1">
                {m.role !== 'captain' && <button type="button" title="Ορισμός αρχηγού" onClick={() => act(() => api.setCaptain(t.id, m.players!.id), 'Νέος αρχηγός')} className="rounded px-2 py-1 text-[12px] text-mute hover:text-orange">★</button>}
                <button type="button" title="Αφαίρεση από την ομάδα" onClick={() => confirm(`Αφαίρεση του/της ${m.players!.first_name} ${m.players!.last_name} από την ομάδα;`) && act(() => api.removeMember(t.id, m.players!.id), 'Αφαιρέθηκε')} className="rounded px-2 py-1 text-[12px] text-mute hover:text-red">✕</button>
              </div>
            </div>
          ))}
          {!members.length && <div className="py-2 text-[13px] text-mute">Δεν υπάρχουν παίκτες.</div>}

          {adding ? (
            <div className="mt-2 grid grid-cols-2 items-center gap-2 rounded-[10px] border border-orange/40 bg-orange/5 p-2 md:grid-cols-[92px_1fr_1fr_76px_1.4fr_1fr_auto]">
              <span className="col-span-2 text-[11px] font-extrabold uppercase text-orange md:col-span-1">Νέος</span>
              <Input autoFocus value={n.first} onChange={e => setN({ ...n, first: e.target.value })} placeholder="Όνομα *" className="px-2 py-[6px] text-[13px]" />
              <Input value={n.last} onChange={e => setN({ ...n, last: e.target.value })} placeholder="Επώνυμο *" className="px-2 py-[6px] text-[13px]" />
              <Input type="number" value={n.year} onChange={e => setN({ ...n, year: e.target.value })} placeholder="Έτος" className="px-2 py-[6px] text-[13px]" />
              <Input type="email" value={n.email} onChange={e => setN({ ...n, email: e.target.value })} placeholder="email" className="col-span-2 px-2 py-[6px] text-[13px] md:col-span-1" />
              <Input type="tel" value={n.phone} onChange={e => setN({ ...n, phone: e.target.value })} placeholder="κινητό" onKeyDown={e => e.key === 'Enter' && add()} className="px-2 py-[6px] text-[13px]" />
              <div className="flex gap-1"><Btn onClick={add} disabled={!n.first.trim() || !n.last.trim()} className="px-3 py-[7px]">Προσθήκη</Btn><button type="button" onClick={() => setAdding(false)} className="px-2 text-[12px] text-mute">✕</button></div>
            </div>
          ) : (
            <button type="button" onClick={() => setAdding(true)} className="mt-2 text-[13px] font-bold text-orange hover:underline">+ Προσθήκη παίκτη{members.length >= 4 ? ' (η ομάδα έχει ήδη 4)' : ''}</button>
          )}
        </div>
      )}
    </div>
  )
}
