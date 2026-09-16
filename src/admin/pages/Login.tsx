import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Logo } from '@/components/layout/Logo'

export function Login() {
  const { session, signIn } = useAuth()
  const loc = useLocation()
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false)
  if (session) return <Navigate to={(loc.state as { from?: string })?.from ?? '/admin'} replace />
  const submit = async (e: FormEvent) => { e.preventDefault(); setBusy(true); setErr(await signIn(email, pw)); setBusy(false) }
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6 text-ink">
      <form onSubmit={submit} className="card w-full max-w-[400px] p-8">
        <Logo className="mb-6" height={64} />
        <div className="kicker mb-4">Είσοδος διαχειριστή</div>
        <label className="mb-3 block text-[13px]"><span className="mb-1 block text-dim">Email</span>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-[10px] border border-line bg-transparent px-4 py-3 outline-none focus:border-white/30" /></label>
        <label className="mb-5 block text-[13px]"><span className="mb-1 block text-dim">Κωδικός</span>
          <input type="password" required value={pw} onChange={e => setPw(e.target.value)} className="w-full rounded-[10px] border border-line bg-transparent px-4 py-3 outline-none focus:border-white/30" /></label>
        {err && <div className="mb-4 rounded-lg bg-red/20 px-3 py-2 text-[13px] text-white">{err}</div>}
        <button disabled={busy} className="w-full rounded-[10px] bg-blue py-3 text-[14px] font-bold text-white disabled:opacity-50">{busy ? 'Σύνδεση…' : 'Είσοδος'}</button>
      </form>
    </div>
  )
}
