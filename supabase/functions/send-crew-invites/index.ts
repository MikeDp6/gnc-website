// Sends the pending email invitations of one crew, through Resend.
//
// It runs here rather than on Vercel for one reason: the service key never has to leave Supabase.
// The caller's own token proves who they are; the function refuses anyone who is not the captain
// of the crew they are trying to invite for.
//
// Secrets it needs (supabase secrets set …): RESEND_API_KEY, INVITE_FROM, SITE_URL.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SITE = (Deno.env.get('SITE_URL') ?? 'https://gnc3on3.gr').replace(/\/$/, '')
const FROM = Deno.env.get('INVITE_FROM') ?? 'GNC 3on3 <no-reply@send.gnc3on3.gr>'
const RESEND = Deno.env.get('RESEND_API_KEY') ?? ''

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const mail = (crew: string, captain: string, hasAccount: boolean) => {
  const link = hasAccount ? `${SITE}/me` : `${SITE}/login`
  const what = hasAccount
    ? 'Μπες στον λογαριασμό σου για να την αποδεχτείς.'
    : 'Φτιάξε λογαριασμό με αυτή τη διεύθυνση και η πρόσκληση θα σε περιμένει μέσα.'
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:28px 24px;color:#111">
    <p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#e06a1f;margin:0 0 10px">GNC 3on3</p>
    <h1 style="font-size:24px;line-height:1.2;margin:0 0 14px">Ο ${captain} σε κάλεσε στην ομάδα «${crew}»</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 22px">${what}</p>
    <a href="${link}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:999px">Δες την πρόσκληση</a>
    <p style="font-size:12px;color:#777;line-height:1.6;margin:26px 0 0">Αν δεν περίμενες αυτό το μήνυμα, αγνόησέ το — δεν μπαίνεις σε καμία ομάδα αν δεν το αποδεχτείς ο ίδιος.</p>
  </div>`
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (!RESEND) return json({ error: 'RESEND_API_KEY missing' }, 500)

  const token = req.headers.get('Authorization') ?? ''
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: token } },
  })

  const { crewId } = await req.json().catch(() => ({ crewId: null }))
  if (!crewId) return json({ error: 'crewId required' }, 400)

  // my_crew() returns null unless the caller is in the crew, and captain says whether they run it
  const { data: crew, error } = await db.rpc('my_crew', { p_crew: crewId })
  if (error) return json({ error: error.message }, 400)
  if (!crew) return json({ error: 'not found' }, 404)
  if (!crew.captain) return json({ error: 'only the captain can invite' }, 403)

  const captain = (crew.members ?? []).find((m: { role: string }) => m.role === 'captain')?.name ?? 'Ο αρχηγός'
  const pending: Array<{ to: string; hasAccount: boolean }> = [
    ...(crew.invites ?? []).filter((i: { sent: boolean }) => !i.sent).map((i: { email: string }) => ({ to: i.email, hasAccount: false })),
  ]
  if (!pending.length) return json({ sent: 0 })

  let sent = 0
  for (const p of pending) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM, to: [p.to],
        subject: `Πρόσκληση στην ομάδα «${crew.name}»`,
        html: mail(crew.name, captain, p.hasAccount),
      }),
    })
    if (r.ok) sent++
  }

  // mark them, so a second click does not send the same invitation twice
  if (sent) await db.rpc('mark_crew_invites_sent', { p_crew: crewId })
  return json({ sent })
})
