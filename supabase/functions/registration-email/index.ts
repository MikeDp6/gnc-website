// Email επιβεβαίωσης δήλωσης, μόνο στον αρχηγό.
//
// Καλείται από τη φόρμα αμέσως μετά την επιτυχή δήλωση, με το id της ομάδας ΚΑΙ τον κωδικό πρόσκλησης
// της. Τον κωδικό τον ξέρει μόνο όποιος μόλις έκανε τη δήλωση, οπότε κανείς δεν μπορεί να στείλει
// μηνύματα για ξένες ομάδες μαντεύοντας id. Κάθε ομάδα παίρνει ένα μήνυμα — το confirmation_sent_at
// το κλειδώνει, ώστε ένα refresh ή ένα διπλό κλικ να μη φέρει δεύτερο.

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
const esc = (x: string) => String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const MONTHS = ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου']
function dates(a: string, b: string) {
  const A = new Date(a + 'T12:00:00Z'), B = new Date(b + 'T12:00:00Z')
  if (a === b) return `${A.getUTCDate()} ${MONTHS[A.getUTCMonth()]} ${A.getUTCFullYear()}`
  if (A.getUTCMonth() === B.getUTCMonth()) return `${A.getUTCDate()}–${B.getUTCDate()} ${MONTHS[A.getUTCMonth()]} ${A.getUTCFullYear()}`
  return `${A.getUTCDate()} ${MONTHS[A.getUTCMonth()]} – ${B.getUTCDate()} ${MONTHS[B.getUTCMonth()]} ${B.getUTCFullYear()}`
}

const row = (k: string, v: string) => `<tr>
  <td style="padding:9px 0;border-top:1px solid rgba(255,255,255,0.08);font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#8A9096;width:130px;vertical-align:top;">${esc(k)}</td>
  <td style="padding:9px 0;border-top:1px solid rgba(255,255,255,0.08);font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#F5F4F1;font-weight:bold;">${v}</td></tr>`

const button = (href: string, label: string) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 0 0;"><tr>
  <td bgcolor="#FF8700" style="background:#FF8700;border-radius:999px;">
    <a href="${href}" style="display:inline-block;padding:14px 30px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;letter-spacing:.06em;text-transform:uppercase;color:#111111;text-decoration:none;">${esc(label)}</a>
  </td></tr></table>`

function shell(title: string, body: string) {
  return `<!doctype html><html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#0A0A0B;" bgcolor="#0A0A0B">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0A0A0B" style="background:#0A0A0B;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:100%;">
  <tr><td style="padding:0 0 22px 0;"><span style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;letter-spacing:.14em;color:#F5F4F1;">GNC</span><span style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;letter-spacing:.14em;color:#FF8700;">&nbsp;3on3</span></td></tr>
  <tr><td bgcolor="#131316" style="background:#131316;border-radius:16px;padding:34px 30px;">${body}</td></tr>
  <tr><td style="padding:20px 4px 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.7;color:#6E7479;">
    Λάβατε αυτό το μήνυμα επειδή δηλώθηκε ομάδα με αυτό το email. Για οποιαδήποτε αλλαγή απαντήστε σε αυτό το μήνυμα.<br>
    LOUX GNC 3on3 · <a href="${SITE}" style="color:#8A9096;text-decoration:none;">gnc3on3.gr</a></td></tr>
</table></td></tr></table></body></html>`
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  let body: { team_id?: string; code?: string }
  try { body = await req.json() } catch { return json({ error: 'bad body' }, 400) }
  const teamId = String(body.team_id ?? ''), code = String(body.code ?? '')
  if (!/^[0-9a-f-]{36}$/i.test(teamId) || !code) return json({ error: 'bad request' }, 400)

  const db = createClient(URL_, SERVICE, { auth: { persistSession: false } })
  const { data: team } = await db.from('teams')
    .select('id,name,status,invite_code,confirmation_sent_at,category_id,captain_id,tournament_id,team_players(role,players(first_name,last_name))')
    .eq('id', teamId).maybeSingle()
  // ίδια απάντηση για «δεν υπάρχει» και «λάθος κωδικός»
  if (!team || team.invite_code !== code) return json({ error: 'not found' }, 404)
  if (team.confirmation_sent_at) return json({ ok: true, already: true })

  const [{ data: tour }, { data: cat }, { data: cap }] = await Promise.all([
    db.from('tournaments').select('name,slug,starts_on,ends_on,venue,address').eq('id', team.tournament_id).single(),
    db.from('categories').select('label').eq('id', team.category_id).single(),
    db.from('players').select('first_name,email').eq('id', team.captain_id).single(),
  ])
  if (!tour || !cap?.email) return json({ error: 'no recipient' }, 400)

  // κλείδωμα πριν την αποστολή: αν δύο κλήσεις φτάσουν μαζί, μόνο μία περνάει
  const { data: locked } = await db.from('teams').update({ confirmation_sent_at: new Date().toISOString() })
    .eq('id', teamId).is('confirmation_sent_at', null).select('id')
  if (!locked?.length) return json({ ok: true, already: true })

  const waitlist = team.status === 'waitlist'
  const mates = (team.team_players as Array<{ role: string; players: { first_name: string; last_name: string } | null }> ?? [])
    .sort((a, b) => (a.role === 'captain' ? -1 : 0) - (b.role === 'captain' ? -1 : 0))
    .map(m => m.players ? `${m.players.first_name} ${m.players.last_name}` : '').filter(Boolean)
  const invite = `${SITE}/join/${team.invite_code}`
  const where = [tour.venue, tour.address].filter(Boolean).join(' · ')

  const html = shell('Η δήλωσή σας καταχωρήθηκε', `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:.16em;text-transform:uppercase;color:#FF8700;padding:0 0 10px 0;">Δήλωση ομάδας</div>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:26px;line-height:1.2;font-weight:bold;color:#F5F4F1;padding:0 0 12px 0;">Η δήλωσή σας καταχωρήθηκε</div>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#C9CDD1;padding:0 0 18px 0;">
      Γεια σου ${esc(cap.first_name)}, η ομάδα <b style="color:#F5F4F1;">${esc(team.name)}</b> δηλώθηκε στο <b style="color:#F5F4F1;">${esc(tour.name)}</b>.
      ${waitlist
        ? 'Η κατηγορία έχει ήδη συμπληρωθεί, οπότε η ομάδα μπήκε στη <b style="color:#FF8700;">λίστα αναμονής</b>. Αν ανοίξει θέση θα σας ενημερώσουμε.'
        : 'Η δήλωση περιμένει την <b style="color:#FF8700;">έγκριση της διοργάνωσης</b>. Μόλις εγκριθεί, η ομάδα θα εμφανιστεί στο πρόγραμμα.'}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px 0;">
      ${row('Διοργάνωση', esc(tour.name))}
      ${row('Ημερομηνίες', esc(dates(tour.starts_on, tour.ends_on)))}
      ${where ? row('Γήπεδο', esc(where)) : ''}
      ${row('Κατηγορία', esc(cat?.label ?? team.category_id))}
      ${row('Ομάδα', esc(team.name))}
      ${row('Παίκτες', mates.map(esc).join('<br>') || '—')}
    </table>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#C9CDD1;padding:0 0 6px 0;">Στείλε αυτόν τον σύνδεσμο στους συμπαίκτες σου για να μπουν στην ομάδα:</div>
    <div style="font-family:'Courier New',monospace;font-size:14px;color:#F5F4F1;background:#0A0A0B;border-radius:10px;padding:12px 14px;margin:0 0 16px 0;word-break:break-all;"><a href="${invite}" style="color:#F5F4F1;text-decoration:none;">${esc(invite)}</a></div>
    ${button(`${SITE}/tournaments/${tour.slug}`, 'Σελίδα διοργάνωσης')}
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#8A9096;border-top:1px solid rgba(255,255,255,0.09);margin:24px 0 0 0;padding:16px 0 0 0;">
      Φτιάξε προφίλ στο <a href="${SITE}/login" style="color:#FF8700;text-decoration:none;">gnc3on3.gr</a> με το ίδιο email για να βλέπεις την ομάδα σου, το πρόγραμμα και τους βαθμούς κατάταξης.</div>`)

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: cap.email, reply_to: REPLY_TO, subject: `Δήλωση ομάδας: ${team.name} — ${tour.name}`, html }),
  })
  if (!r.ok) {
    // ξεκλείδωμα, ώστε μια επόμενη προσπάθεια να μπορεί να το ξαναστείλει
    await db.from('teams').update({ confirmation_sent_at: null }).eq('id', teamId)
    return json({ error: (await r.text()).slice(0, 200) }, 502)
  }
  return json({ ok: true })
})
