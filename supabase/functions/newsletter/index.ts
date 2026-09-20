// Newsletter: εγγραφή με διπλή επιβεβαίωση, και αποστολή εκστρατείας σε παρτίδες.
//
// Γιατί περνάει από εδώ και όχι από τη βάση απευθείας: το token επιβεβαίωσης δεν πρέπει να φτάσει
// ποτέ στον browser αυτού που γράφτηκε — αλλιώς θα μπορούσε να επιβεβαιώσει email που δεν κατέχει,
// και η διπλή επιβεβαίωση θα ήταν διακοσμητική. Φεύγει μόνο μέσα στο μήνυμα.
//
// Η αποστολή γίνεται σε παρτίδες επειδή το δωρεάν Resend δίνει 100 μηνύματα την ημέρα. Κάθε κλήση
// στέλνει ως `limit` παραλήπτες, καταγράφει τι πήγε και τι έσκασε, και λέει πόσοι απομένουν.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const URL_ = Deno.env.get('SUPABASE_URL')!
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!
const RESEND = Deno.env.get('RESEND_API_KEY')!
const FROM = Deno.env.get('NEWSLETTER_FROM') ?? 'GNC 3on3 <no-reply@send.gnc3on3.gr>'
const SITE = Deno.env.get('SITE_URL') ?? 'https://gnc3on3.gr'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

const esc = (x: string) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Το ίδιο περίβλημα με τα πρότυπα του λογαριασμού, ώστε τα μηνύματα να μοιάζουν μεταξύ τους. */
function shell(title: string, bodyHtml: string, footHtml: string) {
  return `<!doctype html><html lang="el"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark">
<title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#0A0A0B;" bgcolor="#0A0A0B">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0A0A0B" style="background:#0A0A0B;">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:100%;">
    <tr><td align="left" style="padding:0 0 22px 0;">
      <span style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;letter-spacing:.14em;color:#F5F4F1;">GNC</span><span style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;letter-spacing:.14em;color:#FF8700;">&nbsp;3on3</span>
    </td></tr>
    <tr><td bgcolor="#131316" style="background:#131316;border-radius:16px;padding:36px 32px;">${bodyHtml}</td></tr>
    <tr><td align="left" style="padding:20px 4px 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.7;color:#6E7479;">
      ${footHtml}
    </td></tr>
  </table>
</td></tr></table></body></html>`
}

const button = (href: string, label: string) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;"><tr>
  <td bgcolor="#FF8700" style="background:#FF8700;border-radius:999px;">
    <a href="${href}" style="display:inline-block;padding:15px 34px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;letter-spacing:.06em;text-transform:uppercase;color:#111111;text-decoration:none;">${esc(label)}</a>
  </td></tr></table>`

async function send(to: string, subject: string, html: string, unsubUrl?: string) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM, to, subject, html,
      // ο πελάτης email δείχνει δικό του κουμπί διαγραφής· μετράει για την παράδοση
      ...(unsubUrl ? { headers: { 'List-Unsubscribe': `<${unsubUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } } : {}),
    }),
  })
  if (!r.ok) throw new Error((await r.text()).slice(0, 200))
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } })

  let body: { action?: string; email?: string; lang?: string; source?: string; campaign?: string; limit?: number }
  try { body = await req.json() } catch { return json({ error: 'bad body' }, 400) }

  // ---------- εγγραφή με διπλή επιβεβαίωση ----------
  if (body.action === 'subscribe') {
    const email = String(body.email ?? '').trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'Μη έγκυρο email' }, 400)
    const lang = body.lang === 'en' ? 'en' : 'el'

    const { data: row, error } = await admin.from('subscribers')
      .upsert({ email, lang, source: body.source ?? 'site' }, { onConflict: 'email' })
      .select('id, confirm_token, confirmed, confirm_sent_at').single()
    if (error) return json({ error: error.message }, 400)

    // ήδη επιβεβαιωμένος: δεν ξαναστέλνουμε, και δεν το μαρτυράμε κιόλας
    if (row.confirmed) return json({ ok: true })
    // απλό φρένο σε επαναλαμβανόμενα αιτήματα για το ίδιο email
    if (row.confirm_sent_at && Date.now() - Date.parse(row.confirm_sent_at) < 10 * 60_000) return json({ ok: true })

    const url = `${SITE}/newsletter/confirm?t=${row.confirm_token}`
    const html = shell('Επιβεβαίωσε την εγγραφή σου', `
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:.16em;text-transform:uppercase;color:#9A9FA3;padding:0 0 10px 0;">Newsletter</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:27px;line-height:1.2;font-weight:bold;color:#F5F4F1;padding:0 0 14px 0;">Επιβεβαίωσε την εγγραφή σου</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#C9CDD1;">Ένα κλικ και θα μαθαίνεις πρώτος πού σταματάει η περιοδεία, πότε ανοίγουν οι δηλώσεις και πότε βγαίνει το πρόγραμμα.</div>
      ${button(url, 'Επιβεβαίωση')}
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#8A9096;border-top:1px solid rgba(255,255,255,0.09);padding:18px 0 0 0;">Αν δεν γράφτηκες εσύ, αγνόησε αυτό το μήνυμα — χωρίς αυτό το κλικ δεν θα λάβεις τίποτα άλλο.</div>`,
      `LOUX GNC 3on3 · <a href="${SITE}" style="color:#8A9096;text-decoration:none;">gnc3on3.gr</a>`)

    try { await send(email, 'Επιβεβαίωσε την εγγραφή σου — GNC 3on3', html) }
    catch (e) { return json({ error: String((e as Error).message) }, 502) }
    await admin.from('subscribers').update({ confirm_sent_at: new Date().toISOString() }).eq('id', row.id)
    return json({ ok: true })
  }

  // ---------- αποστολή εκστρατείας ----------
  if (body.action === 'send') {
    const auth = req.headers.get('Authorization') ?? ''
    if (!auth.startsWith('Bearer ')) return json({ error: 'Χρειάζεται σύνδεση' }, 401)
    const asUser = createClient(URL_, ANON, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } })
    const { data: me } = await asUser.auth.getUser()
    if (!me?.user) return json({ error: 'Χρειάζεται σύνδεση' }, 401)
    const { data: isAdmin } = await asUser.from('admins').select('role').eq('user_id', me.user.id).maybeSingle()
    if (!isAdmin) return json({ error: 'Μόνο για διαχειριστές' }, 403)

    const id = String(body.campaign ?? '')
    const limit = Math.min(Math.max(Number(body.limit ?? 50), 1), 100)
    const { data: c, error: cErr } = await admin.from('newsletter_campaigns').select('*').eq('id', id).single()
    if (cErr || !c) return json({ error: 'Η εκστρατεία δεν βρέθηκε' }, 404)

    let q = admin.from('subscribers').select('id, email, lang, unsub_token')
      .eq('confirmed', true).is('unsubscribed_at', null)
    if (c.lang !== 'all') q = q.eq('lang', c.lang)
    const { data: subs, error: sErr } = await q
    if (sErr) return json({ error: sErr.message }, 400)

    const { data: done } = await admin.from('newsletter_sends').select('subscriber_id').eq('campaign_id', id)
    const already = new Set((done ?? []).map(d => d.subscriber_id))
    const queue = (subs ?? []).filter(s => !already.has(s.id)).slice(0, limit)

    await admin.from('newsletter_campaigns').update({ status: 'sending' }).eq('id', id)

    let ok = 0
    for (const s of queue) {
      const unsub = `${SITE}/newsletter/unsubscribe?t=${s.unsub_token}`
      const paragraphs = String(c.body).split(/\n{2,}/).map(p =>
        `<p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#C9CDD1;margin:0 0 16px 0;">${esc(p).replace(/\n/g, '<br>')}</p>`).join('')
      const html = shell(c.subject, `
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:1.25;font-weight:bold;color:#F5F4F1;padding:0 0 16px 0;">${esc(c.subject)}</div>
        ${paragraphs}`,
        `LOUX GNC 3on3 · <a href="${SITE}" style="color:#8A9096;text-decoration:none;">gnc3on3.gr</a><br>
         <a href="${unsub}" style="color:#6E7479;text-decoration:underline;">Διαγραφή από το newsletter</a>`)
      try {
        await send(s.email, c.subject, html, unsub)
        await admin.from('newsletter_sends').insert({ campaign_id: id, subscriber_id: s.id })
        ok++
      } catch (e) {
        await admin.from('newsletter_sends').insert({ campaign_id: id, subscriber_id: s.id, error: String((e as Error).message).slice(0, 300) })
      }
    }

    const remaining = (subs ?? []).length - already.size - queue.length
    const { count } = await admin.from('newsletter_sends').select('*', { count: 'exact', head: true }).eq('campaign_id', id).is('error', null)
    await admin.from('newsletter_campaigns').update({
      sent_count: count ?? 0,
      status: remaining > 0 ? 'sending' : 'sent',
      sent_at: remaining > 0 ? null : new Date().toISOString(),
    }).eq('id', id)

    return json({ sent: ok, failed: queue.length - ok, remaining })
  }

  return json({ error: 'unknown action' }, 400)
})
