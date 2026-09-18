import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as api from '@/lib/adminApi'
import { Btn, Field, Input, PageTitle, Select, Toast } from '../ui'
import { ImageField } from '../upload'
import { cn } from '@/lib/cn'
import { Scheduler } from './Scheduler'
import { splits } from '@/scheduler/engine'

const TABS = ['Στοιχεία', 'Κατηγορίες', 'Ομάδες', 'Αγώνες & σκορ', 'Πρόγραμμα']
const STATUS = [['draft', 'Πρόχειρο'], ['registration', 'Δηλώσεις ανοιχτές'], ['upcoming', 'Επερχόμενο'], ['live', 'Σε εξέλιξη'], ['done', 'Ολοκληρώθηκε'], ['archived', 'Αρχείο']]

export function TournamentEdit() {
  const { id = '' } = useParams()
  const [tab, setTab] = useState(TABS[0])
  const [toast, setToast] = useState<string | null>(null)
  const say = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(null), 2500) }, [])
  const [t, setT] = useState<Awaited<ReturnType<typeof api.getTournament>> | null>(null)
  const reload = useCallback(() => api.getTournament(id).then(setT).catch(e => say(e.message)), [id, say])
  useEffect(() => { reload() }, [reload])
  if (!t) return <div className="text-dim">Φόρτωση…</div>

  return (
    <>
      <div className="mb-2 text-[12px] font-bold uppercase tracking-[.1em] text-dim"><Link to="/admin" className="hover:text-white">Διοργανώσεις</Link> · {t.name}</div>
      <PageTitle a={t.name} right={<a href={`/tournaments/${t.slug}`} target="_blank" rel="noreferrer" className="text-[12px] font-bold uppercase tracking-[.08em] text-orange">Δες στο site ↗</a>} />
      <div className="mb-6 flex flex-wrap gap-2">{TABS.map(x => <button key={x} onClick={() => setTab(x)} className={cn('rounded-full border px-4 py-2 text-[13px] font-bold', tab === x ? 'border-white bg-white text-bg' : 'border-line text-dim hover:text-white')}>{x}</button>)}</div>
      {tab === 'Στοιχεία' && <Details t={t} onSaved={() => { reload(); say('Αποθηκεύτηκε') }} onError={say} />}
      {tab === 'Κατηγορίες' && <Categories tid={id} say={say} />}
      {tab === 'Ομάδες' && <Teams tid={id} say={say} />}
      {tab === 'Αγώνες & σκορ' && <Results tid={id} say={say} />}
      {tab === 'Πρόγραμμα' && <Scheduler tid={id} />}
      <Toast msg={toast} />
    </>
  )
}

// ---------- Στοιχεία ----------
function Details({ t, onSaved, onError }: { t: NonNullable<Awaited<ReturnType<typeof api.getTournament>>>; onSaved: () => void; onError: (m: string) => void }) {
  const [f, setF] = useState({ ...t })
  const [cities, setCities] = useState<Array<{ id: string; name: string }>>([])
  const [days, setDays] = useState<Awaited<ReturnType<typeof api.listDays>>>([])
  useEffect(() => { api.listCities().then(setCities).catch(() => {}); api.listDays(t.id).then(setDays).catch(() => {}) }, [t.id])
  const save = async () => {
    try {
      const { id: _id, settings_json: _s, ...rest } = f
      await api.updateTournament(t.id, rest)
      for (const d of days) await api.updateDay(d.id, { start_time: d.start_time, end_time: d.end_time, courts: d.courts })
      onSaved()
    } catch (e) { onError((e as Error).message) }
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="card grid gap-4 p-5 md:grid-cols-2">
        <Field label="Όνομα"><Input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Όνομα (EN)"><Input value={f.name_en ?? ''} onChange={e => setF({ ...f, name_en: e.target.value })} /></Field>
        <Field label="Slug (URL)"><Input value={f.slug} onChange={e => setF({ ...f, slug: e.target.value })} /></Field>
        <Field label="Πόλη"><Select value={f.city_id ?? ''} onChange={e => setF({ ...f, city_id: e.target.value || null })}><option value="">—</option>{cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <Field label="Γήπεδο / χώρος"><Input value={f.venue ?? ''} onChange={e => setF({ ...f, venue: e.target.value })} /></Field>
        <Field label="Διεύθυνση"><Input value={f.address ?? ''} onChange={e => setF({ ...f, address: e.target.value })} /></Field>
        <Field label="Από"><Input type="date" value={f.starts_on} onChange={e => setF({ ...f, starts_on: e.target.value })} /></Field>
        <Field label="Έως"><Input type="date" value={f.ends_on} onChange={e => setF({ ...f, ends_on: e.target.value })} /></Field>
        <Field label="Κατάσταση"><Select value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>{STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
        <Field label="Προθεσμία δηλώσεων"><Input type="datetime-local" value={(f.registration_deadline ?? '').slice(0, 16)} onChange={e => setF({ ...f, registration_deadline: e.target.value || null })} /></Field>
        <ImageField value={f.cover_url} onChange={v => setF({ ...f, cover_url: v })} folder="covers" label="Εικόνα εξωφύλλου — φωτογραφία γηπέδου, όχι αφίσα (μπαίνει πίσω από τον τίτλο)" className="md:col-span-2" />
        <ImageField value={f.poster_url} onChange={v => setF({ ...f, poster_url: v })} folder="posters" label="Αφίσα διοργάνωσης — κατακόρυφη, εμφανίζεται στις κάρτες του Προγράμματος και των Ομάδων" className="md:col-span-2" />
        <label className="flex items-center gap-3 text-[14px] md:col-span-2"><input type="checkbox" checked={f.is_public} onChange={e => setF({ ...f, is_public: e.target.checked })} className="h-4 w-4" /> Δημόσιο — φαίνεται στο site και στο app</label>
        <div className="md:col-span-2"><Btn onClick={save}>Αποθήκευση</Btn></div>
      </div>
      <div className="card p-5">
        <div className="kicker mb-3">Ημέρες</div>
        {days.map((d, i) => (
          <div key={d.id} className="mb-3 grid grid-cols-[1fr_1fr_60px] gap-2 border-t border-line pt-3 text-[13px]">
            <div className="col-span-3 font-bold">Ημέρα {d.day_index} · <span className="mono text-dim">{d.date}</span></div>
            <Input type="time" value={d.start_time.slice(0, 5)} onChange={e => setDays(days.map((x, j) => j === i ? { ...x, start_time: e.target.value } : x))} />
            <Input type="time" value={d.end_time.slice(0, 5)} onChange={e => setDays(days.map((x, j) => j === i ? { ...x, end_time: e.target.value } : x))} />
            <Input type="number" min={1} max={6} value={d.courts} onChange={e => setDays(days.map((x, j) => j === i ? { ...x, courts: +e.target.value } : x))} />
          </div>
        ))}
        <div className="text-[12px] text-mute">Έναρξη · λήξη · γήπεδα. Αποθηκεύονται με το κουμπί αριστερά.</div>
      </div>
    </div>
  )
}

// ---------- Κατηγορίες ----------
function Categories({ tid, say }: { tid: string; say: (m: string) => void }) {
  const [all, setAll] = useState<Awaited<ReturnType<typeof api.listCategories>>>([])
  const [mine, setMine] = useState<Awaited<ReturnType<typeof api.listTournamentCategories>>>([])
  const [teams, setTeams] = useState<api.TeamRow[]>([])
  const [sched, setSched] = useState<Record<string, { split?: number }>>({})
  const load = useCallback(() => api.listTournamentCategories(tid).then(setMine).catch(e => say(e.message)), [tid, say])
  useEffect(() => {
    api.listCategories().then(setAll).catch(() => {}); load()
    api.listTeams(tid).then(setTeams).catch(() => {})
    api.getTournament(tid).then(t => setSched(((t.settings_json as { scheduler?: { cats?: Record<string, { split?: number }> } })?.scheduler?.cats) ?? {})).catch(() => {})
  }, [tid, load])
  const count = (cid: string) => teams.filter(t => t.category_id === cid && t.status === 'active').length
  const groupsOf = (cid: string) => {
    const n = count(cid); const sp = splits(n); if (!n) return '—'; if (!sp.length) return n < 2 ? 'μόνο 1 ομάδα' : 'χωρίς χωρισμό'
    const s = sp[sched[cid]?.split ?? 0] ?? sp[0]
    const desc = s.five ? '1×5' : s.sizes[0] === 2 ? 'τελικός' : `${s.a ? s.a + '×4' : ''}${s.a && s.b ? ' + ' : ''}${s.b ? s.b + '×3' : ''}`
    return `${s.G} (${desc})`
  }
  const has = (cid: string) => mine.find(x => x.category_id === cid)
  const toggle = async (cid: string) => {
    try {
      if (has(cid)) await api.removeTournamentCategory(tid, cid)
      else await api.upsertTournamentCategory(tid, { category_id: cid, format: 'rr4', qualifiers: null, sort_order: all.find(c => c.id === cid)?.sort_order ?? 0 })
      load()
    } catch (e) { say((e as Error).message) }
  }
  const patch = async (cid: string, p: Partial<{ format: string; qualifiers: number | null; max_teams: number | null }>) => {
    const cur = has(cid)!
    try { await api.upsertTournamentCategory(tid, { category_id: cid, format: cur.format, qualifiers: cur.qualifiers, max_teams: cur.max_teams, sort_order: cur.sort_order, ...p }); load() } catch (e) { say((e as Error).message) }
  }
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-[14px]">
        <thead><tr className="text-left text-[11px] uppercase tracking-[.12em] text-dim"><th className="px-4 py-3">Κατηγορία</th><th className="px-4 py-3">Στη διοργάνωση</th><th className="px-4 py-3">Ομάδες</th><th className="px-4 py-3">Όμιλοι</th><th className="px-4 py-3">Νοκ-άουτ (προεπιλογή)</th><th className="px-4 py-3">Μέγ. ομάδες</th></tr></thead>
        <tbody>{all.map(c => { const m = has(c.id); return (
          <tr key={c.id} className="border-t border-line">
            <td className="px-4 py-3 font-semibold">{c.label}</td>
            <td className="px-4 py-3"><input type="checkbox" checked={!!m} onChange={() => toggle(c.id)} className="h-4 w-4" /></td>
            <td className="mono px-4 py-3">{m ? count(c.id) : '—'}</td>
            <td className={cn('px-4 py-3', m && count(c.id) < 2 && 'text-red')}>{m ? groupsOf(c.id) : '—'}</td>
            <td className="px-4 py-3"><Select disabled={!m} value={m?.qualifiers ?? ''} onChange={e => patch(c.id, { qualifiers: e.target.value ? +e.target.value : null })}><option value="">Χωρίς νοκ-άουτ</option>{[2, 4, 8, 16].map(n => <option key={n} value={n}>{n}</option>)}</Select></td>
            <td className="px-4 py-3"><Input disabled={!m} type="number" min={2} value={m?.max_teams ?? ''} onChange={e => patch(c.id, { max_teams: e.target.value ? +e.target.value : null })} placeholder="—" /></td>
          </tr>) })}</tbody>
      </table>
      <div className="px-4 py-3 text-[12px] text-mute">Ο χωρισμός σε ομίλους και το format (όλοι με όλους / σταυρωτό) ορίζονται στο «Πρόγραμμα → Όμιλοι», ανάλογα με τις ομάδες που δηλώθηκαν.</div>
    </div>
  )
}

// ---------- Ομάδες ----------
function Teams({ tid, say }: { tid: string; say: (m: string) => void }) {
  const [cats, setCats] = useState<Awaited<ReturnType<typeof api.listTournamentCategories>>>([])
  const [all, setAll] = useState<Awaited<ReturnType<typeof api.listCategories>>>([])
  const [teams, setTeams] = useState<api.TeamRow[]>([])
  const [cat, setCat] = useState(''); const [paste, setPaste] = useState('')
  const load = useCallback(() => api.listTeams(tid).then(setTeams).catch(e => say(e.message)), [tid, say])
  useEffect(() => { api.listCategories().then(setAll).catch(() => {}); api.listTournamentCategories(tid).then(c => { setCats(c); if (c[0]) setCat(c[0].category_id) }).catch(() => {}); load() }, [tid, load])
  const label = (cid: string) => all.find(c => c.id === cid)?.label ?? cid
  const add = async () => {
    const names = paste.split('\n').map(s => s.trim()).filter(Boolean)
    if (!cat || !names.length) return
    try { await api.addTeams(tid, names.map(name => ({ category_id: cat, name }))); setPaste(''); say(`Προστέθηκαν ${names.length}`); load() } catch (e) { say((e as Error).message) }
  }
  const setStatus = async (id: string, status: string) => { try { await api.updateTeam(id, { status }); load() } catch (e) { say((e as Error).message) } }
  const checkin = async (t: api.TeamRow) => { try { await api.updateTeam(t.id, { checked_in_at: t.checked_in_at ? null : new Date().toISOString() }); load() } catch (e) { say((e as Error).message) } }
  const remove = async (id: string) => { if (!confirm('Διαγραφή ομάδας;')) return; try { await api.deleteTeam(id); load() } catch (e) { say((e as Error).message) } }
  const byCat = useMemo(() => cats.map(c => ({ c, list: teams.filter(t => t.category_id === c.category_id) })), [cats, teams])
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
      <div className="card p-5">
        <div className="kicker mb-3">Προσθήκη ομάδων</div>
        <Field label="Κατηγορία" className="mb-3"><Select value={cat} onChange={e => setCat(e.target.value)}>{cats.map(c => <option key={c.category_id} value={c.category_id}>{label(c.category_id)}</option>)}</Select></Field>
        <Field label="Ονόματα — ένα ανά γραμμή (επικόλληση από Excel/PDF)"><textarea value={paste} onChange={e => setPaste(e.target.value)} rows={10} className="w-full rounded-[10px] border border-line bg-transparent px-3 py-2 text-[14px] outline-none focus:border-white/30" /></Field>
        <div className="mt-3 flex items-center justify-between"><span className="text-[12px] text-mute">{paste.split('\n').filter(s => s.trim()).length} ομάδες</span><Btn onClick={add}>Προσθήκη</Btn></div>
        <div className="mt-4 text-[12px] text-mute">Οι διπλές (ίδιο όνομα, ίδια κατηγορία) αγνοούνται. Οι δηλώσεις από το site μπαίνουν ως «Εκκρεμεί» και τις εγκρίνεις εδώ.</div>
      </div>
      <div className="flex flex-col gap-4">
        {byCat.map(({ c, list }) => (
          <div key={c.category_id} className="card p-4">
            <div className="mb-2 flex items-center justify-between"><b className="disp text-[24px]">{label(c.category_id)}</b><span className="text-[12px] font-bold uppercase tracking-[.1em] text-dim">{list.filter(t => t.status === 'active').length} ενεργές · {list.filter(t => t.status === 'pending').length} εκκρεμείς · {list.filter(t => t.status === 'waitlist').length} λίστα</span></div>
            {list.map(t => (
              <div key={t.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 border-t border-line py-2 text-[14px]">
                <span className={cn('font-semibold', t.status !== 'active' && 'text-dim')}>{t.name}{t.city && <span className="ml-2 text-[12px] font-normal text-mute">{t.city}</span>}</span>
                <Select value={t.status} onChange={e => setStatus(t.id, e.target.value)} className="w-[130px] py-1 text-[12px]"><option value="pending">Εκκρεμεί</option><option value="active">Ενεργή</option><option value="waitlist">Λίστα αναμονής</option><option value="removed">Αποσύρθηκε</option></Select>
                <button onClick={() => checkin(t)} className={cn('rounded-lg border px-2 py-1 text-[11px] font-bold uppercase tracking-[.08em]', t.checked_in_at ? 'border-ok text-ok' : 'border-line text-dim')}>{t.checked_in_at ? '✓ Check-in' : 'Check-in'}</button>
                <button onClick={() => remove(t.id)} className="text-[12px] text-mute hover:text-red">✕</button>
              </div>
            ))}
            {!list.length && <div className="text-[13px] text-mute">Καμία ομάδα.</div>}
          </div>
        ))}
        {!cats.length && <div className="card p-6 text-dim">Πρόσθεσε πρώτα κατηγορίες στη διοργάνωση.</div>}
      </div>
    </div>
  )
}

// ---------- Αγώνες & σκορ ----------
function Results({ tid, say }: { tid: string; say: (m: string) => void }) {
  const [ms, setMs] = useState<api.MatchRowA[]>([])
  const [teams, setTeams] = useState<api.TeamRow[]>([])
  const [days, setDays] = useState<Awaited<ReturnType<typeof api.listDays>>>([])
  const [day, setDay] = useState<string>('')
  const [draft, setDraft] = useState<Record<string, { h: string; a: string }>>({})
  const load = useCallback(() => api.listMatches(tid).then(setMs).catch(e => say(e.message)), [tid, say])
  useEffect(() => { load(); api.listTeams(tid).then(setTeams).catch(() => {}); api.listDays(tid).then(d => { setDays(d); if (d[0]) setDay(d[0].id) }).catch(() => {}) }, [tid, load])
  const name = (id: string | null, label: string | null) => teams.find(t => t.id === id)?.name ?? label ?? 'TBD'
  const list = ms.filter(m => m.day_id === day)
  const save = async (m: api.MatchRowA, status: 'scheduled' | 'live' | 'final') => {
    const d = draft[m.id] ?? { h: String(m.home_score ?? ''), a: String(m.away_score ?? '') }
    const h = d.h === '' ? null : +d.h, a = d.a === '' ? null : +d.a
    if (status === 'final' && (h == null || a == null)) return say('Βάλε και τα δύο σκορ')
    try { await api.setScore(m.id, h, a, status); load(); say(status === 'final' ? 'Τελικό' : status === 'live' ? 'Live' : 'Επαναφορά') } catch (e) { say((e as Error).message) }
  }
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">{days.map(d => <button key={d.id} onClick={() => setDay(d.id)} className={cn('rounded-full border px-4 py-2 text-[13px] font-bold', day === d.id ? 'border-white bg-white text-bg' : 'border-line text-dim')}>Ημέρα {d.day_index} · {d.date}</button>)}</div>
      <div className="card overflow-hidden">
        {list.map(m => {
          const d = draft[m.id] ?? { h: String(m.home_score ?? ''), a: String(m.away_score ?? '') }
          return (
            <div key={m.id} className={cn('grid grid-cols-[70px_1fr_60px_24px_60px_1fr_auto] items-center gap-2 border-t border-line px-4 py-2 text-[14px]', m.status === 'live' && 'bg-orange/10', m.status === 'final' && 'opacity-80')}>
              <div className="mono text-[13px]"><b>{(m.slot_time ?? '').slice(0, 5)}</b><div className="text-[11px] text-dim">Γ{m.court} · {m.label}</div></div>
              <div className="text-right font-semibold">{name(m.home_team_id, m.home_label)}</div>
              <Input type="number" min={0} value={d.h} onChange={e => setDraft({ ...draft, [m.id]: { ...d, h: e.target.value } })} className="mono px-2 py-1 text-center" />
              <div className="text-center text-mute">–</div>
              <Input type="number" min={0} value={d.a} onChange={e => setDraft({ ...draft, [m.id]: { ...d, a: e.target.value } })} className="mono px-2 py-1 text-center" />
              <div className="font-semibold">{name(m.away_team_id, m.away_label)}</div>
              <div className="flex gap-1">
                <Btn variant="orange" className="px-3 py-1 text-[11px]" onClick={() => save(m, 'live')}>Live</Btn>
                <Btn className="px-3 py-1 text-[11px]" onClick={() => save(m, 'final')}>Τελικό</Btn>
                {m.status !== 'scheduled' && <Btn variant="ghost" className="px-2 py-1 text-[11px]" onClick={() => save(m, 'scheduled')}>↺</Btn>}
              </div>
            </div>
          )
        })}
        {!list.length && <div className="p-6 text-dim">Δεν υπάρχουν αγώνες για αυτή τη μέρα — φτιάξε πρόγραμμα από την καρτέλα «Πρόγραμμα».</div>}
      </div>
      <div className="mt-3 text-[12px] text-mute">Το «Τελικό» ενημερώνει αμέσως βαθμολογίες, site και app (realtime). Οι νικητές των νοκ-άουτ περνούν στον επόμενο γύρο όταν κλείσει ο αγώνας.</div>
    </>
  )
}
