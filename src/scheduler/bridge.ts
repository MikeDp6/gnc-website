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
export interface SavedSched { settings?: Partial<E.Settings>; cats?: Record<string, { split?: number; format?: Record<number, string>; Q?: number | null; day?: number; dayTo?: number; koDay?: number; groups?: string[][] }>; overrides?: Record<string, E.Override>; order?: string[] }

export async function loadInputs(tid: string) {
  const [days, teams, tcs, cats, tour] = await Promise.all([
    run<DbDay[]>(sb().from('tournament_days').select('id,day_index,date,start_time,end_time,courts').eq('tournament_id', tid).order('day_index')),
    run<DbTeam[]>(sb().from('teams').select('id,category_id,name,status').eq('tournament_id', tid).eq('status', 'active').order('name')),
    run<DbTc[]>(sb().from('tournament_categories').select('category_id,format,qualifiers,sort_order').eq('tournament_id', tid).order('sort_order')),
    run<Array<{ id: string; label: string; color_key: string }>>(sb().from('categories').select('id,label,color_key')),
    run<{ settings_json: Record<string, unknown> }>(sb().from('tournaments').select('settings_json').eq('id', tid).single()),
  ])
  return { days, teams, tcs, cats, saved: (tour.settings_json?.scheduler ?? null) as SavedSched | null }
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
  st.categories.forEach(c => { cats![c.id] = { split: c.splitIdx, format: c.format, Q: c.Q, day: E.dayIdx(st, c.day), dayTo: E.dayIdx(st, c.dayTo), koDay: E.dayIdx(st, c.koDay), groups: c.groups?.map(g => g.map(i => c.teamIds![i])) } })
  return { settings, cats, overrides: st.overrides ?? {}, order: st.categories.map(c => c.id) }
}
export async function saveSched(tid: string, st: E.SchedState) {
  const cur = await run<{ settings_json: Record<string, unknown> }>(sb().from('tournaments').select('settings_json').eq('id', tid).single())
  await run(sb().from('tournaments').update({ settings_json: { ...(cur.settings_json ?? {}), scheduler: toSaved(st) } }).eq('id', tid))
}

/** Seed pairs of a clean bracket of P teams, in match order: 8 → [1,8],[4,5],[3,6],[2,7]. */
export function bracketPair(P: number, i: number): [number, number] {
  let order = [1]
  while (order.length < P) { const n = order.length * 2 + 1; order = order.flatMap(s => [s, n - s]) }
  return [order[2 * i], order[2 * i + 1]]
}

/** Publish: replace groups/group_teams/matches of the tournament with the engine result. */
export async function publish(tid: string, st: E.SchedState, all: E.BuildResult) {
  const s = sb()
  // 1) wipe previous schedule (results already entered are lost — the UI warns)
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
  return { groups: groupRows.length, matches: rows.length }
}
