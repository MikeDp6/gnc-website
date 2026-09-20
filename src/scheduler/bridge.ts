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

interface PrevMatch { code: string | null; category_id: string; home_team_id: string | null; away_team_id: string | null; home_score: number | null; away_score: number | null; status: string }

/** The draw of a category, as a string: groups in order, each listing its teams in seed order.
 *  Identical strings mean every fixture of that category is literally the same match as before. */
const drawKey = (groups: string[][]) => groups.map(g => g.join(',')).join(' | ')

/** A fixture is "the same match" when the same two teams of the same category meet again. */
const pairKey = (cat: string, h: string, a: string) => cat + '|' + h + '|' + a
/** Index the played matches by pair; a pair that occurs twice (e.g. group + KO) is ambiguous and dropped. */
function indexPlayed(played: PrevMatch[]) {
  const m = new Map<string, PrevMatch | null>()
  for (const p of played) { const k = pairKey(p.category_id, p.home_team_id!, p.away_team_id!); m.set(k, m.has(k) ? null : p) }
  return m
}

/** Publish: replace groups/group_teams/matches of the tournament with the engine result. */
export async function publish(tid: string, st: E.SchedState, all: E.BuildResult) {
  const s = sb()
  // 1) snapshot the results already entered, then wipe the previous schedule.
  //    Scores come back at the end, but only onto fixtures that are provably the same match.
  const [prev, oldGroups] = await Promise.all([
    run<PrevMatch[]>(s.from('matches').select('code,category_id,home_team_id,away_team_id,home_score,away_score,status').eq('tournament_id', tid)),
    run<Array<{ id: string; category_id: string; sort_order: number }>>(s.from('groups').select('id,category_id,sort_order').eq('tournament_id', tid)),
  ])
  // scoped to this tournament's groups: group_teams has no tournament column, and an unfiltered
  // read would be paged by the API and silently make an untouched draw look like it had changed
  const oldGt = oldGroups.length
    ? await run<Array<{ group_id: string; team_id: string; seed: number }>>(
        s.from('group_teams').select('group_id,team_id,seed').in('group_id', oldGroups.map(g => g.id)))
    : []
  const played = prev.filter(p => p.home_score != null && p.away_score != null)
  // safety net: keep the raw snapshot in settings_json too, so a bad republish is never a dead end
  if (played.length) {
    const cur = await run<{ settings_json: Record<string, unknown> }>(s.from('tournaments').select('settings_json').eq('id', tid).single())
    await run(s.from('tournaments').update({ settings_json: { ...(cur.settings_json ?? {}), results_backup: { at: new Date().toISOString(), rows: played } } }).eq('id', tid))
  }
  await run(s.from('matches').delete().eq('tournament_id', tid))
  await run(s.from('groups').delete().eq('tournament_id', tid))
  // 2) groups
  const groupRows: Array<{ id: string; tournament_id: string; category_id: string; name: string; sort_order: number }> = []
  const gtRows: Array<{ group_id: string; team_id: string; seed: number }> = []
  const gid = (ci: number, gi: number) => groupRows.find(g => g.category_id === st.categories[ci].id && g.sort_order === gi)!.id
  st.categories.forEach(c => c.groups?.forEach((g, gi) => {
    const id = crypto.randomUUID()
    groupRows.push({ id, tournament_id: tid, category_id: c.id, name: 'Όμιλος ' + E.GREEK[gi], sort_order: gi })
    g.forEach((ti, i) => gtRows.push({ group_id: id, team_id: c.teamIds![ti], seed: i + 1 }))
  }))
  if (groupRows.length) await run(s.from('groups').insert(groupRows))
  if (gtRows.length) await run(s.from('group_teams').insert(gtRows))
  // 3) matches — ids first so KO feeds can reference them
  const ids = new Map<string, string>()
  const allMatches: E.SMatch[] = []
  all.grids.forEach(g => g.grid.forEach(row => row.forEach(m => { if (m) allMatches.push(m) })))
  allMatches.forEach(m => ids.set(E.matchKey(st, m), crypto.randomUUID()))
  const rows = allMatches.map(m => {
    const c = st.categories[m.cat]; const d = st.settings.days[m.day!]
    const time = E.hhmm(E.mins(d.start) + m.slot! * st.settings.slot)
    const base = { id: ids.get(E.matchKey(st, m))!, tournament_id: tid, category_id: c.id, code: E.matchKey(st, m), day_id: d.id, court: m.court! + 1, slot_time: time, round: m.round, match_number: m.idx + 1, manual_override: !!st.overrides?.[E.matchKey(st, m)] }
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
  for (let i = 0; i < rows.length; i += 200) await run(s.from('matches').insert(rows.slice(i, i + 200)))

  // 4) put the scores back, chronologically, with a plain update per match — so each restored
  //    result runs through the DB trigger exactly as if it had been typed in again: winners drop
  //    into the next match and, once a group is complete, its standings resolve the bracket seeds.
  //
  //    A category whose draw is untouched keeps every one of its match codes, so its results are
  //    matched by code and come back whole — that is the case when only another category changed.
  //    A category that was redrawn has no stable codes, so there its results are matched by the
  //    pair of teams, and a fixture that no longer exists loses its score, as it should.
  const oldDraw = new Map<string, string[][]>()
  for (const g of oldGroups.sort((x, y) => x.sort_order - y.sort_order)) {
    const list = oldGt.filter(t => t.group_id === g.id).sort((x, y) => x.seed - y.seed).map(t => t.team_id)
    oldDraw.set(g.category_id, [...(oldDraw.get(g.category_id) ?? []), list])
  }
  const intact = new Set(st.categories
    .filter(c => c.groups && drawKey(c.groups.map(g => g.map(ti => c.teamIds![ti]))) === drawKey(oldDraw.get(c.id) ?? []))
    .map(c => c.id))

  const byCode = new Map(played.filter(p => p.code).map(p => [p.code!, p]))
  const byPair = indexPlayed(played.filter(p => p.home_team_id && p.away_team_id))
  const order = allMatches.map((m, i) => ({ i, k: (m.day! * 10000) + (m.slot! * 100) + m.court! })).sort((x, y) => x.k - y.k)
  const teams = new Map(rows.map(r => [r.id, [r.home_team_id, r.away_team_id] as [string | null, string | null]]))
  const done = new Set<string>()
  const used = new Set<PrevMatch>()
  let restored = 0
  // Several sweeps: a fixture in a redrawn category is identifiable only once the matches feeding
  // it have been restored, and bracket seeds only once the whole group stage is final again.
  for (let sweep = 0; sweep < 4; sweep++) {
    if (sweep > 0) {
      const fresh = await run<Array<{ id: string; home_team_id: string | null; away_team_id: string | null }>>(
        s.from('matches').select('id,home_team_id,away_team_id').eq('tournament_id', tid))
      for (const f of fresh) { const t = teams.get(f.id); if (t) { t[0] = t[0] ?? f.home_team_id; t[1] = t[1] ?? f.away_team_id } }
    }
    let progress = 0
    for (const { i } of order) {
      const r = rows[i]
      if (done.has(r.id)) continue
      const [h, a] = teams.get(r.id)!
      let hit: PrevMatch | null | undefined, flip = false, settled = false

      // same code in an untouched draw: the same fixture, whether or not its teams are known yet
      const c = byCode.get(r.code)
      if (c) {
        if (h && a) {
          if (c.home_team_id === h && c.away_team_id === a) { hit = c; settled = true }
          else if (c.home_team_id === a && c.away_team_id === h) { hit = c; flip = true; settled = true }
        } else if (intact.has(r.category_id)) { hit = c; settled = true }
      }
      // redrawn category: fall back to the pair of teams, wherever it now sits in the schedule
      if (!hit && h && a) {
        const straight = byPair.get(pairKey(r.category_id, h, a))
        const flipped = straight === undefined ? byPair.get(pairKey(r.category_id, a, h)) : undefined
        hit = straight ?? flipped; flip = !!flipped && !straight; settled = true
      }
      if (!hit || used.has(hit)) { if (settled) done.add(r.id); continue }

      const hs = flip ? hit.away_score : hit.home_score, as = flip ? hit.home_score : hit.away_score
      // one failed write must not cost the remaining results — the snapshot is in settings_json anyway
      try { await run(s.from('matches').update({ home_score: hs, away_score: as, status: hit.status }).eq('id', r.id)) }
      catch { done.add(r.id); continue }
      used.add(hit); done.add(r.id); restored++; progress++
      // mirror the trigger locally, so fixtures further down this same sweep know who they face
      if (hs === as || h == null || a == null) continue
      const w = hs! > as! ? h : a, l = hs! > as! ? a : h
      for (const d of rows) {
        const t = teams.get(d.id)!
        if (d.home_source === 'W:' + r.id) t[0] = w; else if (d.home_source === 'L:' + r.id) t[0] = l
        if (d.away_source === 'W:' + r.id) t[1] = w; else if (d.away_source === 'L:' + r.id) t[1] = l
      }
    }
    if (!progress) break
  }
  return { groups: groupRows.length, matches: rows.length, restored, lost: played.length - restored }
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
