import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/i18n'
import { useMeta } from '@/lib/meta'
import { useData } from '@/data/store'
import { claimPlayer, fetchMyPlayer, fetchPlayerHistory, updateMyPlayer, uploadAvatar } from '@/lib/playerApi'
import { Heading } from '@/components/ui/Heading'
import { Crumb } from '@/components/ui/Crumb'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { MatchRow } from '@/components/match/MatchRow'
import { HistoryList } from '@/components/PlayerHistory'
import type { MyPlayer, PlayerHistoryRow } from '@/data/types'

/** The signed-in player's own page: photo, details, visibility, and their games in the running tournament. */
export function Me() {
  const { t } = useI18n()
  const { session, loading: authLoading, signOut } = useAuth()
  const { matches, teams, tournaments } = useData()
  const [me, setMe] = useState<MyPlayer | null | undefined>(undefined)   // undefined = loading, null = no profile
  const [hist, setHist] = useState<PlayerHistoryRow[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  useMeta(t.account.mine)

  const load = useCallback(async () => {
    try {
      await claimPlayer()
      const p = await fetchMyPlayer()
      setMe(p)
      if (p) setHist(await fetchPlayerHistory(p.id))
    } catch (e) { setErr((e as Error).message); setMe(null) }
  }, [])
  useEffect(() => { if (session) load() }, [session, load])

  if (!authLoading && !session) return <Navigate to="/login" replace />
  if (me === undefined) return <div className="wrap py-[120px] text-dim">{t.loading}</div>

  const say = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 2500) }
  const save = async (patch: Parameters<typeof updateMyPlayer>[0]) => {
    setBusy(true); setErr(null)
    try { setMe(await updateMyPlayer(patch)); say(t.account.saved) } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }
  const pickPhoto = async (f?: File) => {
    if (!f || !session) return
    setBusy(true); setErr(null)
    try { await save({ avatar: await uploadAvatar(f, session.user.id) }) } catch (e) { setErr((e as Error).message); setBusy(false) }
    if (file.current) file.current.value = ''
  }

  // no player row matched this email — they have never registered a team
  if (!me) return (
    <section className="wrap pt-10">
      <Crumb items={[{ label: t.account.mine }]} />
      <Heading a={t.account.title1} b={t.account.title2} className="mt-4" />
      <div className="card mt-8 max-w-[640px] p-7">
        <div className="disp text-[32px]">{t.account.noProfile}</div>
        <p className="mt-3 text-[15px] text-dim">{t.account.noProfileHelp}</p>
        {err && <div className="mt-3 text-[13px] text-red">{err}</div>}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="orange" to="/register">{t.hero.cta1} →</Button>
          <Button variant="ghost" onClick={signOut}>{t.account.signOut}</Button>
        </div>
      </div>
    </section>
  )

  const myTeams = teams.filter(x => hist.some(h => h.teamId === x.id) || x.playerIds?.includes(me.id))
  const myMatches = matches.filter(m => myTeams.some(x => x.id === m.homeId || x.id === m.awayId))
  const next = myMatches.find(m => m.status === 'live') ?? myMatches.find(m => m.status === 'scheduled')
  const tour = tournaments.find(x => x.status !== 'done') ?? tournaments[0]
  const totals = hist.reduce((a, h) => ({ t: a.t + 1, w: a.w + h.wins, l: a.l + h.losses, g: a.g + (h.place === 1 ? 1 : 0) }), { t: 0, w: 0, l: 0, g: 0 })

  return (
    <>
      <Crumb items={[{ label: t.account.mine }]} />
      <section className="wrap pt-6">
        <div className="card grid gap-7 rounded-band p-6 md:grid-cols-[auto_1fr_auto] md:items-center md:p-9">
          <div className="relative">
            {me.avatar_url
              ? <img src={me.avatar_url} alt="" className="h-[120px] w-[120px] rounded-full border-4 border-white/15 object-cover" />
              : <Avatar name={me.display_name} tone="orange" size={120} className="border-4 border-white/15" />}
            <button type="button" onClick={() => file.current?.click()} disabled={busy}
              className="glass pop absolute -bottom-1 -right-1 grid h-10 w-10 place-items-center rounded-full text-[15px]" title={t.account.photo}>📷</button>
            <input ref={file} type="file" accept="image/*" className="hidden" onChange={e => pickPhoto(e.target.files?.[0])} />
          </div>
          <div>
            <div className="kicker mb-1">{t.account.mine}</div>
            <h1 className="disp text-[44px] md:text-[64px]">{me.display_name}</h1>
            <div className="mt-1 text-[14px] text-dim">{[me.nickname && `«${me.nickname}»`, me.city, me.email].filter(Boolean).join(' · ')}</div>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            {[[totals.t, t.player.participations], [totals.w, t.player.wins], [totals.g, t.account.titles]].map(([v, l]) => (
              <div key={String(l)} className="glass min-w-[92px] rounded-[16px] px-4 py-3 text-center">
                <b className="disp block text-[30px] leading-none text-orange">{v}</b>
                <span className="mt-1 block text-[10px] font-bold uppercase tracking-[.12em] text-dim">{l}</span>
              </div>
            ))}
          </div>
        </div>
        {(msg || err) && <div className={`mt-3 text-[13px] ${err ? 'text-red' : 'text-ok'}`}>{err ?? msg}</div>}
      </section>

      {next && (
        <section className="wrap pt-[50px]">
          <Heading a={t.team.next1} b={t.team.next2} size="md" className="mb-5" />
          <MatchRow m={next} mine />
          {tour && <Link to={`/tournaments/${tour.slug}`} className="mt-3 inline-block text-[13px] font-bold uppercase tracking-[.08em] text-orange">{t.player.schedule}</Link>}
        </section>
      )}

      <section className="wrap grid gap-5 pt-[50px] lg:grid-cols-[1.3fr_1fr]">
        <div>
          <Heading a={t.player.history1} b={t.player.history2} size="md" className="mb-5" />
          <HistoryList rows={hist} empty={t.account.noHistory} />
        </div>
        <div className="card h-fit p-6">
          <h4 className="kicker mb-4">{t.account.details}</h4>
          <Field label={t.contact.name} value={me.first_name} onSave={v => save({ first: v })} disabled={busy} />
          <Field label={t.account.lastName} value={me.last_name} onSave={v => save({ last: v })} disabled={busy} />
          <Field label={t.account.nickname} value={me.nickname ?? ''} onSave={v => save({ nickname: v })} disabled={busy} />
          <Field label={t.team.city} value={me.city ?? ''} onSave={v => save({ city: v })} disabled={busy} />
          <div className="flex items-center justify-between gap-4 border-t border-line py-[11px] text-[14px]">
            <span className="text-dim">Email</span><b className="truncate font-semibold">{me.email ?? '—'}</b>
          </div>
          <label className="flex items-start gap-3 border-t border-line py-4 text-[13px]">
            <input type="checkbox" checked={me.public_profile} disabled={busy} onChange={e => save({ isPublic: e.target.checked })} className="mt-1" />
            <span><b className="block text-white">{t.account.publicProfile}</b><span className="text-dim">{t.account.publicHelp}</span></span>
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-4 border-t border-line pt-4">
            {me.public_profile && <Link to={`/players/${me.id}`} className="text-[13px] font-bold uppercase tracking-[.08em] text-orange">{t.account.viewPublic} →</Link>}
            <button type="button" onClick={signOut} className="text-[13px] font-bold uppercase tracking-[.08em] text-dim hover:text-white">{t.account.signOut}</button>
          </div>
        </div>
      </section>
    </>
  )
}

/** One editable line: shows the value, turns into an input on click, saves on blur or Enter. */
function Field({ label, value, onSave, disabled }: { label: string; value: string; onSave: (v: string) => void; disabled?: boolean }) {
  const [edit, setEdit] = useState(false)
  const [v, setV] = useState(value)
  useEffect(() => { setV(value) }, [value])
  const commit = () => { setEdit(false); if (v.trim() !== value) onSave(v.trim()) }
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line py-[11px] text-[14px]">
      <span className="shrink-0 text-dim">{label}</span>
      {edit
        ? <input autoFocus value={v} disabled={disabled} onChange={e => setV(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setV(value); setEdit(false) } }}
            className="w-full max-w-[220px] rounded-lg border border-white/25 bg-black/30 px-3 py-1 text-right outline-none" />
        : <button type="button" onClick={() => setEdit(true)} className="truncate font-semibold hover:text-orange">{value || <span className="text-mute">+</span>}</button>}
    </div>
  )
}
