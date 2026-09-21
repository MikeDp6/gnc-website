// Bridge between the scheduler engine and the database.
// fromDb: tournament rows → SchedState (settings from settings_json, categories from tournament_categories, teams from teams).
// toRows: engine result → rows for groups / group_teams / matches.
import * as E from './engine'
import { supabase } from '@/lib/supabase'

const sb = () => { if (!supabase) throw new Error('Supabase not configured'); return supabase }
const run = async <T,>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> => { const { data, error } = await p; if (error) throw new Error(error.message); return data as T }

export interface DbDay { id: string; day_index: number; date: string; start_time: string; end_time: string; courts: number }
export interface DbTeam { id: string; category_id: string; name: string; status: string }
export interface DbTc { category_id: string; format: string; qualifiers: number | null; sort_order: number }

const DAYNAMES = ['Κυρ', 'Δευ', 'Τρί', 'Τετ', 'Πέμ', 'Παρ', 'Σάβ']
const dayLabel = (d: DbDay) => { const D = new Date(d.date + 'T00:00:00'); return `${DAYNAMES[D.getDay()]} ${D.getDate()}/${D.getMonth() + 1}` }

/** Persisted scheduler state lives in tournaments.settings_json.scheduler (settings + per-category choices + overrides). */
export interface SavedSched { settings?: Partial<E.Settings>; cats?: Record<string, { split?: number; format?: Record<number, string>; Q?: number | null; day?: number; dayTo?: number; koDay?: number; groups?: string[][]; seeded?: boolean }>; overrides?: Record<string, E.Override>; order?: string[] }

export interface DbSeed { team_id: string; points: number }

export async function loadInputs(tid: string) {
  const [days, teams, tcs, cats, tour, seeds] = await Promise.all([
    run<DbDay[]>(sb().from('tournament_days').select('id,day_index,date,start_time,end_time,courts').eq('tournament_id', tid).order('day_index')),
    run<DbTeam[]>(sb().from('teams').select('id,category_id,name,status').eq('tournament_id', tid).eq('status', 'active').order('name')),
    run<DbTc[]>(sb().from('tournament_categories').select('category_id,format,qualifiers,sort_order').eq('tournament_id', tid).order('sort_order')),
    run<Array<{ id: string; label: string; color_key: string }>>(sb().from('categories').select('id,label,color_key')),
    run<{ settings_json: Record<string, unknown> }>(sb().from('tournaments').select('settings_json').eq('id', tid).single()),
    // η όψη μπορεί να μην έχει τρέξει ακόμα· η κλήρωση απλώς πέφτει πίσω στην τυχαία σειρά
    run<DbSeed[]>(sb().from('team_seed').select('team_id,points').eq('tournament_id', tid)).catch(() => [] as DbSeed[]),
  ])
  return { days, teams, tcs, cats, seeds, saved: (tour.settings_json?.scheduler ?? null) as SavedSched | null }
}

const COLOR: Record<string, string> = { u11: '#0B57C7', u13: '#D86F0C', u15: '#1E7A4D', u18: '#8E24AA', o18: '#0097A7', o35: '#C91016' }

/** Build the engine state from DB rows, re-applying whatever the admin saved last time (splits, groups, days, overrides). */
export function fromDb(inp: Awaited<ReturnType<typeof loadInputs>>): E.SchedState {
  const days: E.Day[] = inp.days.map(d => ({ id: d.id, label: dayLabel(d), start: d.start_time.slice(0, 5), end: d.end_time.slice(0, 5), courts: d.courts }))
  const settings: E.Settings = { ...E.defaultSettings(days), ...(inp.saved?.settings ?? {}), days }
  const st: E.SchedState = { settings, categories: [], overrides: inp.saved?.overrides ?? {} }
  const order = inp.saved?.order
  const tcs = [...inp.tcs].sort((a, b) => order ? order.indexOf(a.category_id) - order.indexOf(b.category_id) : a.sort_order - b.sort_order)
  for (const tc of tcs) {
    const meta = inp.cats.find(c => c.id === tc.category_id)
    const teams = inp.teams.filter(t => t.category_id === tc.category_id)
    if (!teams.length) continue
    const c = E.newCat(st, meta?.label ?? tc.category_id, tc.category_id)
    c.color = COLOR[meta?.color_key ?? ''] ?? undefined
    c.teams = teams.map(t => t.name); c.teamIds = teams.map(t => t.id)
    const seedOf = new Map(inp.seeds.map(x => [x.team_id, x.points]))
    c.seeds = teams.map(t => seedOf.get(t.id) ?? 0)
    c.seeded = c.seeds.some(x => x > 0)      // χωρίς ιστορικό δεν υπάρχει τίποτα να σπείρεις
    const s = inp.saved?.cats?.[tc.category_id]
    if (s?.day != null && days[s.day]) c.day = days[s.day].id
    if (s?.dayTo != null && days[s.dayTo]) c.dayTo = days[s.dayTo].id
    if (s?.koDay != null && days[s.koDay]) c.koDay = days[s.koDay].id
    const sp = E.splits(c.teams.length)
    if (sp.length) {
      const idx = s?.split != null && sp[s.split] ? s.split : 0
      E.applySplit(st, c, idx)
      if (s?.format) c.format = { ...c.format, ...s.format }
      // restore saved group composition (by team id) when it still matches the split
      if (s?.groups && c.groups && s.groups.length === c.groups.length) {
        const byId = new Map(c.teamIds.map((id, i) => [id, i]))
        const g = s.groups.map(ids => ids.map(id => byId.get(id)).filter((x): x is number => x != null))
        const all = g.flat(); if (all.length === c.teams.length && new Set(all).size === all.length) c.groups = g
      }
      if (s?.seeded !== undefined) c.seeded = s.seeded
      c.Q = s?.Q !== undefined ? s.Q : (tc.qualifiers ?? null)
      if (c.Q && c.Q >= c.teams.length) c.Q = null   // KO of everyone is pointless; 2 teams = one match
    }
    st.categories.push(c)
  }
  return st
}

/** Serialise the admin's choices for settings_json.scheduler. */
export function toSaved(st: E.SchedState): SavedSched {
  const { days: _d, ...settings } = st.settings
  const cats: SavedSched['cats'] = {}
  st.categories.forEach(c => { cats![c.id] = { split: c.splitIdx, format: c.format, Q: c.Q, seeded: c.seeded, day: E.dayIdx(st, c.day), dayTo: E.dayIdx(st, c.dayTo), koDay: E.dayIdx(st, c.koDay), groups: c.groups?.map(g => g.map(i => c.teamIds![i])) } })
  return { settings, cats, overrides: st.overrides ?? {}, order: st.categories.map(c => c.id) }
}
export async function saveSched(tid: string, st: E.SchedState) {
  const cur = await run<{ settings_json: Record<string, unknown> }>(sb().from('tournaments').select('settings_json').eq('id', tid).single())
  await run(sb().from('tournaments').update({ settings_json: { ...(cur.settings_json ?? {}), scheduler: toSaved(st) } }).eq('id', tid))
}

export const bracketPair = E.bracketPair

interface PrevMatch { id: string; code: string | null; category_id: string; group_id: string | null; home_team_id: string | null; away_team_id: string | null; home_score: number | null; away_score: number | null; status: string }

/** The draw of a category, as a string: groups in order, each listing its teams in seed order.
 *  Identical strings mean every fixture of that category is literally the same match as before. */
const drawKey = (groups: string[][]) => groups.map(g => g.join(',')).join(' | ')

/** A fixture is "the same match" when the same two teams of the same category meet again **in the same
 *  stage**: a group game and a semifinal between the same two teams are two different matches. */
type Stage = 'g' | 'k'
const pairKey = (cat: string, stage: Stage, h: string, a: string) => cat + '|' + stage + '|' + h + '|' + a
/** Index the played matches by pair; a pair that occurs twice in the same stage is ambiguous and dropped. */
function indexPlayed(played: PrevMatch[]) {
  const m = new Map<string, PrevMatch | null>()
  for (const p of played) { const k = pairKey(p.category_id, p.group_id ? 'g' : 'k', p.home_team_id!, p.away_team_id!); m.set(k, m.has(k) ? null : p) }
  return m
}

/** What a republish is about to do, shown to the admin before anything is touched. */
export interface PublishPlan { kept: string[]; rebuilt: Array<{ name: string; played: number }> }
export interface PublishResult { groups: number; matches: number; kept: number; restored: number; lost: number; cancelled?: boolean }

/**
 * Publish: bring groups / group_teams / matches of the tournament in line with the engine result.
 *
 * A category whose draw and fixtures are exactly what is already stored is **kept**: its rows are never
 * deleted, only moved in day / time / court. Its scores, teams and bracket never leave the table, so no
 * restore step can get them wrong. Only categories that really changed (new draw, other format, other Q,
 * teams added or removed) are deleted and rebuilt, and only their played results go through the
 * best-effort restore. `ask` sees that plan first and can cancel before a single row is written.
 */
export async function publish(tid: string, st: E.SchedState, all: E.BuildResult, ask?: (p: PublishPlan) => boolean): Promise<PublishResult> {
  const s = sb()
  const [prev, oldGroups] = await Promise.all([
    run<PrevMatch[]>(s.from('matches').select('id,code,category_id,group_id,home_team_id,away_team_id,home_score,away_score,status').eq('tournament_id', tid)),
    run<Array<{ id: string; category_id: string; sort_order: number }>>(s.from('groups').select('id,category_id,sort_order').eq('tournament_id', tid)),
  ])
  // scoped to this tournament's groups: group_teams has no tournament column, and an unfiltered
  // read would be paged by the API and silently make an untouched draw look like it had changed
  const oldGt = oldGroups.length
    ? await run<Array<{ group_id: string; team_id: string; seed: number }>>(
        s.from('group_teams').select('group_id,team_id,seed').in('group_id', oldGroups.map(g => g.id)))
    : []
  const played = prev.filter(p => p.home_score != null && p.away_score != null)

  const allMatches: E.SMatch[] = []
  all.grids.forEach(g => g.grid.forEach(row => row.forEach(m => { if (m) allMatches.push(m) })))
  const keyOf = (m: E.SMatch) => E.matchKey(st, m)

  // 1) which categories are untouched
  const oldDraw = new Map<string, string[][]>()
  for (const g of [...oldGroups].sort((x, y) => x.sort_order - y.sort_order)) {
    const list = oldGt.filter(t => t.group_id === g.id).sort((x, y) => x.seed - y.seed).map(t => t.team_id)
    oldDraw.set(g.category_id, [...(oldDraw.get(g.category_id) ?? []), list])
  }
  const sameDraw = new Set<string>(), keep = new Set<string>()
  for (const c of st.categories) {
    if (!c.groups) continue
    if (drawKey(c.groups.map(g => g.map(ti => c.teamIds![ti]))) !== drawKey(oldDraw.get(c.id) ?? [])) continue
    sameDraw.add(c.id)
    const was = prev.filter(p => p.category_id === c.id)
    const now = allMatches.filter(m => st.categories[m.cat].id === c.id).map(keyOf)
    if (!was.length || was.length !== now.length || was.some(p => !p.code)) continue
    const codes = new Set(was.map(p => p.code!))
    if (codes.size === now.length && now.every(k => codes.has(k))) keep.add(c.id)
  }
  const rebuilt = (catId: string) => !keep.has(catId)
  const atRisk = played.filter(p => rebuilt(p.category_id))

  // 2) show the plan before touching anything
  if (ask) {
    const names = new Map(st.categories.map(c => [c.id, c.name]))
    const by = new Map<string, number>()
    atRisk.forEach(p => by.set(p.category_id, (by.get(p.category_id) ?? 0) + 1))
    const plan: PublishPlan = {
      kept: st.categories.filter(c => keep.has(c.id)).map(c => c.name),
      rebuilt: [...by].map(([id, n]) => ({ name: names.get(id) ?? id, played: n })),
    }
    if (!ask(plan)) return { groups: 0, matches: 0, kept: 0, restored: 0, lost: 0, cancelled: true }
  }

  // safety net: keep the raw snapshot in settings_json too, so a bad republish is never a dead end
  if (played.length) {
    const cur = await run<{ settings_json: Record<string, unknown> }>(s.from('tournaments').select('settings_json').eq('id', tid).single())
    await run(s.from('tournaments').update({ settings_json: { ...(cur.settings_json ?? {}), results_backup: { at: new Date().toISOString(), rows: played } } }).eq('id', tid))
  }

  // 3) remove only what gets rebuilt
  const dropM = prev.filter(p => rebuilt(p.category_id)).map(p => p.id)
  for (let i = 0; i < dropM.length; i += 100) await run(s.from('matches').delete().in('id', dropM.slice(i, i + 100)))
  const dropG = oldGroups.filter(g => rebuilt(g.category_id)).map(g => g.id)
  for (let i = 0; i < dropG.length; i += 100) await run(s.from('groups').delete().in('id', dropG.slice(i, i + 100)))

  // 4) groups of the rebuilt categories
  const groupRows: Array<{ id: string; tournament_id: string; category_id: string; name: string; sort_order: number }> = []
  const gtRows: Array<{ group_id: string; team_id: string; seed: number }> = []
  st.categories.forEach(c => {
    if (keep.has(c.id)) return
    c.groups?.forEach((g, gi) => {
      const id = crypto.randomUUID()
      groupRows.push({ id, tournament_id: tid, category_id: c.id, name: 'Όμιλος ' + E.GREEK[gi], sort_order: gi })
      g.forEach((ti, i) => gtRows.push({ group_id: id, team_id: c.teamIds![ti], seed: i + 1 }))
    })
  })
  if (groupRows.length) await run(s.from('groups').insert(groupRows))
  if (gtRows.length) await run(s.from('group_teams').insert(gtRows))
  const gid = (ci: number, gi: number) => {
    const c = st.categories[ci]
    return keep.has(c.id)
      ? oldGroups.find(g => g.category_id === c.id && g.sort_order === gi)!.id
      : groupRows.find(g => g.category_id === c.id && g.sort_order === gi)!.id
  }

  // 5) match rows — kept categories reuse their stored ids, so their KO feeds stay valid as they are
  const oldId = new Map(prev.filter(p => p.code && keep.has(p.category_id)).map(p => [p.code!, p.id]))
  const ids = new Map<string, string>()
  allMatches.forEach(m => { const k = keyOf(m); ids.set(k, oldId.get(k) ?? crypto.randomUUID()) })
  const rows = allMatches.map(m => {
    const c = st.categories[m.cat]; const d = st.settings.days[m.day!]
    const time = E.hhmm(E.mins(d.start) + m.slot! * st.settings.slot)
    const base = { id: ids.get(keyOf(m))!, tournament_id: tid, category_id: c.id, code: keyOf(m), day_id: d.id, court: m.court! + 1, slot_time: time, round: m.round, match_number: m.idx + 1, manual_override: !!st.overrides?.[keyOf(m)] }
    if (!m.ko) {
      const g = c.groups![m.grp!]
      const side = (src: E.Src) => ('pos' in src) ? { team: c.teamIds![g[src.pos]], label: null, source: null }
        : ('win' in src) ? { team: null, label: 'Νικ. Μ' + (src.win + 1), source: 'W:' + ids.get(c.id + '|g' + m.grp + '|' + src.win) }
        : { team: null, label: 'Ηττ. Μ' + (src.lose + 1), source: 'L:' + ids.get(c.id + '|g' + m.grp + '|' + src.lose) }
      const h = side(m.a!), a = side(m.b!)
      const single = c.split!.sizes[m.grp!] === 2 && c.groups!.length === 1
      return { ...base, phase: single ? 'final' : 'group', label: single ? 'Τελικός' : 'Όμιλος ' + E.GREEK[m.grp!], group_id: gid(m.cat, m.grp!), home_team_id: h.team, away_team_id: a.team, home_label: h.label, away_label: a.label, home_source: h.source, away_source: a.source }
    }
    const phase = (m.label ?? '').startsWith('Τελικός') ? 'final' : (m.label ?? '').startsWith('Ημιτελικοί') ? 'sf' : (m.label ?? '').startsWith('Φάση των 8') ? 'qf' : (m.label ?? '').startsWith('Φάση των 16') ? 'r16' : 'qf'
    // first main round without prelims: standard seeded bracket (1–8, 4–5, 3–6, 2–7). Seeds resolve from group standings (DB trigger).
    const k = E.koInfo(c.Q)!
    let hl: string | null, al: string | null, hs: string | null, as: string | null
    if (m.feeds) { [hl, al] = (m.teams ?? '').split(' – '); hs = 'W:' + ids.get(c.id + '|ko|' + m.feeds[0]); as = 'W:' + ids.get(c.id + '|ko|' + m.feeds[1]) }
    else if (m.round === 0 && k.prelim === 0) { const [a, b] = bracketPair(k.P, m.idx); hl = 'Σ' + a; al = 'Σ' + b; hs = 'S:' + a; as = 'S:' + b }
    else { [hl, al] = (m.teams ?? '').split(' – '); hs = null; as = null }
    return { ...base, phase, label: m.label ?? 'Νοκ-άουτ', group_id: null, home_team_id: null, away_team_id: null, home_label: hl ?? null, away_label: al ?? null, home_source: hs, away_source: as }
  })
  const fresh = rows.filter(r => !keep.has(r.category_id))
  const moved = rows.filter(r => keep.has(r.category_id))
  for (let i = 0; i < fresh.length; i += 200) await run(s.from('matches').insert(fresh.slice(i, i + 200)))
  // kept fixtures: same row, same teams, same score — only when and where it is played may change.
  // None of these columns is watched by the result trigger, so nothing propagates or resolves again.
  for (let i = 0; i < moved.length; i += 10) {
    await Promise.all(moved.slice(i, i + 10).map(r => run(s.from('matches')
      .update({ day_id: r.day_id, court: r.court, slot_time: r.slot_time, round: r.round, match_number: r.match_number, manual_override: r.manual_override })
      .eq('id', r.id))))
  }

  // 6) rebuilt categories: put back what can be proven to be the same match, chronologically, with a
  //    plain update per match — so each result runs through the DB trigger as if typed in again.
  //    By code only for group games of an unchanged draw; everything else needs the same two teams
  //    in the same stage. A knockout game never inherits a group result.
  const byCode = new Map(atRisk.filter(p => p.code).map(p => [p.code!, p]))
  const byPair = indexPlayed(atRisk.filter(p => p.home_team_id && p.away_team_id))
  const freshIdx = new Set(fresh.map(r => r.id))
  const order = allMatches.map((m, i) => ({ i, k: (m.day! * 10000) + (m.slot! * 100) + m.court! }))
    .filter(o => freshIdx.has(rows[o.i].id)).sort((x, y) => x.k - y.k)
  const teams = new Map(fresh.map(r => [r.id, [r.home_team_id, r.away_team_id] as [string | null, string | null]]))
  const done = new Set<string>()
  const used = new Set<PrevMatch>()
  let restored = 0
  for (let sweep = 0; sweep < 4 && atRisk.length; sweep++) {
    if (sweep > 0) {
      const now = await run<Array<{ id: string; home_team_id: string | null; away_team_id: string | null }>>(
        s.from('matches').select('id,home_team_id,away_team_id').eq('tournament_id', tid))
      for (const f of now) { const t = teams.get(f.id); if (t) { t[0] = t[0] ?? f.home_team_id; t[1] = t[1] ?? f.away_team_id } }
    }
    let progress = 0
    for (const { i } of order) {
      const r = rows[i]
      if (done.has(r.id)) continue
      const [h, a] = teams.get(r.id)!
      const stage: Stage = r.group_id ? 'g' : 'k'
      let hit: PrevMatch | null | undefined, flip = false, settled = false

      const c = stage === 'g' ? byCode.get(r.code) : undefined
      if (c && c.group_id) {
        if (h && a) {
          if (c.home_team_id === h && c.away_team_id === a) { hit = c; settled = true }
          else if (c.home_team_id === a && c.away_team_id === h) { hit = c; flip = true; settled = true }
        } else if (sameDraw.has(r.category_id)) { hit = c; settled = true }
      }
      if (!hit && h && a) {
        const straight = byPair.get(pairKey(r.category_id, stage, h, a))
        const flipped = straight === undefined ? byPair.get(pairKey(r.category_id, stage, a, h)) : undefined
        hit = straight ?? flipped; flip = !!flipped && !straight; settled = true
      }
      if (!hit || used.has(hit)) { if (settled) done.add(r.id); continue }

      const hs = flip ? hit.away_score : hit.home_score, as = flip ? hit.home_score : hit.away_score
      try { await run(s.from('matches').update({ home_score: hs, away_score: as, status: hit.status }).eq('id', r.id)) }
      catch { done.add(r.id); continue }
      used.add(hit); done.add(r.id); restored++; progress++
      if (hs === as || h == null || a == null) continue
      const w = hs! > as! ? h : a, l = hs! > as! ? a : h
      for (const d of fresh) {
        const t = teams.get(d.id)!
        if (d.home_source === 'W:' + r.id) t[0] = w; else if (d.home_source === 'L:' + r.id) t[0] = l
        if (d.away_source === 'W:' + r.id) t[1] = w; else if (d.away_source === 'L:' + r.id) t[1] = l
      }
    }
    if (!progress) break
  }
  const keptGroups = oldGroups.filter(g => keep.has(g.category_id)).length
  return { groups: groupRows.length + keptGroups, matches: rows.length, kept: played.length - atRisk.length, restored, lost: atRisk.length - restored }
}

// ---------- ώρες προσέλευσης ----------
// A tournament may want to announce only when each category shows up, without putting the whole
// schedule online. These are published on their own, as a snapshot: they stay correct on the public
// page even when no match rows exist there at all.
export interface ArrivalRow { day: number; dayLabel: string; categoryId: string; category: string; color: string; first: string; arrive: string; phase: 'group' | 'ko' }
export interface ArrivalKo { categoryId: string; category: string; color: string; day: number; dayLabel: string; time: string; court: number; label: string; home: string; away: string }
export interface Arrivals { at: string; lead: number; rows: ArrivalRow[]; ko: ArrivalKo[] }

/** First match per category per day, minus the lead — plus whichever knockout pairings are decided. */
export function buildArrivals(st: E.SchedState, all: E.BuildResult, lead: number, resolved?: Map<string, { home: string; away: string }>): Arrivals {
  const rows: ArrivalRow[] = []; const ko: ArrivalKo[] = []
  all.grids.forEach((g, di) => {
    const d = st.settings.days[di]
    const T = (slot: number) => E.hhmm(E.mins(d.start) + slot * st.settings.slot)
    const ms: E.SMatch[] = []; g.grid.forEach(row => row.forEach(m => { if (m) ms.push(m) }))
    st.categories.forEach((c, ci) => {
      const cm = ms.filter(m => m.cat === ci); if (!cm.length) return
      const firstSlot = Math.min(...cm.map(m => m.slot!))
      const opener = cm.find(m => m.slot === firstSlot)!
      rows.push({
        day: di + 1, dayLabel: d.label, categoryId: c.id, category: c.name, color: E.catColor(st, ci),
        first: T(firstSlot), arrive: E.hhmm(Math.max(0, E.mins(T(firstSlot)) - lead)), phase: opener.ko ? 'ko' : 'group',
      })
      cm.filter(m => m.ko).forEach(m => {
        const r = resolved?.get(E.matchKey(st, m)); if (!r) return
        ko.push({ categoryId: c.id, category: c.name, color: E.catColor(st, ci), day: di + 1, dayLabel: d.label, time: T(m.slot!), court: m.court! + 1, label: m.label ?? 'Νοκ-άουτ', home: r.home, away: r.away })
      })
    })
  })
  rows.sort((a, b) => a.day - b.day || a.first.localeCompare(b.first) || a.category.localeCompare(b.category))
  ko.sort((a, b) => a.day - b.day || a.time.localeCompare(b.time) || a.court - b.court)
  return { at: new Date().toISOString(), lead, rows, ko }
}

/** Store the snapshot on the tournament; passing null takes the page down again. */
export async function publishArrivals(tid: string, a: Arrivals | null) {
  await run(sb().from('tournaments').update({ arrivals_json: a }).eq('id', tid))
}
