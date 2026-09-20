import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { confirmSubscription, unsubscribeByToken } from '@/lib/publicApi'
import { useMeta } from '@/lib/meta'
import { Crumb } from '@/components/ui/Crumb'
import { Heading } from '@/components/ui/Heading'
import { Button } from '@/components/ui/Button'

/**
 * Επιβεβαίωση και διαγραφή από το newsletter, και τα δύο **χωρίς σύνδεση** — ο παραλήπτης ενός
 * μηνύματος δεν έχει λογαριασμό και δεν πρέπει να χρειάζεται. Το token του συνδέσμου είναι το
 * διαπιστευτήριο· η σελίδα δεν δείχνει ποτέ ολόκληρο το email, γιατί ο σύνδεσμος μπορεί να
 * καταλήξει σε ιστορικό browser ή σε προεπισκόπηση.
 */
export function Newsletter({ mode }: { mode: 'confirm' | 'unsubscribe' }) {
  const [params] = useSearchParams()
  const token = params.get('t') ?? ''
  const [state, setState] = useState<'busy' | 'ok' | 'bad'>('busy')
  const [hint, setHint] = useState<string | null>(null)
  const title = mode === 'confirm' ? 'Επιβεβαίωση εγγραφής' : 'Διαγραφή από το newsletter'
  useMeta(title)

  useEffect(() => {
    if (!token) { setState('bad'); return }
    const run = mode === 'confirm' ? confirmSubscription : unsubscribeByToken
    run(token)
      .then(r => { setState(r?.ok ? 'ok' : 'bad'); setHint(r?.hint ?? null) })
      .catch(() => setState('bad'))
  }, [mode, token])

  return (
    <section className="wrap pt-10">
      <Crumb items={[{ label: title }]} />
      <div className="card mt-6 max-w-[560px] p-8">
        {state === 'busy' && <p className="text-[15px] text-dim">Μια στιγμή…</p>}

        {state === 'ok' && mode === 'confirm' && (
          <>
            <Heading a="Μπήκες" b="στη λίστα" as="h1" />
            <p className="mt-4 text-[15px] text-dim">
              {hint ? <>Η διεύθυνση <b className="text-white">{hint}</b> επιβεβαιώθηκε. </> : null}
              Θα μαθαίνεις πρώτος πού σταματάει η περιοδεία, πότε ανοίγουν οι δηλώσεις και πότε βγαίνει το πρόγραμμα.
            </p>
            <Button variant="orange" to="/tournaments" className="mt-6 rounded-full">Δες τις διοργανώσεις →</Button>
          </>
        )}

        {state === 'ok' && mode === 'unsubscribe' && (
          <>
            <Heading a="Διαγράφηκες" b="από τη λίστα" as="h1" />
            <p className="mt-4 text-[15px] text-dim">
              {hint ? <>Η διεύθυνση <b className="text-white">{hint}</b> δεν θα λαμβάνει άλλα μηνύματα. </> : null}
              Αν αλλάξεις γνώμη, γράψου ξανά από το κάτω μέρος οποιασδήποτε σελίδας.
            </p>
            <Button variant="ghost" to="/" className="mt-6 rounded-full">Αρχική</Button>
          </>
        )}

        {state === 'bad' && (
          <>
            <Heading a="Ο σύνδεσμος" b="δεν ισχύει" as="h1" />
            <p className="mt-4 text-[15px] text-dim">
              Μπορεί να έχει χρησιμοποιηθεί ήδη ή να κόπηκε στη μέση από τον πελάτη email σου.
              {mode === 'confirm' ? ' Δοκίμασε να γραφτείς ξανά.' : ' Γράψε μας και σε βγάζουμε εμείς.'}
            </p>
            <Button variant="ghost" to={mode === 'confirm' ? '/' : '/contact'} className="mt-6 rounded-full">
              {mode === 'confirm' ? 'Αρχική' : 'Επικοινωνία'}
            </Button>
          </>
        )}
      </div>
    </section>
  )
}
