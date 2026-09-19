import { useCallback, useEffect, useMemo, useState } from 'react'
import * as E from '@/scheduler/engine'
import { fromDb, loadInputs, publish, saveSched } from '@/scheduler/bridge'
import { Btn, Select, Toast } from '../ui'
import { cn } from '@/lib/cn'

const TABS = ['Ρυθμίσεις', 'Όμιλοι', 'Πρόγραμμα']

/** Scheduler tab: same engine and options as the prototype, reading teams/days from the DB and publishing to groups/matches. */
export function Scheduler({ tid }: { tid: string }) {
  const [st, setSt] = useState<E.SchedState | null>(null)
  const [tab, setTab] = useState(TABS[0])
  const [toast, setToast] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [tick, setTick] = useState(0)                 // bump to re-render after mutating st in place
  const say = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(null), 3000) }, [])
  const mutate = (fn: (s: E.SchedState) => void) => { if (!st) return; fn(st); setTick(t => t + 1) }

  useEffect(() => { loadInputs(tid).then(i => setSt(fromDb(i))).catch(e => say(e.message)) }, [tid, say])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const res = useMemo(() => st ? E.schedule(st) : null, [st, tick])

  if (!st) return <div className="text-dim">Φόρτωση ομάδων…</div>
  if (!st.categories.length) return <div className="card p-6 text-dim">Δεν υπάρχουν ενεργές ομάδες. Πρόσθεσε ομάδες στην καρτέλα «Ομάδες» πρώτα.</div>

  const req = E.requiredAll(st); const cap = E.totalSlots(st)
  const save = async () => { setBusy(true); try { await saveSched(tid, st); say('Οι ρυθμίσεις αποθηκεύτηκαν') } catch (e) { say((e as Error).message) } setBusy(false) }
  const doPublish = async () => {
    if (!res) return
    if (res.all.unscheduled.length) return say('Υπάρχουν αγώνες εκτός προγράμματος — δεν δημοσιεύεται')
    if (!confirm('Θα αντικατασταθούν όμιλοι και αγώνες της διοργάνωσης. Τα σκορ κρατιούνται όπου το ζευγάρι παραμένει ίδιο· όπου άλλαξε ο αντίπαλος χάνονται. Συνέχεια;')) return
    setBusy(true)
    try { await saveSched(tid, st); const r = await publish(tid, st, res.all); say(`Δημοσιεύτηκαν ${r.groups} όμιλοι και ${r.matches} αγώνες` + (r.restored || r.lost ? ` · ${r.restored} σκορ διατηρήθηκαν${r.lost ? `, ${r.lost} χάθηκαν` : ''}` : '')) } catch (e) { say((e as Error).message) }
    setBusy(false)
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">{TABS.map(x => <button key={x} onClick={() => setTab(x)} className={cn('rounded-full border px-4 py-2 text-[13px] font-bold', tab === x ? 'border-white bg-white text-bg' : 'border-line text-dim hover:text-white')}>{x}</button>)}</div>
        <div className="flex items-center gap-3 text-[13px]">
          <span className={cn('mono', req.sum > cap && 'text-red')}>{req.sum}{req.complete ? '' : '+'} αγώνες / {cap} θέσεις</span>
          <Btn variant="ghost" onClick={save} disabled={busy}>Αποθήκευση ρυθμίσεων</Btn>
          <Btn variant="orange" onClick={doPublish} disabled={busy || !res || !!res.all.unscheduled.length}>Δημοσίευση προγράμματος</Btn>
        </div>
      </div>
      {tab === 'Ρυθμίσεις' && <SettingsPane st={st} mutate={mutate} />}
      {tab === 'Όμιλοι' && <GroupsPane st={st} mutate={mutate} />}
      {tab === 'Πρόγραμμα' && res && <SchedPane st={st} res={res} mutate={mutate} />}
      <Toast msg={toast} />
    </>
  )
}

// ---------- Ρυθμίσεις ----------
function SettingsPane({ st, mutate }: { st: E.SchedState; mutate: (fn: (s: E.SchedState) => void) => void }) {
  const s = st.settings
  const opt = <T extends string | number>(label: string, value: T, options: Array<[T, string]>, on: (v: T) => void, hint?: string) => (
    <label className="block text-[13px]"><span className="mb-1 block text-dim">{label}</span>
      <Select value={String(value)} onChange={e => on((typeof value === 'number' ? +e.target.value : e.target.value) as T)}>{options.map(([v, l]) => <option key={String(v)} value={String(v)}>{l}</option>)}</Select>
      {hint && <span className="mt-1 block text-[11px] text-mute">{hint}</span>}</label>
  )
  const move = (i: number, dir: -1 | 1) => mutate(x => { const j = i + dir; if (j < 0 || j >= x.categories.length) return; [x.categories[i], x.categories[j]] = [x.categories[j], x.categories[i]] })
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.8fr]">
      <div className="card grid gap-4 p-5">
        <div className="kicker">Κριτήρια</div>
        {opt('Διάρκεια slot', s.slot, [[15, '15΄'], [20, '20΄'], [25, '25΄'], [30, '30΄']], v => mutate(x => { x.settings.slot = v }))}
        {opt('Ροή', s.flow, [['block', 'Κατηγορία-κατηγορία (ολόκληρη, μετά η επόμενη)'], ['mixed', 'Ανακατεμένες (γύρος-γύρος όλες μαζί)']], v => mutate(x => { x.settings.flow = v }))}
        {opt('Νοκ-άουτ', s.ko, [['after', 'Μετά τους ομίλους της μέρας'], ['asap', 'Μόλις τελειώσουν οι όμιλοι της κατηγορίας']], v => mutate(x => { x.settings.ko = v }), 'Προτεραιότητα, όχι απαγόρευση: τα νοκ-άουτ γεμίζουν κενά που αφήνουν οι όμιλοι.')}
        {opt('Ελάχιστο κενό ανάπαυσης', s.gap, [[0, 'Κανένα'], [1, '1 slot'], [2, '2 slots']], v => mutate(x => { x.settings.gap = v }))}
        <label className="flex items-center gap-3 text-[13px]"><input type="checkbox" checked={s.gapSoft} onChange={e => mutate(x => { x.settings.gapSoft = e.target.checked })} /> Back-to-back μόνο αν αλλιώς δεν χωράει το πρόγραμμα</label>
        {opt('Μέγιστο κενό ομάδας', s.maxGap, [[45, '45΄'], [60, '60΄'], [90, '90΄'], [0, 'Χωρίς όριο']], v => mutate(x => { x.settings.maxGap = v }), 'Το επείγον προσπερνά μόνο αγώνες άλλης κατηγορίας.')}
        <label className="block text-[13px]"><span className="mb-1 block text-dim">Τελευταία έναρξη κατηγορίας (εκτός τελευταίας μέρας)</span><input type="time" value={s.latestStart} onChange={e => mutate(x => { x.settings.latestStart = e.target.value })} className="rounded-[10px] border border-line bg-transparent px-3 py-2" /></label>
        <label className="flex items-center gap-3 text-[13px]"><input type="checkbox" checked={s.koTailRule} onChange={e => mutate(x => { x.settings.koTailRule = e.target.checked })} /> Η κατηγορία με τη μεγαλύτερη αλυσίδα νοκ-άουτ να μην κλείνει τη μέρα</label>
        <label className="flex items-center gap-3 text-[13px]"><input type="checkbox" checked={s.sameName} onChange={e => mutate(x => { x.settings.sameName = e.target.checked })} /> Ίδιο όνομα σε δύο κατηγορίες = ίδια ομάδα (όχι ταυτόχρονα)</label>
      </div>
      <div className="card p-5">
        <div className="kicker mb-3">Σειρά κατηγοριών & μέρες</div>
        <div className="mb-2 grid grid-cols-[24px_minmax(200px,1fr)_50px_130px_130px_130px_80px] gap-2 text-[11px] uppercase tracking-[.1em] text-dim"><span /><span>Κατηγορία</span><span>Ομάδες</span><span>Όμιλοι από</span><span>έως</span><span>Νοκ-άουτ</span><span>Q</span></div>
        {st.categories.map((c, i) => (
          <div key={c.id} className="grid grid-cols-[24px_minmax(200px,1fr)_50px_130px_130px_130px_80px] items-center gap-2 border-t border-line py-2 text-[13px]">
            <div className="flex flex-col text-[10px] leading-none text-dim"><button onClick={() => move(i, -1)}>▲</button><button onClick={() => move(i, 1)}>▼</button></div>
            <span className="truncate font-semibold"><i className="mr-2 inline-block h-[10px] w-[10px] rounded-sm align-[-1px]" style={{ background: E.catColor(st, i) }} />{c.name}{!c.split && <span title={c.teams.length < 2 ? 'Μόνο μία ομάδα: συγχώνευσέ την με άλλη κατηγορία ή ακύρωσε την κατηγορία.' : 'Δεν βγαίνει χωρισμός σε ομίλους με αυτόν τον αριθμό ομάδων.'} className="ml-2 whitespace-nowrap rounded-full border border-red/60 px-2 py-[1px] text-[10px] font-bold text-red">⚠ {c.teams.length < 2 ? '1 ομάδα' : 'χωρισμός'}</span>}</span>
            <span className="mono">{c.teams.length}</span>
            <Select value={c.day} onChange={e => mutate(x => E.setCatDay(x, c, 'day', e.target.value))} className="py-1 text-[12px]">{s.days.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}</Select>
            <Select value={c.dayTo} onChange={e => mutate(x => E.setCatDay(x, c, 'dayTo', e.target.value))} className="py-1 text-[12px]">{s.days.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}</Select>
            <Select value={c.koDay} onChange={e => mutate(x => E.setCatDay(x, c, 'koDay', e.target.value))} className="py-1 text-[12px]">{s.days.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}</Select>
            <Select value={c.Q ?? ''} disabled={c.teams.length <= 2} onChange={e => mutate(() => { c.Q = e.target.value ? +e.target.value : null })} className="py-1 text-[12px]"><option value="">—</option>{[2, 4, 8, 16].filter(q => q < c.teams.length).map(q => <option key={q} value={q}>{q}</option>)}</Select>
          </div>
        ))}
        <div className="mt-3 text-[12px] text-mute">Η σειρά εδώ είναι η σειρά της μέρας (πρώτη = παίζει πρώτη). Q = πόσες προκρίνονται στα νοκ-άουτ.</div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {s.days.map(d => { const r = E.dayRequired(st, d); const cap = E.daySlots(st, d); return <div key={d.id} className={cn('rounded-[10px] border border-line px-3 py-2 text-[13px]', r.sum > cap && 'border-red')}><b>{d.label}</b> · {d.start}–{d.end} · {d.courts} γήπεδα<div className="mono text-[12px] text-dim">{r.grp} όμιλοι + {r.ko} νοκ-άουτ = {r.sum}{r.complete ? '' : '+'} / {cap} θέσεις</div></div> })}
        </div>
      </div>
    </div>
  )
}

// ---------- Όμιλοι ----------
function GroupsPane({ st, mutate }: { st: E.SchedState; mutate: (fn: (s: E.SchedState) => void) => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {st.categories.map((c, ci) => {
        const sp = E.splits(c.teams.length)
        return (
          <div key={c.id} className="card p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <b className="disp text-[24px]"><i className="mr-2 inline-block h-[10px] w-[10px] rounded-sm" style={{ background: E.catColor(st, ci) }} />{c.name} <span className="font-sans text-[12px] text-dim">{c.teams.length} ομάδες</span></b>
              <div className="flex gap-2">
                <Select value={c.splitIdx ?? 0} onChange={e => mutate(x => E.applySplit(x, c, +e.target.value))} className="py-1 text-[12px]" style={{ width: 'auto' }}>{sp.map((s, i) => <option key={i} value={i}>{s.five ? '1 όμιλος των 5' : s.sizes[0] === 2 ? 'Ένας αγώνας (τελικός)' : `${s.a ? s.a + '×4' : ''}${s.a && s.b ? ' + ' : ''}${s.b ? s.b + '×3' : ''}`}</option>)}</Select>
                <Btn variant="ghost" className="py-1 text-[12px]" onClick={() => mutate(() => E.drawSerpentine(c))}>Κλήρωση</Btn>
              </div>
            </div>
            {!sp.length && <div className="text-[13px] text-red">Δεν βγαίνει χωρισμός με {c.teams.length} ομάδες — συγχώνευσε κατηγορίες ή πρόσθεσε ομάδα.</div>}
            {c.split && <div className="mb-2 flex flex-wrap gap-4 text-[12px]">{[...new Set(c.split.sizes)].map(sz => <label key={sz} className="flex items-center gap-2 whitespace-nowrap">Όμιλοι των {sz}: <Select value={c.format[sz]} onChange={e => mutate(x => { c.format[sz] = e.target.value; E.clearOverridesOf(x, c) })} className="py-1" style={{ width: 'auto' }}>{E.FORMATS_BY_SIZE[sz].map(f => <option key={f} value={f}>{E.FORMATS[f].name} ({E.fmtMatches(f)} αγ.)</option>)}</Select></label>)}</div>}
            <div className="grid gap-2 sm:grid-cols-2">
              {c.groups?.map((g, gi) => (
                <div key={gi} className={cn('rounded-[10px] border border-line p-2', g.length !== c.split!.sizes[gi] && 'border-red')}
                  onDragOver={e => e.preventDefault()} onDrop={e => { const ti = +e.dataTransfer.getData('text/plain'); if (!isNaN(ti)) mutate(() => E.moveTeam(c, ti, gi)) }}>
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-[.1em] text-dim">Όμιλος {E.GREEK[gi]} · {g.length}/{c.split!.sizes[gi]}</div>
                  {g.map(ti => <div key={ti} draggable onDragStart={e => e.dataTransfer.setData('text/plain', String(ti))} className="cursor-grab rounded-md bg-white/5 px-2 py-1 text-[13px]">{c.teams[ti]}</div>)}
                </div>
              ))}
            </div>
            <div className="mt-2 text-[11px] text-mute">Σύρε ομάδα σε άλλον όμιλο για χειροκίνητη αλλαγή.</div>
          </div>
        )
      })}
    </div>
  )
}

// ---------- Πρόγραμμα ----------
function SchedPane({ st, res, mutate }: { st: E.SchedState; res: ReturnType<typeof E.schedule>; mutate: (fn: (s: E.SchedState) => void) => void }) {
  const [sel, setSel] = useState<string | null>(null)
  const { all, warnings } = res
  const drop = (key: string, d: number, t: number, c: number) => mutate(x => E.moveMatch(x, key, d, t, c))
  return (
    <div className="flex flex-col gap-6">
      {all.relaxedForFit && <div className="rounded-[10px] border border-orange/60 bg-orange/10 px-4 py-2 text-[13px]">Για να χωρέσουν όλοι οι αγώνες επιτράπηκαν λίγα back-to-back (σημειωμένα με ⚡).</div>}
      {all.unscheduled.length > 0 && <div className="rounded-[10px] border border-red/60 bg-red/10 px-4 py-2 text-[13px]">{all.unscheduled.length} αγώνες δεν χωράνε — πρόσθεσε γήπεδο/ώρες ή άλλαξε μέρες κατηγοριών.</div>}
      <div className="flex flex-wrap gap-3 text-[12px]">{st.categories.map((c, ci) => <span key={c.id} className="flex items-center gap-1"><i className="inline-block h-[10px] w-[10px] rounded-sm" style={{ background: E.catColor(st, ci) }} />{c.name}</span>)}
        {Object.keys(st.overrides ?? {}).length > 0 && <button onClick={() => mutate(x => { x.overrides = {} })} className="ml-auto text-orange">Αναίρεση χειροκίνητων ({Object.keys(st.overrides!).length})</button>}</div>
      {all.grids.map((g, di) => {
        const d = st.settings.days[di]; const T = (t: number) => E.hhmm(E.mins(d.start) + t * st.settings.slot)
        const stats = E.dayStats(st, g, d)
        return (
          <div key={d.id}>
            <div className="disp mb-2 text-[28px]">{d.label} <span className="font-sans text-[12px] text-dim">{d.start}–{d.end} · {d.courts} γήπεδα</span></div>
            {all.dayOrderNotes[di] && <div className="mb-2 text-[12px] text-dim">{all.dayOrderNotes[di]}</div>}
            {warnings[di] && <div className="mb-2 rounded-[10px] border border-red/60 bg-red/10 px-3 py-2 text-[12px]">{warnings[di].map((w, i) => <div key={i}>⚠ {w}</div>)}</div>}
            <div className="card overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead><tr><th className="w-[60px] px-2 py-1 text-left text-dim">Ώρα</th>{Array.from({ length: d.courts }, (_, c) => <th key={c} className="px-2 py-1 text-left text-dim">Γήπεδο {c + 1}</th>)}</tr></thead>
                <tbody>
                  {g.grid.map((row, t) => (
                    <tr key={t} className="border-t border-line">
                      <td className="mono px-2 py-1 text-dim">{T(t)}</td>
                      {row.map((m, c) => {
                        const key = m ? E.matchKey(st, m) : null
                        return (
                          <td key={c} className={cn('h-[44px] px-1 py-[2px] align-top', !m && 'bg-white/[.02]')}
                            onDragOver={e => e.preventDefault()} onDrop={e => { const k = e.dataTransfer.getData('text/plain'); if (k) drop(k, di, t, c) }}
                            onClick={() => { if (sel && sel !== key) { drop(sel, di, t, c); setSel(null) } }}>
                            {m && (() => { const l = E.matchLabel(st, m); return (
                              <div draggable onDragStart={e => e.dataTransfer.setData('text/plain', key!)} onClick={e => { e.stopPropagation(); setSel(sel === key ? null : key) }}
                                className={cn('cursor-grab rounded-md border-l-[4px] bg-white/5 px-2 py-1', sel === key && 'ring-2 ring-orange', m.bad && 'bg-red/20', st.overrides?.[key!] && 'border-dashed border-t border-r border-b border-white/30')}
                                style={{ borderLeftColor: E.catColor(st, m.cat) }}>
                                <div className="text-[10px] uppercase tracking-[.06em] text-dim">{l.top}{m.b2b ? ' ⚡' : ''}</div>
                                <div className="font-semibold">{l.main}</div>
                              </div>) })()}
                          </td>)
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {stats.cats.length > 0 && (
              <table className="mt-2 w-full text-[12px]">
                <thead><tr className="text-left text-dim"><th className="px-2 py-1">Κατηγορία</th><th className="px-2 py-1">Πρώτος αγώνας</th><th className="px-2 py-1">Τέλος ομίλων</th><th className="px-2 py-1">Νοκ-άουτ από</th><th className="px-2 py-1">Ελεύθεροι</th><th className="px-2 py-1">Μέσο κενό</th><th className="px-2 py-1">Μέγιστο κενό</th></tr></thead>
                <tbody>{stats.cats.map(s => <tr key={s.ci} className="border-t border-line"><td className="px-2 py-1 font-semibold"><i className="mr-2 inline-block h-[10px] w-[10px] rounded-sm" style={{ background: E.catColor(st, s.ci) }} />{s.name}</td><td className="mono px-2 py-1">{s.first}</td><td className="mono px-2 py-1">{s.lastGroup ?? '—'}</td><td className="mono px-2 py-1">{s.firstKo ?? '—'}</td><td className="mono px-2 py-1">{s.free}</td><td className="mono px-2 py-1">{s.avgGap != null ? s.avgGap + '′' : '—'}</td><td className={cn('mono px-2 py-1', s.over && 'text-red')}>{s.maxGap != null ? s.maxGap + '′' : '—'}{s.over ? ' ⚠' : ''}</td></tr>)}</tbody>
              </table>
            )}
          </div>
        )
      })}
      <div className="text-[12px] text-mute">Σύρε αγώνα σε άλλο κελί (ή κλικ στον αγώνα και μετά κλικ στο κελί). Οι χειροκίνητες αλλαγές (διακεκομμένο πλαίσιο) κρατιούνται σε κάθε νέο υπολογισμό και ελέγχονται για back-to-back, ίδια ομάδα σε δύο γήπεδα και σειρά γύρων.</div>
    </div>
  )
}
