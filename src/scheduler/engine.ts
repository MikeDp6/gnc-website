// GNC scheduler engine — pure TypeScript port of the prototype (scheduler.html v27). No DOM, no storage.
// Input: SchedState (settings + categories with teams/groups). Output: per-day grids of matches.
// The rules are the ones agreed with Michalis: young categories first (selectable order), never back-to-back
// (soft only if needed), never the same team on two courts, max gap per team (across categories only),
// KO after the groups of the day (soft priority), latest start per category, category with the longest KO
// chain never closes the day, rounds of a category spread over its from–to days.

// ---------- formats ----------
export type Src = { pos: number } | { win: number } | { lose: number }
const P = (k: number): Src => ({ pos: k }), W = (i: number): Src => ({ win: i }), L = (i: number): Src => ({ lose: i })
export interface Format { size: number; name: string; g: number; rounds: Array<Array<[Src, Src]>> }
export const FORMATS: Record<string, Format> = {
  rr2: { size: 2, name: 'Ένας αγώνας', g: 1, rounds: [[[P(0), P(1)]]] },
  rr3: { size: 3, name: 'Όλοι με όλους', g: 2, rounds: [[[P(0), P(1)]], [[P(0), P(2)]], [[P(1), P(2)]]] },
  x4: { size: 4, name: 'Σταυρωτό', g: 2, rounds: [[[P(0), P(1)], [P(2), P(3)]], [[W(0), L(1)], [W(1), L(0)]]] },
  rr4: { size: 4, name: 'Όλοι με όλους', g: 3, rounds: [[[P(0), P(1)], [P(2), P(3)]], [[P(0), P(2)], [P(1), P(3)]], [[P(0), P(3)], [P(1), P(2)]]] },
  fast5: { size: 5, name: 'Γρήγορο', g: 2, rounds: [[[P(0), P(1)], [P(2), P(3)]], [[L(0), L(1)]], [[W(2), P(4)], [W(0), W(1)]], [[W(3), L(4)]]] },
  rr5: { size: 5, name: 'Όλοι με όλους', g: 4, rounds: [[[P(0), P(1)], [P(2), P(3)]], [[P(0), P(2)], [P(1), P(4)]], [[P(0), P(3)], [P(2), P(4)]], [[P(0), P(4)], [P(1), P(3)]], [[P(1), P(2)], [P(3), P(4)]]] },
}
export const FORMATS_BY_SIZE: Record<number, string[]> = { 2: ['rr2'], 3: ['rr3'], 4: ['x4', 'rr4'], 5: ['fast5', 'rr5'] }
export const fmtMatches = (id: string) => FORMATS[id].rounds.reduce((a, r) => a + r.length, 0)
export const GREEK = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ'

// ---------- splits ----------
export interface Split { a: number; b: number; G: number; sizes: number[]; five?: boolean }
export function splits(T: number): Split[] {
  const out: Split[] = []
  for (let a = 0; a <= Math.floor(T / 4); a++) {
    const r = T - 4 * a
    if (r >= 0 && r % 3 === 0) { const b = r / 3; out.push({ a, b, G: a + b, sizes: [...Array(a).fill(4), ...Array(b).fill(3)] }) }
  }
  if (out.length === 0 && T === 5) out.push({ a: 0, b: 0, G: 1, sizes: [5], five: true })
  if (T === 2) out.push({ a: 0, b: 0, G: 1, sizes: [2] })
  out.sort((x, y) => { const ux = (x.a === 0 || x.b === 0) ? 0 : 1, uy = (y.a === 0 || y.b === 0) ? 0 : 1; if (ux !== uy) return ux - uy; return y.b - x.b })
  return out
}

// ---------- knockout ----------
export interface KoInfo { Q: number; P: number; byes: number; prelim: number; total: number; clean: boolean }
export function koInfo(Q: number | null | undefined): KoInfo | null {
  if (!Q || Q < 2) return null
  let Pw = 1; while (Pw * 2 <= Q) Pw *= 2
  return { Q, P: Pw, byes: 2 * Pw - Q, prelim: Q - Pw, total: Q - 1, clean: Pw === Q }
}
export const roundName = (size: number) => size === 2 ? 'Τελικός' : size === 4 ? 'Ημιτελικοί' : 'Φάση των ' + size
const shortKo = (m: { label?: string }) => (m.label ?? '').replace('Φάση των ', 'Φ').replace('Ημιτελικοί ', 'ΗΜ').replace('Προκριματικός ', 'ΠΡ').replace(/ /g, '')

// ---------- state ----------
export interface Day { id: string; label: string; start: string; end: string; courts: number }
export interface Settings {
  slot: number; flow: 'block' | 'mixed'; ko: 'asap' | 'after' | 'afterToday'; gap: 0 | 1 | 2; gapSoft: boolean
  maxGap: 0 | 45 | 60 | 90; latestStart: string; sameName: boolean; koTailRule: boolean; tailB2b: boolean; days: Day[]
}
export interface Cat {
  id: string; name: string; teams: string[]; teamIds?: string[]; color?: string
  split: Split | null; splitIdx?: number; groups: number[][] | null; format: Record<number, string>; Q: number | null
  day: string; dayTo: string; koDay: string
}
export interface Override { d: number; t: number; c: number }
export interface SchedState { settings: Settings; categories: Cat[]; overrides?: Record<string, Override> }

export const uid = () => Math.random().toString(36).slice(2, 9)
export const newDay = (label: string, start?: string, end?: string, courts?: number): Day => ({ id: uid(), label, start: start || '17:00', end: end || '23:30', courts: courts || 2 })
export const defaultSettings = (days: Day[]): Settings => ({ slot: 20, flow: 'block', ko: 'after', gap: 1, gapSoft: true, maxGap: 45, latestStart: '22:00', sameName: true, koTailRule: true, tailB2b: false, days })
export const mins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
export const hhmm = (m: number) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0')
export const dayIdx = (st: SchedState, id: string) => st.settings.days.findIndex(d => d.id === id)
export const daySlotsPerCourt = (st: SchedState, d: Day) => Math.max(0, Math.floor((mins(d.end) - mins(d.start)) / st.settings.slot))
export const daySlots = (st: SchedState, d: Day) => d.courts * daySlotsPerCourt(st, d)
export const totalSlots = (st: SchedState) => st.settings.days.reduce((a, d) => a + daySlots(st, d), 0)

/** Which day round r of a group "wants": rounds spread evenly across the category's from–to days. */
export function roundDay(st: SchedState, c: Cat, fid: string, r: number) {
  const from = dayIdx(st, c.day), to = Math.max(from, dayIdx(st, c.dayTo)); const nR = FORMATS[fid].rounds.length
  const nD = Math.max(1, Math.min(to - from + 1, nR))
  return from + Math.min(nD - 1, Math.floor(r * nD / nR))
}
export const normName = (n: string) => String(n).toLowerCase().replace(/\s+/g, ' ').trim()
const teamKey = (st: SchedState, ci: number, ti: number) => st.settings.sameName ? 'N:' + normName(st.categories[ci].teams[ti]) : ci + ':' + ti
export const catInGroupsDay = (st: SchedState, c: Cat, di: number) => dayIdx(st, c.day) <= di && di <= dayIdx(st, c.dayTo)
export function dayRequired(st: SchedState, d: Day) {
  const di = dayIdx(st, d.id); let grp = 0, ko = 0, complete = true
  for (const c of st.categories) {
    if (catInGroupsDay(st, c, di)) {
      if (!c.split) complete = false
      else c.split.sizes.forEach(sz => { const fid = c.format[sz]; FORMATS[fid].rounds.forEach((r, ri) => { if (roundDay(st, c, fid, ri) === di) grp += r.length }) })
    }
    if (c.koDay === d.id) { if (!c.Q) complete = false; else ko += c.Q - 1 }
  }
  return { grp, ko, sum: grp + ko, complete }
}
export function setCatDay(st: SchedState, c: Cat, which: 'day' | 'dayTo' | 'koDay', id: string) {
  const i = dayIdx(st, id)
  if (which === 'day') { c.day = id; if (dayIdx(st, c.dayTo) < i) c.dayTo = id }
  else if (which === 'dayTo') { c.dayTo = i < dayIdx(st, c.day) ? c.day : id }
  else { c.koDay = i < dayIdx(st, c.dayTo) ? c.dayTo : id; return }
  if (dayIdx(st, c.koDay) < dayIdx(st, c.dayTo)) c.koDay = c.dayTo
}
export const catGroupMatches = (c: Cat) => c.split ? c.split.sizes.reduce((a, sz) => a + fmtMatches(c.format[sz]), 0) : null
export const catRequired = (c: Cat) => { const gm = catGroupMatches(c); return gm == null ? null : gm + (c.Q ? c.Q - 1 : 0) }
export function requiredAll(st: SchedState) { let s = 0, ok = true; for (const c of st.categories) { const r = catRequired(c); if (r == null || !c.Q) ok = false; if (r != null) s += r } return { sum: s, complete: ok } }

export function newCat(st: SchedState, name: string, id = uid()): Cat { const d0 = st.settings.days[0].id; return { id, name, teams: [], split: null, groups: null, format: {}, Q: null, day: d0, dayTo: d0, koDay: d0 } }
export function clearOverridesOf(st: SchedState, c: Cat) { if (!st.overrides) return; for (const k of Object.keys(st.overrides)) if (k.startsWith(c.id + '|')) delete st.overrides[k] }
export function applySplit(st: SchedState, c: Cat, idx: number) {
  const sp = splits(c.teams.length)[idx]; if (!sp) return
  c.split = sp; c.splitIdx = idx; clearOverridesOf(st, c)
  c.format = c.format || {}
  for (const sz of new Set(sp.sizes)) if (!c.format[sz]) c.format[sz] = FORMATS_BY_SIZE[sz][0]
  c.groups = sp.sizes.map(() => []); c.Q = null
  drawSerpentine(c)
}
export function drawSerpentine(c: Cat) {
  if (!c.split) return
  const idx = c.teams.map((_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]] }
  const sizes = c.split.sizes; c.groups = sizes.map(() => [])
  let g = 0, dir = 1
  for (const t of idx) {
    let tries = 0
    while (c.groups[g].length >= sizes[g] && tries < sizes.length * 2) { g += dir; if (g >= sizes.length) { g = sizes.length - 1; dir = -1 } if (g < 0) { g = 0; dir = 1 } tries++ }
    c.groups[g].push(t)
    g += dir; if (g >= sizes.length) { g = sizes.length - 1; dir = -1 } if (g < 0) { g = 0; dir = 1 }
  }
}
export function moveTeam(c: Cat, teamIdx: number, toG: number) { if (!c.groups) return; for (const g of c.groups) { const i = g.indexOf(teamIdx); if (i >= 0) g.splice(i, 1) } c.groups[toG].push(teamIdx) }
export const groupsValid = (c: Cat) => !!(c.groups && c.split && c.groups.every((g, i) => g.length === c.split!.sizes[i]))
export function ageRank(name: string) { const n = name.toLowerCase(); let m; if ((m = n.match(/(?:under|u)\s*(\d+)/))) return +m[1]; if ((m = n.match(/(?:over|o)\s*(\d+)/))) return 100 + +m[1]; if ((m = n.match(/(\d+)\s*\+/))) return 100 + +m[1]; return 99 }
export const sortByAge = (st: SchedState) => st.categories.sort((a, b) => ageRank(a.name) - ageRank(b.name))

// ---------- matches ----------
export interface SMatch {
  cat: number; catName: string; ko?: boolean; grp?: number; round: number; idx: number
  a?: Src; b?: Src; label?: string; teams?: string; feeds?: [number, number]
  day: number | null; slot: number | null; court?: number; wantDay: number; parts?: string[]; b2b?: boolean; bad?: boolean
}
interface Queue { type: 'grp' | 'ko'; cat: number; grp?: number; matches: SMatch[]; next: number; last: [number, number]; gRounds?: number; todayGroups?: boolean }
export interface DayGrid { grid: (SMatch | null)[][]; nS: number }
export interface BuildResult { grids: DayGrid[]; unscheduled: SMatch[]; dayOrderNotes: string[]; relaxedForFit?: boolean }

export function buildAll(st: SchedState): BuildResult {
  const strict = buildAllCore(st, false)
  if (!st.settings.gapSoft || st.settings.gap === 0 || strict.unscheduled.length === 0) return strict
  const soft = buildAllCore(st, true); soft.relaxedForFit = true; return soft
}

function buildAllCore(st: SchedState, allowSoft: boolean): BuildResult {
  const days = st.settings.days, slot = st.settings.slot
  const queues: Queue[] = []
  st.categories.forEach((c, ci) => {
    if (!c.split || !groupsValid(c)) return
    c.groups!.forEach((_g, gi) => {
      const fid = c.format[c.split!.sizes[gi]]; const f = FORMATS[fid]
      const matches: SMatch[] = []; let mi = 0
      f.rounds.forEach((r, ri) => r.forEach(([a, b]) => { matches.push({ cat: ci, catName: c.name, grp: gi, round: ri, idx: mi++, a, b, day: null, slot: null, wantDay: roundDay(st, c, fid, ri) }) }))
      queues.push({ type: 'grp', cat: ci, grp: gi, matches, next: 0, last: [-1, -1] })
    })
    if (!c.Q) return
    const k = koInfo(c.Q); if (!k) return
    const matches: SMatch[] = []; let ri = 0, mi = 0; const kd = dayIdx(st, c.koDay)
    if (k.prelim > 0) { for (let i = 0; i < k.prelim; i++) matches.push({ cat: ci, catName: c.name, ko: true, round: ri, idx: mi++, label: 'Προκριματικός ' + (i + 1), teams: 'Σ' + (k.byes + 1 + i) + ' – Σ' + (k.Q - i), day: null, slot: null, wantDay: kd }); ri++ }
    let prevMain: SMatch[] | null = null
    for (let size = k.P; size >= 2; size /= 2) {
      const n = size / 2; const cur: SMatch[] = []
      for (let i = 0; i < n; i++) {
        const m: SMatch = { cat: ci, catName: c.name, ko: true, round: ri, idx: mi++, label: roundName(size) + (n > 1 ? ' ' + (i + 1) : ''), teams: '', day: null, slot: null, wantDay: kd }
        if (prevMain) { const a = prevMain[2 * i], b = prevMain[2 * i + 1]; m.feeds = [a.idx, b.idx]; m.teams = 'Νικ. ' + shortKo(a) + ' – Νικ. ' + shortKo(b) }
        matches.push(m); cur.push(m)
      }
      prevMain = cur; ri++
    }
    queues.push({ type: 'ko', cat: ci, matches, next: 0, last: [-1, -1], gRounds: Math.max(...c.split.sizes.map(sz => FORMATS[c.format[sz]].rounds.length)) })
  })
  const grpQueuesOf = (ci: number) => queues.filter(q => q.type === 'grp' && q.cat === ci)
  const GAP = st.settings.gap, FLOW = st.settings.flow, KOF = st.settings.ko
  let relax = false
  const clear = (day: number, s: number, di: number, t: number) => day < di || (day === di && s <= t - 1 - (relax ? 0 : GAP))
  queues.filter(q => q.type === 'grp').forEach(q => {
    const c = st.categories[q.cat], g = c.groups![q.grp!]
    const keysOf = (src: Src): string[] => ('pos' in src) ? [teamKey(st, q.cat, g[src.pos])] : (q.matches[('win' in src) ? src.win : src.lose].parts ?? [])
    q.matches.forEach(m => { m.parts = [...new Set([...keysOf(m.a!), ...keysOf(m.b!)])] })
  })
  const lastPlayed: Record<string, [number, number]> = {}
  const catStartedToday = new Set<number>()
  let latestSlot = Infinity
  function eligible(q: Queue, di: number, t: number) {
    if (q.next >= q.matches.length) return false
    const m = q.matches[q.next]
    if (m.wantDay > di) return false
    if (q.type === 'ko') {
      if (t > latestSlot && !catStartedToday.has(q.cat)) return false
      if (!grpQueuesOf(q.cat).every(g => g.next >= g.matches.length && clear(g.last[0], g.last[1], di, t))) return false
      if (m.feeds) { if (!m.feeds.every(fi => { const x = q.matches[fi]; return x.day !== null && clear(x.day, x.slot!, di, t) })) return false }
      else if (m.round > 0 && !q.matches.filter(x => x.round === m.round - 1).every(x => x.day !== null && clear(x.day, x.slot!, di, t))) return false
      return true
    }
    if (t > latestSlot && !catStartedToday.has(q.cat)) return false
    if (m.round > 0 && !q.matches.filter(x => x.round === m.round - 1).every(x => x.day !== null && (x.day < di || (x.day === di && x.slot! < t)))) return false
    for (const k of m.parts!) { const lp = lastPlayed[k]; if (lp && !clear(lp[0], lp[1], di, t)) return false }
    return true
  }
  const MAXG = st.settings.maxGap ? Math.floor(st.settings.maxGap / slot) : 0
  function due(m: SMatch, di: number, t: number) {
    if (!MAXG || !m.parts) return 1
    for (const k of m.parts) { const lp = lastPlayed[k]; if (lp && lp[0] === di && lp[1] + 1 + MAXG <= t + 1) return 0 }
    return 1
  }
  let dayRank: Record<number, number> = {}; const rank = (ci: number) => dayRank[ci] ?? ci
  const dayOrderNotes: string[] = []
  function computeDayRank(di: number) {
    dayRank = {}
    if (!st.settings.koTailRule) return
    const today = [...new Set(queues.filter(q => q.type === 'grp' && q.matches.some(m => m.wantDay <= di && m.day === null)).map(q => q.cat))].sort((a, b) => a - b)
    if (today.length < 2) return
    const chain = (ci: number) => { const c = st.categories[ci]; if (c.koDay !== days[di].id || !c.Q) return 0; const k = koInfo(c.Q); if (!k) return 0; return (k.prelim ? 1 : 0) + Math.log2(k.P) }
    const order = [...today]; const last = order[order.length - 1], prev = order[order.length - 2]
    if (chain(last) > chain(prev)) {
      order[order.length - 1] = prev; order[order.length - 2] = last
      dayRank[last] = prev; dayRank[prev] = last
      dayOrderNotes[di] = 'Σειρά της μέρας: ' + order.map(ci => st.categories[ci].name).join(' → ') + '. Το ' + st.categories[last].name + ' μπήκε πριν από το ' + st.categories[prev].name + ' γιατί έχει μεγαλύτερη αλυσίδα νοκ-άουτ (' + chain(last) + ' γύροι έναντι ' + chain(prev) + ') — δεν κλείνει τη μέρα.'
    }
  }
  function score(q: Queue, m: SMatch, di: number, c: number, courtLast: (Queue | null)[]): number[] {
    const carried = m.wantDay < di ? 1 : 0, urg = 0, cont = courtLast[c] === q ? 0 : 1, ko = q.type === 'ko' ? 1 : 0
    if (FLOW === 'block') {
      if (KOF === 'after') return [1 - carried, urg, ko, rank(q.cat), m.round, cont]
      if (KOF === 'afterToday' && ko && q.todayGroups) return [1 - carried, urg, 1, m.round, rank(q.cat), cont]
      return [1 - carried, urg, rank(q.cat), ko, m.round, cont]
    }
    if (KOF === 'after' || (KOF === 'afterToday' && ko && q.todayGroups)) return [1 - carried, urg, ko, m.round, rank(q.cat), cont]
    return [1 - carried, urg, (ko ? q.gRounds! + m.round : m.round), rank(q.cat), cont]
  }
  const less = (a: number[], b: number[]) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i]; return false }
  const grids: DayGrid[] = days.map((d, di) => {
    const nS = daySlotsPerCourt(st, d); const grid: (SMatch | null)[][] = Array.from({ length: nS }, () => Array(d.courts).fill(null))
    const courtLast: (Queue | null)[] = Array(d.courts).fill(null)
    catStartedToday.clear()
    computeDayRank(di)
    queues.forEach(q => { if (q.type === 'ko') q.todayGroups = grpQueuesOf(q.cat).some(g => g.matches.some(m => m.wantDay <= di && (m.day === null || m.day === di))) })
    const ls = st.settings.latestStart; latestSlot = (ls && di < days.length - 1) ? Math.floor((mins(ls) - mins(d.start)) / slot) : Infinity
    for (let t = 0; t < nS; t++) {
      for (let c = 0; c < d.courts; c++) {
        let pick: Queue | null = null, best: number[] | null = null, pickU: Queue | null = null, bestU: number[] | null = null
        for (const q of queues) {
          if (!eligible(q, di, t)) continue
          const m = q.matches[q.next]; const sc = score(q, m, di, c, courtLast)
          if (best === null || less(sc, best)) { best = sc; pick = q }
          if (due(m, di, t) === 0 && (bestU === null || less(sc, bestU))) { bestU = sc; pickU = q }
        }
        if (pickU && pick && pickU.cat !== pick.cat) pick = pickU
        let b2b = false
        const tailOnly = st.settings.tailB2b && GAP > 0 && !pick && (() => { const left = new Set<number>(); queues.forEach(q => { if (q.next < q.matches.length && q.matches[q.next].wantDay <= di) left.add(q.cat) }); return left.size === 1 })()
        if (!pick && (allowSoft || tailOnly) && GAP > 0) {
          relax = true
          for (const q of queues) { if (!eligible(q, di, t)) continue; const sc = score(q, q.matches[q.next], di, c, courtLast); if (best === null || less(sc, best)) { best = sc; pick = q } }
          relax = false
          if (pick) { const m = pick.matches[pick.next]; b2b = m.parts ? m.parts.some(k => lastPlayed[k] && lastPlayed[k][0] === di && lastPlayed[k][1] > t - 1 - GAP) : true }
        }
        if (pick) { const m = pick.matches[pick.next++]; m.day = di; m.slot = t; m.court = c; m.b2b = b2b; pick.last = [di, t]; grid[t][c] = m; courtLast[c] = pick; catStartedToday.add(pick.cat); if (m.parts) m.parts.forEach(k => lastPlayed[k] = [di, t]) }
      }
    }
    queues.forEach(q => { for (let i = q.next; i < q.matches.length; i++) if (q.matches[i].wantDay <= di) q.matches[i].wantDay = di + 1 })
    return { grid, nS }
  })
  const unscheduled: SMatch[] = []; queues.forEach(q => { for (let i = q.next; i < q.matches.length; i++) unscheduled.push(q.matches[i]) })
  return { grids, unscheduled, dayOrderNotes }
}

// ---------- labels & keys ----------
export const matchKey = (st: SchedState, m: SMatch) => { const c = st.categories[m.cat]; return c.id + '|' + (m.ko ? 'ko' : 'g' + m.grp) + '|' + m.idx }
export function matchLabel(st: SchedState, m: SMatch): { top: string; main: string; home: string; away: string; homeTeam?: number; awayTeam?: number } {
  const c = st.categories[m.cat]
  if (m.ko) { const [h, a] = (m.teams || '').split(' – '); return { top: c.name + ' · ΝΟΚ-ΑΟΥΤ', main: (m.label ?? '') + (m.teams ? ': ' + m.teams : ''), home: h ?? '', away: a ?? '' } }
  const g = c.groups![m.grp!]; const gl = 'Όμ. ' + GREEK[m.grp!]
  const nm = (src: Src) => ('pos' in src) ? (c.teams[g[src.pos]] || '?') : ('win' in src) ? 'Νικ. Μ' + (src.win + 1) : 'Ηττ. Μ' + (src.lose + 1)
  const ti = (src: Src) => ('pos' in src) ? g[src.pos] : undefined
  return { top: c.name + ' · ' + gl + ' · Μ' + (m.idx + 1), main: nm(m.a!) + ' – ' + nm(m.b!), home: nm(m.a!), away: nm(m.b!), homeTeam: ti(m.a!), awayTeam: ti(m.b!) }
}

// ---------- manual moves ----------
export function applyOverrides(st: SchedState, all: BuildResult) {
  const ov = st.overrides || {}; const days = st.settings.days
  const find = (k: string) => { for (let di = 0; di < all.grids.length; di++) { const g = all.grids[di].grid; for (let t = 0; t < g.length; t++) for (let c = 0; c < g[t].length; c++) { const m = g[t][c]; if (m && matchKey(st, m) === k) return { m, di, t, c } } } return null }
  const dead: string[] = []
  for (const [k, o] of Object.entries(ov)) {
    const src = find(k)
    if (!src || o.d >= days.length || !all.grids[o.d] || o.t >= all.grids[o.d].nS || o.c >= days[o.d].courts) { dead.push(k); continue }
    if (src.di === o.d && src.t === o.t && src.c === o.c) { dead.push(k); continue }
    const gS = all.grids[src.di].grid, gT = all.grids[o.d].grid
    const other = gT[o.t][o.c]
    gT[o.t][o.c] = src.m; gS[src.t][src.c] = other || null
    src.m.day = o.d; src.m.slot = o.t; src.m.court = o.c
    if (other) { other.day = src.di; other.slot = src.t; other.court = src.c }
  }
  dead.forEach(k => delete ov[k])
}
export function checkManual(st: SchedState, all: BuildResult): Record<number, string[]> {
  const out: Record<number, string[]> = {}; const GAP = st.settings.gap
  if (!st.overrides || !Object.keys(st.overrides).length) return out
  all.grids.forEach((g, di) => {
    const ms: SMatch[] = []; g.grid.forEach(row => row.forEach(m => { if (m) { m.bad = false; ms.push(m) } }))
    const warn: string[] = []; const T = (t: number) => hhmm(mins(st.settings.days[di].start) + t * st.settings.slot)
    const name = (m: SMatch) => matchLabel(st, m).top + ' (' + T(m.slot!) + ')'
    for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) {
      const a = ms[i], b = ms[j]; if (!a.parts || !b.parts) continue; if (!a.parts.some(k => b.parts!.includes(k))) continue; const d = Math.abs(a.slot! - b.slot!)
      if (d === 0) { warn.push('ίδια ομάδα σε δύο γήπεδα ταυτόχρονα: ' + name(a) + ' και ' + name(b)); a.bad = b.bad = true }
      else if (d < 1 + GAP) { warn.push('back-to-back: ' + name(a) + ' και ' + name(b)); a.bad = b.bad = true }
    }
    ms.filter(m => !m.ko && m.round > 0).forEach(m => { ms.filter(x => !x.ko && x.cat === m.cat && x.grp === m.grp && x.round === m.round - 1).forEach(x => { if (x.slot! >= m.slot!) { warn.push('λάθος σειρά: ' + name(m) + ' πριν από ' + name(x)); m.bad = true } }) })
    ms.filter(m => m.ko).forEach(m => {
      ms.filter(x => !x.ko && x.cat === m.cat).forEach(x => { if (x.slot! >= m.slot!) { warn.push('νοκ-άουτ πριν τελειώσουν οι όμιλοι: ' + name(m) + ' ενώ ' + name(x)); m.bad = true } else if (x.slot! > m.slot! - 1 - GAP) { warn.push('νοκ-άουτ χωρίς κενό μετά τους ομίλους: ' + name(m) + ' αμέσως μετά ' + name(x)); m.bad = true } })
      const prev = m.feeds ? ms.filter(x => x.ko && x.cat === m.cat && m.feeds!.includes(x.idx)) : (m.round > 0 ? ms.filter(x => x.ko && x.cat === m.cat && x.round === m.round - 1) : [])
      prev.forEach(x => { if (x.slot! >= m.slot!) { warn.push('λάθος σειρά νοκ-άουτ: ' + name(m) + ' πριν από ' + name(x)); m.bad = true } else if (x.slot! > m.slot! - 1 - GAP) { warn.push('back-to-back νοκ-άουτ: ' + name(m) + ' αμέσως μετά ' + name(x) + ' (οι νικητές του παίζουν)'); m.bad = x.bad = true } })
    })
    if (warn.length) out[di] = [...new Set(warn)]
  })
  return out
}
export function moveMatch(st: SchedState, key: string, d: number, t: number, c: number) { st.overrides = st.overrides || {}; delete st.overrides[key]; st.overrides[key] = { d, t, c } }

/** Full pipeline: build → apply manual moves → warnings. */
export function schedule(st: SchedState) { const all = buildAll(st); applyOverrides(st, all); const warnings = checkManual(st, all); return { all, warnings } }

// ---------- per-day stats (how a team experiences the day) ----------
export interface CatStat { ci: number; name: string; first: string; lastGroup: string | null; firstKo: string | null; free: string; avgGap: number | null; maxGap: number | null; over: boolean }
export function dayStats(st: SchedState, g: DayGrid, d: Day): { cats: CatStat[]; perTeam: Record<number, Record<number, SMatch[]>> } {
  const slot = st.settings.slot, T = (t: number) => hhmm(mins(d.start) + t * slot)
  const cats: CatStat[] = []; const perTeam: Record<number, Record<number, SMatch[]>> = {}
  const ms: SMatch[] = []; g.grid.forEach(row => row.forEach(m => { if (m) ms.push(m) }))
  st.categories.forEach((c, ci) => {
    const cm = ms.filter(m => m.cat === ci); if (!cm.length) return
    const grp = cm.filter(m => !m.ko), ko = cm.filter(m => m.ko)
    const teams: Record<number, SMatch[]> = {}; grp.forEach(m => [m.a!, m.b!].forEach(src => { if ('pos' in src) { const ti = c.groups![m.grp!][src.pos]; (teams[ti] = teams[ti] || []).push(m) } }))
    let maxGap = 0, sumGap = 0, n = 0
    Object.entries(teams).forEach(([ti, list]) => { list.sort((a, b) => a.slot! - b.slot!); for (let i = 1; i < list.length; i++) { const gp = (list[i].slot! - list[i - 1].slot! - 1) * slot; maxGap = Math.max(maxGap, gp); sumGap += gp; n++ } perTeam[ci] = perTeam[ci] || {}; perTeam[ci][+ti] = list })
    const first = Math.min(...cm.map(m => m.slot!)), lastG = grp.length ? Math.max(...grp.map(m => m.slot!)) : null, firstK = ko.length ? Math.min(...ko.map(m => m.slot!)) : null, last = Math.max(...cm.map(m => m.slot!))
    cats.push({ ci, name: c.name, first: T(first), lastGroup: lastG != null ? T(lastG) : null, firstKo: firstK != null ? T(firstK) : null, free: T(last + 1), avgGap: n ? Math.round(sumGap / n) : null, maxGap: n ? maxGap : null, over: !!(st.settings.maxGap && maxGap > st.settings.maxGap) })
  })
  return { cats, perTeam }
}
export const PALETTE = ['#0B57C7', '#D86F0C', '#1E7A4D', '#8E24AA', '#C91016', '#0097A7', '#6D4C41', '#5D6D1F', '#AD1457', '#455A64']
export const catColor = (st: SchedState, ci: number) => st.categories[ci]?.color ?? PALETTE[ci % PALETTE.length]
