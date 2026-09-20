import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/i18n'
import { useMeta } from '@/lib/meta'
import { Heading } from '@/components/ui/Heading'
import { Crumb } from '@/components/ui/Crumb'
import { Button } from '@/components/ui/Button'
import { PinPad } from '@/components/PinPad'
import { bioSupported, clearQuick, hasBio, hasQuick, quickEmail, unlockWithBio, unlockWithPin } from '@/lib/quickAuth'

/** Player sign-in: a one-time link by email. No password to set, forget or leak. */
export function Login() {
  const { t } = useI18n()
  const { session, isAdmin, sendMagicLink, signIn, sendPasswordReset, signInWithTokenHash } = useAuth()
  // Αυτή η συσκευή έχει ήδη κλειδωμένη συνεδρία → μπες με PIN ή Face ID, χωρίς email
  const [quick, setQuick] = useState(hasQuick())
  const [bioOk, setBioOk] = useState(false)
  useEffect(() => { if (quick && hasBio()) bioSupported().then(setBioOk) }, [quick])
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'' | 'busy' | 'sent' | 'reset'>('')
  const [mode, setMode] = useState<'link' | 'password'>('link')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState<string | null>(null)
  useMeta(t.account.signIn)
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setState('busy'); setErr(null)
    const error = mode === 'link' ? await sendMagicLink(email) : await signIn(email, pw)
    if (error) { setErr(error); setState('') }
    else if (mode === 'link') setState('sent')
    else setState('')   // the session arrives and the redirect below takes over
  }
  const forgot = async () => {
    if (!email.trim()) { setErr('Γράψε πρώτα το email σου.'); return }
    setState('busy'); setErr(null)
    const error = await sendPasswordReset(email)
    if (error) { setErr(error); setState('') } else setState('reset')
  }
  const enter = async (r: { tokenHash?: string; error?: string }) => {
    if (r.error || !r.tokenHash) { setErr(r.error ?? 'Κάτι πήγε στραβά.'); setState(''); return }
    const error = await signInWithTokenHash(r.tokenHash)
    if (error) { setErr(error); setState('') }
  }
  const byPin = async (pin: string) => { setState('busy'); setErr(null); await enter(await unlockWithPin(pin)) }
  const byBio = async () => { setState('busy'); setErr(null); await enter(await unlockWithBio()) }

  if (session) return <Navigate to={isAdmin ? '/admin' : '/me'} replace />
  return (
    <section className="wrap grid gap-10 pt-10 lg:grid-cols-2">
      <div className="lg:order-2">
        <Crumb items={[{ label: t.account.signIn }]} />
        <Heading a={t.account.enter1} b={t.account.enter2} className="mt-4" as="h1" />
        <p className="mt-5 max-w-[520px] text-[16px] text-dim">{t.account.blurb}</p>
        <ul className="mt-6 space-y-3 text-[14px] text-dim">
          {t.account.perks.map(p => <li key={p} className="flex gap-3 border-t border-line pt-3"><span className="text-orange">→</span>{p}</li>)}
        </ul>
      </div>
      <div className="card self-start rounded-band p-7 md:p-9 lg:order-1">
        {quick ? (
          <div className="flex flex-col items-center">
            <div className="disp text-[38px]">Καλώς ήρθες</div>
            <p className="mt-2 text-center text-[14px] text-dim">{quickEmail()}</p>
            <div className="mt-8 w-full">
              <PinPad onDone={byPin} busy={state === 'busy'} label="Βάλε το PIN σου" />
            </div>
            {bioOk && (
              <button type="button" onClick={byBio} disabled={state === 'busy'}
                className="mt-7 flex items-center gap-2 text-[13px] font-bold uppercase tracking-[.08em] text-orange disabled:opacity-50">
                <span aria-hidden className="text-[18px]">☺</span> Face ID / δακτυλικό
              </button>
            )}
            {err && <div className="mt-5 text-center text-[13px] text-red">{err}</div>}
            <button type="button" onClick={() => { setQuick(false); setErr(null); setState('') }}
              className="mt-7 text-[12px] text-mute hover:text-white">Σύνδεση με άλλο τρόπο</button>
            <button type="button" onClick={() => { clearQuick(); setQuick(false); setErr(null) }}
              className="mt-2 text-[12px] text-mute hover:text-white">Δεν είμαι εγώ — σβήσε το PIN από τη συσκευή</button>
          </div>
        ) : state === 'sent' ? (
          <>
            <div className="disp text-[38px] text-orange">{t.account.checkMail}</div>
            <p className="mt-3 text-[15px] text-dim">{t.account.sentTo} <b className="text-white">{email}</b>. {t.account.sentHelp}</p>
            <button type="button" onClick={() => { setState(''); setEmail('') }} className="mt-6 text-[13px] font-bold uppercase tracking-[.08em] text-orange">{t.account.again} →</button>
          </>
        ) : state === 'reset' ? (
          <>
            <div className="disp text-[38px] text-orange">{t.account.checkMail}</div>
            <p className="mt-3 text-[15px] text-dim">{t.account.resetSent}</p>
            <button type="button" onClick={() => { setState(''); setPw('') }} className="mt-6 text-[13px] font-bold uppercase tracking-[.08em] text-orange">{t.account.again} →</button>
          </>
        ) : (
          <form onSubmit={submit}>
            <div className="disp text-[38px]">{t.account.signIn}</div>

            <div className="mt-5 inline-flex rounded-full border border-line p-1">
              {(['link', 'password'] as const).map(m => (
                <button key={m} type="button" onClick={() => { setMode(m); setErr(null) }}
                  className={'rounded-full px-4 py-[7px] text-[12px] font-bold uppercase tracking-[.06em] ' + (mode === m ? 'bg-white text-[#111]' : 'text-dim')}>
                  {m === 'link' ? t.account.byLink : t.account.byPassword}
                </button>
              ))}
            </div>

            <p className="mt-4 text-[14px] text-dim">{mode === 'link' ? t.account.emailHelp : t.account.setPasswordHelp}</p>
            {mode === 'link' && <p className="mt-2 text-[13px] text-mute">{t.account.noAccount}</p>}

            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" autoComplete="email"
              className="mt-5 w-full rounded-full border border-white/20 bg-black/25 px-5 py-4 text-[15px] outline-none placeholder:text-mute focus:border-white/40" />

            {mode === 'password' && (
              <input type="password" required value={pw} onChange={e => setPw(e.target.value)} placeholder={t.account.password} autoComplete="current-password"
                className="mt-3 w-full rounded-full border border-white/20 bg-black/25 px-5 py-4 text-[15px] outline-none placeholder:text-mute focus:border-white/40" />
            )}

            {err && <div className="mt-3 text-[13px] text-red">{err}</div>}
            <Button type="submit" variant="orange" className="mt-4 w-full rounded-full">
              {state === 'busy' ? '…' : mode === 'link' ? t.account.send : t.account.signInCta}
            </Button>

            {mode === 'password'
              ? <button type="button" onClick={forgot} className="mt-4 text-[12px] font-bold uppercase tracking-[.08em] text-orange">{t.account.forgot}</button>
              : <p className="mt-5 text-[12px] text-mute">{t.account.note}</p>}
          </form>
        )}
      </div>
    </section>
  )
}
