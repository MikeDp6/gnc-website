// Απάντηση σε αίτημα επικοινωνίας, με αποστολή email από το admin.
// Μόνο διαχειριστές. Το μήνυμα φεύγει από τη διεύθυνση της διοργάνωσης, με reply-to το κανονικό email,
// ώστε η απάντηση του παραλήπτη να έρθει εκεί. Ό,τι στάλθηκε αποθηκεύεται πάνω στο αίτημα.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const URL_ = Deno.env.get('SUPABASE_URL')!
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND = Deno.env.get('RESEND_API_KEY')!
const FROM = Deno.env.get('REGISTRATION_FROM') ?? Deno.env.get('NEWSLETTER_FROM') ?? 'GNC 3on3 <no-reply@send.gnc3on3.gr>'
const REPLY_TO = Deno.env.get('REGISTRATION_REPLY_TO') ?? 'gnc3on3@gmail.com'
const SITE = Deno.env.get('SITE_URL') ?? 'https://gnc3on3.gr'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })
const esc = (x: unknown) => String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const para = (t: string) => esc(t).split(/\n{2,}/).map(p => `<p style="margin:0 0 14px 0;">${p.replace(/\n/g, '<br>')}</p>`).join('')

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)

  // Ο έλεγχος γίνεται με το κλειδί υπηρεσίας: το token του διαχειριστή ελέγχεται απευθείας, χωρίς να
  // εξαρτάται από το ανώνυμο κλειδί — εκεί κολλούσε και έβγαινε «Χρειάζεται σύνδεση».
  const db = createClient(URL_, SERVICE, { auth: { persistSession: false } })
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!jwt) return json({ error: 'Χρειάζεται σύνδεση (δεν στάλθηκε token)' }, 401)
  const { data: who, error: whoErr } = await db.auth.getUser(jwt)
  if (whoErr || !who?.user) return json({ error: 'Η συνεδρία έληξε — βγες και ξαναμπές στο admin' }, 401)
  const { data: isAdmin } = await db.from('admins').select('role').eq('user_id', who.user.id).maybeSingle()
  if (!isAdmin) return json({ error: 'Ο λογαριασμός δεν είναι διαχειριστής' }, 403)

  let body: { id?: string; message?: string }
  try { body = await req.json() } catch { return json({ error: 'bad body' }, 400) }
  const text = String(body.message ?? '').trim()
  if (!text) return json({ error: 'Γράψε την απάντηση' }, 400)

  const { data: r } = await db.from('contact_requests').select('id,name,email,subject,item,message,kind').eq('id', String(body.id ?? '')).maybeSingle()
  if (!r?.email) return json({ error: 'Το αίτημα δεν βρέθηκε' }, 404)

  const topic = r.subject || r.item || (r.kind === 'quote' ? 'Προσφορά ενοικίασης' : 'Επικοινωνία')
  const html = `<!doctype html><html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>${esc(topic)}</title></head>
<body style="margin:0;padding:0;background:#0A0A0B;" bgcolor="#0A0A0B">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0A0A0B" style="background:#0A0A0B;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:100%;">
  <tr><td style="padding:0 0 22px 0;"><span style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;letter-spacing:.14em;color:#F5F4F1;">GNC</span><span style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;letter-spacing:.14em;color:#FF8700;">&nbsp;3on3</span></td></tr>
  <tr><td bgcolor="#131316" style="background:#131316;border-radius:16px;padding:32px 30px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#E7E7E4;">
    <div style="font-size:11px;font-weight:bold;letter-spacing:.16em;text-transform:uppercase;color:#FF8700;padding:0 0 12px 0;">Απάντηση</div>
    <p style="margin:0 0 14px 0;">Γεια σου ${esc(r.name)},</p>
    ${para(text)}
    ${r.message ? `<div style="border-top:1px solid rgba(255,255,255,0.09);margin:22px 0 0 0;padding:16px 0 0 0;font-size:13px;color:#8A9096;">
      <b style="color:#C9CDD1;">Το μήνυμά σου:</b><br>${esc(r.message).replace(/\n/g, '<br>')}</div>` : ''}
  </td></tr>
  <tr><td style="padding:20px 4px 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.7;color:#6E7479;">
    LOUX GNC 3on3 · <a href="${SITE}" style="color:#8A9096;text-decoration:none;">gnc3on3.gr</a> · Απάντησε σε αυτό το μήνυμα για να μας βρεις.</td></tr>
</table></td></tr></table></body></html>`

  const send = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: r.email, reply_to: REPLY_TO, subject: `GNC 3on3 — ${topic}`, html }),
  })
  if (!send.ok) return json({ error: (await send.text()).slice(0, 200) }, 502)

  await db.from('contact_requests').update({ reply: text, replied_at: new Date().toISOString(), handled: true }).eq('id', r.id)
  return json({ ok: true })
})
