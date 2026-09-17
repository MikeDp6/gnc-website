import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/i18n'
import { useMeta } from '@/lib/meta'
import { Heading } from '@/components/ui/Heading'
import { Crumb } from '@/components/ui/Crumb'
import { Button } from '@/components/ui/Button'

/** Player sign-in: a one-time link by email. No password to set, forget or leak. */
export function Login() {
  const { t } = useI18n()
  const { session, sendMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'' | 'busy' | 'sent'>('')
  const [err, setErr] = useState<string | null>(null)
  useMeta(t.account.signIn)
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setState('busy'); setErr(null)
    const error = await sendMagicLink(email)
    if (error) { setErr(error); setState('') } else setState('sent')
  }
  if (session) return <Navigate to="/me" replace />
  return (
    <section className="wrap grid gap-10 pt-10 lg:grid-cols-2">
      <div>
        <Crumb items={[{ label: t.account.signIn }]} />
        <Heading a={t.account.title1} b={t.account.title2} className="mt-4" as="h1" />
        <p className="mt-5 max-w-[520px] text-[16px] text-dim">{t.account.blurb}</p>
        <ul className="mt-6 space-y-3 text-[14px] text-dim">
          {t.account.perks.map(p => <li key={p} className="flex gap-3 border-t border-line pt-3"><span className="text-orange">→</span>{p}</li>)}
        </ul>
      </div>
      <div className="card self-start rounded-band p-7 md:p-9">
        {state === 'sent' ? (
          <>
            <div className="disp text-[38px] text-orange">{t.account.checkMail}</div>
            <p className="mt-3 text-[15px] text-dim">{t.account.sentTo} <b className="text-white">{email}</b>. {t.account.sentHelp}</p>
            <button type="button" onClick={() => { setState(''); setEmail('') }} className="mt-6 text-[13px] font-bold uppercase tracking-[.08em] text-orange">{t.account.again} →</button>
          </>
        ) : (
          <form onSubmit={submit}>
            <div className="disp text-[38px]">{t.account.signIn}</div>
            <p className="mt-2 text-[14px] text-dim">{t.account.emailHelp}</p>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" autoComplete="email"
              className="mt-5 w-full rounded-full border border-white/20 bg-black/25 px-5 py-4 text-[15px] outline-none placeholder:text-mute focus:border-white/40" />
            {err && <div className="mt-3 text-[13px] text-red">{err}</div>}
            <Button type="submit" variant="orange" className="mt-4 w-full rounded-full">{state === 'busy' ? '…' : t.account.send}</Button>
            <p className="mt-5 text-[12px] text-mute">{t.account.note}</p>
          </form>
        )}
      </div>
    </section>
  )
}
