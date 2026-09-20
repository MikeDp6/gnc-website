import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { PinPad } from '@/components/PinPad'
import * as quick from '@/lib/quickAuth'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/cn'
import { useMeta } from '@/lib/meta'
import { useData } from '@/data/store'
import { claimPlayer, createMyPlayer, fetchMyPlayer, fetchMyTeams, fetchPlayerCandidates, fetchPlayerHistory, fetchPlayerRank, linkMyPlayer, updateMyPlayer, uploadAvatar, type PlayerCandidate } from '@/lib/playerApi'
import { Heading } from '@/components/ui/Heading'
import { Crumb } from '@/components/ui/Crumb'
import { Button } from '@/components/ui/Button'
import { Field as FormField, TextInput } from '@/components/ui/Form'
import { Avatar } from '@/components/ui/Avatar'
import { MatchRow } from '@/components/match/MatchRow'
import { HistoryList } from '@/components/PlayerHistory'
import { MyTeamPanel } from '@/components/MyTeamPanel'
import { CrewPanel } from '@/components/CrewPanel'
import { claimCrewInvites, createMyCrew, fetchMyCrews, inviteToMyCrew, respondCrewInvite, sendCrewInvites } from '@/lib/crewApi'
import { RankPanel } from '@/components/RankPanel'
import type { Crew, MyPlayer, MyTeam, PlayerHistoryRow, PlayerRank2 } from '@/data/types'

/** The signed-in player's own page: photo, details, visibility, and their games in the running tournament. */
export function Me() {
  const { t } = useI18n()
  const { session, isAdmin, loading: authLoading, signOut, setPassword } = useAuth()
  const { matches, teams, tournaments } = useData()
  const [me, setMe] = useState<MyPlayer | null | undefined>(undefined)   // undefined = loading, null = no profile
  const [hist, setHist] = useState<PlayerHistoryRow[]>([])
  const [myTeams, setMyTeams] = useState<MyTeam[]>([])
  const [rank, setRank] = useState<PlayerRank2>({ byCategory: [] })
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState({ first: '', last: '', phone: '', birthYear: '', city: '' })
  const [crews, setCrews] = useState<Crew[]>([])
  const [crewDraft, setCrewDraft] = useState({ name: '', city: '', m1: '', m2: '', m3: '' })
  const [makingCrew, setMakingCrew] = useState(false)
  const [params] = useSearchParams()
  const [loadFailed, setLoadFailed] = useState(false)
  // Υποψήφιες παλιές εγγραφές με το ίδιο όνομα: προτείνονται, δεν ενώνονται ποτέ αυτόματα.
  const [cands, setCands] = useState<PlayerCandidate[] | null>(null)
  const [pwOpen, setPwOpen] = useState(params.get('reset') === '1')
  // Γρήγορη είσοδος σε αυτή τη συσκευή: το PIN κλειδώνει τοπικά τη συνεδρία, δεν φεύγει ποτέ από εδώ
  const [quickOn, setQuickOn] = useState(quick.hasQuick())
  const [bioOn, setBioOn] = useState(quick.hasBio())
  const [bioOk, setBioOk] = useState(false)
  const [pinOpen, setPinOpen] = useState(false)
  useEffect(() => { quick.bioSupported().then(setBioOk) }, [])
  const [pw, setPw] = useState('')
  useMeta(t.account.mine)

  const load = useCallback(async () => {
    try {
      setLoadFailed(false)
      await claimPlayer()
      const p = await fetchMyPlayer()
      setMe(p)
      if (p) {
        await claimCrewInvites().catch(() => 0)
        const [h, teams, r, cr] = await Promise.all([
          fetchPlayerHistory(p.id), fetchMyTeams().catch(() => []),
          fetchPlayerRank(p.id).catch(() => ({ byCategory: [] })), fetchMyCrews().catch(() => []),
        ])
        setHist(h); setMyTeams(teams); setRank(r); setCrews(cr)
      }
    } catch (e) {
      // Ένα σφάλμα φόρτωσης ΔΕΝ σημαίνει «δεν έχει προφίλ». Το να δείχναμε τότε τη φόρμα δημιουργίας
      // τρόμαζε τον χρήστη ότι χάθηκαν τα στοιχεία του, ενώ απλώς δεν διαβάστηκαν.
      setErr((e as Error).message); setLoadFailed(true)
    }
  }, [])
  useEffect(() => { if (session) load() }, [session, load])

  if (!authLoading && !session) return <Navigate to="/login" replace />
  if (loadFailed) return (
    <div className="wrap py-[120px]">
      <div className="card max-w-[520px] p-7">
        <div className="disp text-[30px]">Δεν φορτώθηκε το προφίλ σου</div>
        <p className="mt-3 text-[15px] text-dim">Τα στοιχεία σου είναι στη θέση τους — απλώς δεν καταφέραμε να τα διαβάσουμε τώρα.</p>
        {err && <p className="mt-2 text-[13px] text-red">{err}</p>}
        <button type="button" onClick={() => { setErr(null); load() }} className="mt-6 text-[13px] font-bold uppercase tracking-[.08em] text-orange">Δοκίμασε ξανά →</button>
      </div>
    </div>
  )
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

  // no player row matched this email — nobody has written them on a declaration yet, so they make
  // their own profile here. A declaration that arrives later attaches to it by email.
  if (!me) {
    const ok = draft.first.trim().length > 1 && draft.last.trim().length > 1
    const year = draft.birthYear.trim() ? Number(draft.birthYear.trim()) : null
    const makeNew = async () => {
      setBusy(true); setErr(null)
      try {
        setMe(await createMyPlayer({ first: draft.first, last: draft.last, phone: draft.phone, birthYear: year, city: draft.city }))
        await load()
      } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
    }
    // Πρώτα κοιτάμε αν το όνομα υπάρχει ήδη από παλιά δήλωση. Αν ναι, ρωτάμε· αλλιώς προχωράμε.
    const create = async () => {
      setBusy(true); setErr(null)
      try {
        const found = await fetchPlayerCandidates(draft.first, draft.last, year)
        if (found.length) { setCands(found); setBusy(false); return }
      } catch { /* η ταυτοποίηση είναι βοήθημα· αν πέσει, φτιάχνουμε κανονικά νέο προφίλ */ }
      await makeNew()
    }
    const linkTo = async (id: string) => {
      setBusy(true); setErr(null)
      try {
        setMe(await linkMyPlayer(id, { first: draft.first, last: draft.last, phone: draft.phone, birthYear: year, city: draft.city }))
        await load()
      } catch (e) { setErr((e as Error).message); setBusy(false) }
    }

    if (cands) return (
      <section className="wrap pt-10">
        <Crumb items={[{ label: t.account.mine }]} />
        <Heading a="Μήπως" b="είσαι εσύ;" className="mt-4" as="h1" />
        <div className="card mt-8 max-w-[640px] p-7">
          <p className="text-[15px] text-dim">
            Βρήκαμε {cands.length === 1 ? 'μία παλιά δήλωση' : `${cands.length} παλιές δηλώσεις`} με αυτό το όνομα.
            Αν κάποια είναι δική σου, διάλεξέ τη και θα κρατήσεις το ιστορικό και τους βαθμούς σου.
          </p>
          <div className="mt-5 grid gap-2">
            {cands.map(c => (
              <button key={c.id} type="button" disabled={busy} onClick={() => linkTo(c.id)}
                className="card flex items-center justify-between gap-4 px-4 py-3 text-left hover:border-orange/60 disabled:opacity-50">
                <span>
                  <b className="block text-[15px]">{c.first_name} {c.last_name}</b>
                  <small className="text-[12px] text-dim">
                    {[c.city, c.birth_year ? `γεν. ${c.birth_year}` : null,
                      c.tournaments ? `${c.tournaments} ${c.tournaments === 1 ? 'διοργάνωση' : 'διοργανώσεις'}` : 'καμία συμμετοχή',
                    ].filter(Boolean).join(' · ')}
                  </small>
                </span>
                {c.strong && <span className="whitespace-nowrap rounded-full border border-orange/60 px-2 py-[2px] text-[10px] font-bold uppercase tracking-[.08em] text-orange">ίδιο έτος</span>}
              </button>
            ))}
          </div>
          {err && <div className="mt-3 text-[13px] text-red">{err}</div>}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button type="button" onClick={makeNew} disabled={busy}
              className="pop rounded-full bg-orange px-5 py-[10px] text-[13px] font-bold uppercase tracking-[.06em] text-[#111] disabled:opacity-45">
              Καμία από αυτές — νέο προφίλ
            </button>
            <button type="button" onClick={() => { setCands(null); setErr(null) }} disabled={busy}
              className="text-[12px] font-bold uppercase tracking-[.08em] text-dim hover:text-white">Πίσω</button>
          </div>
        </div>
      </section>
    )
    return (
      <section className="wrap pt-10">
        <Crumb items={[{ label: t.account.mine }]} />
        <Heading a={t.account.title1} b={t.account.title2} className="mt-4" as="h1" />
        <div className="card mt-8 max-w-[640px] p-7">
          <div className="disp text-[32px]">{t.account.newProfile}</div>
          <p className="mt-3 text-[15px] text-dim">{t.account.newProfileHelp}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <FormField label={t.account.firstName}>
              <TextInput value={draft.first} disabled={busy} autoComplete="given-name"
                onChange={e => setDraft({ ...draft, first: e.target.value })} />
            </FormField>
            <FormField label={t.account.lastName}>
              <TextInput value={draft.last} disabled={busy} autoComplete="family-name"
                onChange={e => setDraft({ ...draft, last: e.target.value })} />
            </FormField>
            <FormField label={t.account.phone}>
              <TextInput value={draft.phone} disabled={busy} inputMode="tel" autoComplete="tel"
                onChange={e => setDraft({ ...draft, phone: e.target.value })} />
            </FormField>
            <FormField label={t.account.birthYear} hint={t.account.birthHelp}>
              <TextInput value={draft.birthYear} disabled={busy} inputMode="numeric" placeholder="2004" maxLength={4}
                onChange={e => setDraft({ ...draft, birthYear: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
            </FormField>
            <FormField label={t.account.cityLabel} className="sm:col-span-2">
              <TextInput value={draft.city} disabled={busy} autoComplete="address-level2"
                onChange={e => setDraft({ ...draft, city: e.target.value })} />
            </FormField>
          </div>

          {err && <div className="mt-3 text-[13px] text-red">{err}</div>}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="button" onClick={create} disabled={!ok || busy}
              className="pop inline-flex items-center gap-2 rounded-full bg-orange px-5 py-[10px] text-[13px] font-bold uppercase tracking-[.06em] text-[#111] disabled:opacity-45">
              {t.account.createProfile} <span aria-hidden>→</span>
            </button>
            <Button variant="ghost" to="/register">{t.account.orRegister}</Button>
            <button type="button" onClick={signOut} className="text-[13px] font-bold uppercase tracking-[.08em] text-dim hover:text-white">{t.account.signOut}</button>
          </div>
        </div>
      </section>
    )
  }

  // the running tournament's teams this player is in, used to find their next game
  const playing = teams.filter(x => hist.some(h => h.teamId === x.id) || x.playerIds?.includes(me.id) || myTeams.some(mt => mt.team_id === x.id))
  const myMatches = matches.filter(m => playing.some(x => x.id === m.homeId || x.id === m.awayId))
  const next = myMatches.find(m => m.status === 'live') ?? myMatches.find(m => m.status === 'scheduled')
  const tour = tournaments.find(x => x.status !== 'done') ?? tournaments[0]
  const pendingCrews = crews.filter(c => c.accepted === false)
  const myCrews = crews.filter(c => c.accepted !== false)
  const reloadCrews = async () => { try { setCrews(await fetchMyCrews()) } catch (e) { setErr((e as Error).message) } }
  const answer = async (id: string, accept: boolean) => {
    setBusy(true); setErr(null)
    try { await respondCrewInvite(id, accept); await reloadCrews(); say(accept ? 'Μπήκες στην ομάδα' : 'Η πρόσκληση απορρίφθηκε') }
    catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }
  const invite = async (id: string, email: string) => {
    setBusy(true); setErr(null)
    try { await inviteToMyCrew(id, email); await sendCrewInvites(id).catch(() => 0); await reloadCrews(); say('Η πρόσκληση στάλθηκε') }
    catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }
  const makeCrew = async () => {
    setBusy(true); setErr(null)
    try {
      const made = await createMyCrew({ name: crewDraft.name, city: crewDraft.city, mates: [crewDraft.m1, crewDraft.m2, crewDraft.m3] })
      if (made?.id) await sendCrewInvites(made.id).catch(() => 0)
      setCrewDraft({ name: '', city: '', m1: '', m2: '', m3: '' }); setMakingCrew(false)
      await reloadCrews(); say('Η ομάδα δημιουργήθηκε')
    } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }
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

      {myTeams.length > 0 && (
        <section className="wrap pt-[50px]">
          <Heading a="Η ομάδα" b="μου" size="md" className="mb-5" />
          <MyTeamPanel teams={myTeams} />
        </section>
      )}

      {pendingCrews.length > 0 && (
        <section className="wrap pt-[50px]">
          <Heading a="Προσκλήσεις" b="σε ομάδα" size="md" className="mb-5" />
          <div className="flex flex-col gap-4">
            {pendingCrews.map(c => (
              <div key={c.id} className="card flex flex-wrap items-center justify-between gap-4 rounded-band p-6">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-[.14em] text-orange">Σε κάλεσαν</div>
                  <div className="disp mt-1 text-[28px] leading-none">{c.name}</div>
                  <div className="mt-[6px] text-[13px] text-dim">
                    {[c.city, `αρχηγός ${c.members.find(m => m.role === 'captain')?.name ?? '—'}`].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" disabled={busy} onClick={() => answer(c.id, true)}
                    className="pop rounded-full bg-orange px-5 py-[10px] text-[12px] font-bold uppercase tracking-[.06em] text-[#111] disabled:opacity-45">Αποδοχή</button>
                  <button type="button" disabled={busy} onClick={() => answer(c.id, false)}
                    className="text-[12px] font-bold uppercase tracking-[.08em] text-dim hover:text-white">Απόρριψη</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="wrap pt-[50px]">
        <Heading a="Οι ομάδες" b="μου" size="md" className="mb-5" />
        {myCrews.length > 0 && (
          <div className="flex flex-col gap-4">
            {myCrews.map(c => <CrewPanel key={c.id} crew={c} busy={busy} onInvite={e => invite(c.id, e)} />)}
          </div>
        )}

        {!makingCrew && (
          <div className={cn('flex flex-wrap items-center justify-between gap-4 rounded-band border border-dashed border-line px-6 py-6', myCrews.length > 0 && 'mt-4')}>
            <div>
              <div className="disp text-[26px]">{myCrews.length ? 'Φτιάξε κι άλλη ομάδα' : 'Δημιούργησε την ομάδα σου'}</div>
              <p className="mt-1 max-w-[520px] text-[14px] text-dim">
                Δεν χρειάζεται να υπάρχει διοργάνωση. Φτιάξε την ομάδα, κάλεσε τους συμπαίκτες σου, και όταν ανοίξουν δηλώσεις τη δηλώνεις όπως είναι.
              </p>
            </div>
            <button type="button" onClick={() => setMakingCrew(true)}
              className="pop inline-flex items-center gap-3 rounded-full bg-white py-[6px] pl-5 pr-[6px] text-[13px] font-bold uppercase tracking-[.06em] text-[#111]">
              Νέα ομάδα<span className="grid h-8 w-8 place-items-center rounded-full bg-[#111] text-[16px] text-white" aria-hidden>→</span>
            </button>
          </div>
        )}

        {makingCrew && (
          <div className={cn('card rounded-band p-6', myCrews.length > 0 && 'mt-4')}>
            <div className="disp text-[26px]">Νέα ομάδα</div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <FormField label="Όνομα ομάδας">
                <TextInput value={crewDraft.name} disabled={busy} autoFocus onChange={e => setCrewDraft({ ...crewDraft, name: e.target.value })} />
              </FormField>
              <FormField label="Πόλη">
                <TextInput value={crewDraft.city} disabled={busy} onChange={e => setCrewDraft({ ...crewDraft, city: e.target.value })} />
              </FormField>
              <FormField label="Email συμπαίκτη" hint="Προαιρετικά — μπορείς να τους καλέσεις και αργότερα." className="sm:col-span-2">
                <TextInput value={crewDraft.m1} disabled={busy} inputMode="email" placeholder="συμπαίκτης 1"
                  onChange={e => setCrewDraft({ ...crewDraft, m1: e.target.value })} />
              </FormField>
              <FormField label="">
                <TextInput value={crewDraft.m2} disabled={busy} inputMode="email" placeholder="συμπαίκτης 2"
                  onChange={e => setCrewDraft({ ...crewDraft, m2: e.target.value })} />
              </FormField>
              <FormField label="">
                <TextInput value={crewDraft.m3} disabled={busy} inputMode="email" placeholder="συμπαίκτης 3"
                  onChange={e => setCrewDraft({ ...crewDraft, m3: e.target.value })} />
              </FormField>
            </div>
            <p className="mt-3 text-[13px] text-dim">
              Όποιος έχει ήδη λογαριασμό θα δει την πρόσκληση στη σελίδα του. Όποιος δεν έχει, θα την παραλάβει μόλις φτιάξει προφίλ με το ίδιο email. Κανείς δεν μπαίνει στην ομάδα πριν την αποδεχτεί.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button type="button" onClick={makeCrew} disabled={busy || crewDraft.name.trim().length < 2}
                className="pop rounded-full bg-orange px-5 py-[10px] text-[12px] font-bold uppercase tracking-[.06em] text-[#111] disabled:opacity-45">
                Δημιουργία ομάδας
              </button>
              <button type="button" onClick={() => setMakingCrew(false)} className="text-[12px] font-bold uppercase tracking-[.08em] text-dim hover:text-white">Άκυρο</button>
            </div>
          </div>
        )}
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
        <div className="flex flex-col gap-5">
          <RankPanel rank={rank} />
          <div className="card h-fit p-6">
          <h4 className="kicker mb-4">{t.account.details}</h4>
          <Field label={t.contact.name} value={me.first_name} onSave={v => save({ first: v })} disabled={busy} />
          <Field label={t.account.lastName} value={me.last_name} onSave={v => save({ last: v })} disabled={busy} />
          <Field label={t.account.nickname} value={me.nickname ?? ''} onSave={v => save({ nickname: v })} disabled={busy} />
          <Field label={t.team.city} value={me.city ?? ''} onSave={v => save({ city: v })} disabled={busy} />
          <Field label={t.account.phone} value={me.phone ?? ''} onSave={v => save({ phone: v })} disabled={busy} />
          <Field label={t.account.birthYear} value={me.birth_year ? String(me.birth_year) : ''} onSave={v => save({ birthYear: v ? Number(v) : null })} disabled={busy} />
          <div className="flex items-center justify-between gap-4 border-t border-line py-[11px] text-[14px]">
            <span className="text-dim">Email</span><b className="truncate font-semibold">{me.email ?? '—'}</b>
          </div>
          <div className="border-t border-line py-4">
            {pwOpen ? (
              <div>
                <div className="text-[13px] font-bold">{t.account.setPassword}</div>
                <p className="mt-1 text-[12px] text-dim">{t.account.setPasswordHelp}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder={t.account.newPassword} autoComplete="new-password"
                    className="min-w-[160px] flex-1 rounded-lg border border-white/25 bg-black/30 px-3 py-2 text-[13px] outline-none" />
                  <button type="button" disabled={busy || pw.length < 8}
                    onClick={async () => {
                      setBusy(true); setErr(null)
                      const e2 = await setPassword(pw)
                      if (e2) setErr(e2); else { setPw(''); setPwOpen(false); say(t.account.passwordSaved) }
                      setBusy(false)
                    }}
                    className="pop rounded-full bg-white px-4 py-2 text-[12px] font-bold uppercase tracking-[.06em] text-[#111] disabled:opacity-45">
                    OK
                  </button>
                  <button type="button" onClick={() => { setPwOpen(false); setPw('') }} className="text-[12px] font-bold uppercase tracking-[.08em] text-dim hover:text-white">✕</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setPwOpen(true)} className="text-[13px] font-bold uppercase tracking-[.08em] text-orange">{t.account.setPassword} →</button>
            )}
          </div>
          <div className="border-t border-line py-4">
            <div className="text-[13px] font-bold">Γρήγορη είσοδος σε αυτή τη συσκευή</div>
            {isAdmin ? (
              <p className="mt-1 text-[12px] text-dim">Δεν είναι διαθέσιμη σε λογαριασμούς διαχείρισης. Ο λογαριασμός σου ελέγχει σκορ και προγράμματα διοργανώσεων, οπότε μπαίνει πάντα με email ή κωδικό.</p>
            ) : !quick.quickSupported() ? (
              <p className="mt-1 text-[12px] text-dim">Αυτός ο browser δεν την υποστηρίζει.</p>
            ) : pinOpen ? (
              <div className="mt-4">
                <PinPad busy={busy} label="Διάλεξε 4ψήφιο PIN"
                  onDone={async pin => {
                    setBusy(true); setErr(null)
                    const t2 = session ? { access_token: session.access_token, refresh_token: session.refresh_token } : null
                    const e2 = t2 ? await quick.enrolPin(pin, me.email ?? '', t2) : 'Δεν υπάρχει ενεργή συνεδρία.'
                    if (e2) setErr(e2); else { setQuickOn(true); setPinOpen(false); say('Το PIN αποθηκεύτηκε σε αυτή τη συσκευή') }
                    setBusy(false)
                  }} />
                <button type="button" onClick={() => setPinOpen(false)} className="mt-4 text-[12px] font-bold uppercase tracking-[.08em] text-dim hover:text-white">Άκυρο</button>
              </div>
            ) : quickOn ? (
              <>
                <p className="mt-1 text-[12px] text-dim">Την επόμενη φορά μπαίνεις με το PIN σου{bioOn ? ' ή με Face ID' : ''}, χωρίς email. Η αποσύνδεση το αφαιρεί από τη συσκευή.</p>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <button type="button" onClick={() => setPinOpen(true)} className="text-[12px] font-bold uppercase tracking-[.08em] text-orange">Αλλαγή PIN</button>
                  {bioOk && (bioOn
                    ? <button type="button" onClick={() => { quick.disableBio(); setBioOn(false); say('Το Face ID απενεργοποιήθηκε') }} className="text-[12px] font-bold uppercase tracking-[.08em] text-dim hover:text-white">Απενεργοποίηση Face ID</button>
                    : <button type="button" disabled={busy} onClick={async () => {
                        setBusy(true); setErr(null)
                        const e2 = await quick.enableBio(me.email ?? '')
                        if (e2) setErr(e2); else { setBioOn(true); say('Το Face ID ενεργοποιήθηκε') }
                        setBusy(false)
                      }} className="text-[12px] font-bold uppercase tracking-[.08em] text-orange disabled:opacity-50">Ενεργοποίηση Face ID / δακτυλικού</button>)}
                  <button type="button" onClick={() => { quick.clearQuick(); setQuickOn(false); setBioOn(false); say('Η γρήγορη είσοδος αφαιρέθηκε') }} className="text-[12px] font-bold uppercase tracking-[.08em] text-dim hover:text-white">Αφαίρεση</button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-1 text-[12px] text-dim">Όρισε 4ψήφιο PIN και μπαίνεις χωρίς email. Το PIN μένει μόνο σε αυτή τη συσκευή — πέντε λάθος προσπάθειες το σβήνουν.</p>
                <button type="button" onClick={() => setPinOpen(true)} className="mt-3 text-[13px] font-bold uppercase tracking-[.08em] text-orange">Όρισε PIN →</button>
              </>
            )}
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
