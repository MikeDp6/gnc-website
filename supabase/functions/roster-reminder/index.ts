// Υπενθύμιση ρόστερ στους αρχηγούς των ομάδων που δεν έχουν μαζέψει τρεις παίκτες.
//
// Το 3x3 παίζεται 3 εναντίον 3: ομάδα με έναν ή δύο δηλωμένους παίκτες δεν μπορεί να κατέβει. Η συνάρτηση
// βρίσκει μόνη της ποιες ομάδες της διοργάνωσης λείπουν παίκτες, στέλνει στον αρχηγό τον σύνδεσμο
// πρόσκλησης και του λέει μέχρι πότε έχει περιθώριο πριν η ομάδα βγει από τη διοργάνωση.
// Μόνο για διαχειριστές. dry_run = πόσοι θα λάβουν, χωρίς να σταλεί τίποτα.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const URL_ = Deno.env.get('SUPABASE_URL')!
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND = Deno.env.get('RESEND_API_KEY')!
const FROM = Deno.env.get('REGISTRATION_FROM') ?? Deno.env.get('NEWSLETTER_FROM') ?? 'GNC 3on3 <no-reply@send.gnc3on3.gr>'
const REPLY_TO = Deno.env.get('REGISTRATION_REPLY_TO') ?? 'gnc3on3@gmail.com'
const SITE = Deno.env.get('SITE_URL') ?? 'https://gnc3on3.gr'

const MIN = 3   // παίκτες που χρειάζεται μια ομάδα για να είναι έγκυρη

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })
const esc = (x: unknown) => String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function shell(title: string, body: string) {
  return `<!doctype html><html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#0A0A0B;" bgcolor="#0A0A0B">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0A0A0B" style="background:#0A0A0B;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:100%;">
  <tr><td style="padding:0 0 22px 0;"><span style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;letter-spacing:.14em;color:#F5F4F1;">GNC</span><span style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;letter-spacing:.14em;color:#FF8700;">&nbsp;3on3</span></td></tr>
  <tr><td bgcolor="#131316" style="background:#131316;border-radius:16px;padding:34px 30px;">${body}</td></tr>
  <tr><td style="padding:20px 4px 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.7;color:#6E7479;">
    Λάβατε αυτό το μήνυμα ως αρχηγός ομάδας της διοργάνωσης. Για ερωτήσεις απαντήστε σε αυτό το μήνυμα.<br>
    LOUX GNC 3on3 · <a href="${SITE}" style="color:#8A9096;text-decoration:none;">gnc3on3.gr</a></td></tr>
</table></td></tr></table></body></html>`
}

interface Player { first_name: string | null; last_name: string | null; email: string | null }
interface TP { role: string; players: Player | null }
interface T {
  id: string; name: string; status: string; invite_code: string; category_id: string
  captain: Player | null
  team_players: TP[]
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)

  const db = createClient(URL_, SERVICE, { auth: { persistSession: false } })
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!jwt) return json({ error: 'Χρειάζεται σύνδεση (δεν στάλθηκε token)' }, 401)
  const { data: who, error: whoErr } = await db.auth.getUser(jwt)
  if (whoErr || !who?.user) return json({ error: 'Η συνεδρία έληξε — βγες και ξαναμπές στο admin' }, 401)
  const { data: isAdmin } = await db.from('admins').select('role').eq('user_id', who.user.id).maybeSingle()
  if (!isAdmin) return json({ error: 'Ο λογαριασμός δεν είναι διαχειριστής' }, 403)

  let body: { tournament_id?: string; dry_run?: boolean; deadline?: string }
  try { body = await req.json() } catch { return json({ error: 'bad body' }, 400) }
  const deadline = String(body.deadline ?? '').trim()

  const { data: tour } = await db.from('tournaments')
    .select('id,name,slug,starts_on').eq('id', String(body.tournament_id ?? '')).maybeSingle()
  if (!tour) return json({ error: 'Η διοργάνωση δεν βρέθηκε' }, 404)

  const { data: cats } = await db.from('categories').select('id,label')
  const catName = new Map((cats ?? []).map(c => [c.id as string, c.label as string]))

  const { data: teams } = await db.from('teams')
    .select('id,name,status,invite_code,category_id,captain:players!teams_captain_id_fkey(first_name,last_name,email),team_players(role,players(first_name,last_name,email))')
    .eq('tournament_id', tour.id).in('status', ['active', 'pending', 'waitlist'])

  const all = ((teams ?? []) as unknown as T[])
  const short = all.filter(t => (t.team_players?.length ?? 0) < MIN)
  const list = short.filter(t => t.captain?.email)
  const noEmail = short.length - list.length
  if (body.dry_run) {
    return json({
      recipients: list.length, skipped: noEmail, incomplete: short.length, total: all.length,
      teams: short.map(t => ({ name: t.name, players: t.team_players?.length ?? 0, email: !!t.captain?.email })),
    })
  }
  if (!list.length) return json({ sent: 0, skipped: noEmail, failed: [] })

  const mails = list.map(t => {
    const have = t.team_players?.length ?? 0
    const need = MIN - have
    const names = (t.team_players ?? [])
      .map(p => [p.players?.first_name, p.players?.last_name].filter(Boolean).join(' ').trim())
      .filter(Boolean)
    const invite = `${SITE}/join/${t.invite_code}`
    const cat = catName.get(t.category_id) ?? ''
    const html = shell('Λείπουν παίκτες από την ομάδα σου', `
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:.16em;text-transform:uppercase;color:#FF8700;padding:0 0 10px 0;">Η δήλωσή σου δεν είναι ολοκληρωμένη</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:26px;line-height:1.2;font-weight:bold;color:#F5F4F1;padding:0 0 14px 0;">${esc(t.name)}${cat ? ` · ${esc(cat)}` : ''}</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#C9CDD1;padding:0 0 16px 0;">
        Γεια σου ${esc(t.captain!.first_name ?? '')}, η ομάδα σου στο <b style="color:#F5F4F1;">${esc(tour.name)}</b> έχει αυτή τη στιγμή
        <b style="color:#FF8700;">${have} ${have === 1 ? 'παίκτη' : 'παίκτες'}</b> στο ρόστερ.
        Το 3x3 παίζεται τρεις εναντίον τριών, οπότε χρειάζεσαι ${need === 1 ? 'έναν ακόμα παίκτη' : `${need} ακόμα παίκτες`} για να κατέβει η ομάδα.</div>
      ${names.length ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#8A9096;padding:0 0 16px 0;">Στο ρόστερ αυτή τη στιγμή: <span style="color:#C9CDD1;">${esc(names.join(' · '))}</span></div>` : ''}
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#C9CDD1;padding:0 0 6px 0;">
        Στείλε αυτόν τον σύνδεσμο στους συμπαίκτες σου — ο καθένας συμπληρώνει μόνα του τα στοιχεία του:</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;word-break:break-all;padding:0 0 18px 0;"><a href="${invite}" style="color:#FF8700;">${esc(invite)}</a></div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px 0;"><tr><td bgcolor="#FF8700" style="background:#FF8700;border-radius:999px;">
        <a href="${invite}" style="display:inline-block;padding:14px 30px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;letter-spacing:.06em;text-transform:uppercase;color:#111111;text-decoration:none;">Συμπλήρωσε το ρόστερ</a></td></tr></table>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#F5F4F1;background:rgba(255,135,0,0.10);border-left:3px solid #FF8700;padding:14px 16px;border-radius:0 10px 10px 0;">
        Αν η ομάδα δεν έχει ${MIN} παίκτες${deadline ? ` μέχρι <b>${esc(deadline)}</b>` : ' μέχρι την έναρξη των αγώνων'}, θα διαγραφεί από τη διοργάνωση
        ώστε να κληρωθούν οι όμιλοι χωρίς κενά. Αν δυσκολεύεσαι, απάντησε σε αυτό το μήνυμα και το κανονίζουμε.</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#8A9096;border-top:1px solid rgba(255,255,255,0.09);margin:24px 0 0 0;padding:16px 0 0 0;">
        Μπορείς να δεις την κατάσταση της ομάδας σου στη <a href="${SITE}/tournaments/${esc(tour.slug)}" style="color:#8A9096;">σελίδα της διοργάνωσης</a>.</div>`)
    return { from: FROM, to: t.captain!.email!, reply_to: REPLY_TO, subject: `Λείπουν παίκτες — ${t.name} · ${tour.name}`, html }
  })

  let sent = 0; const failed: string[] = []
  for (let i = 0; i < mails.length; i += 100) {
    const chunk = mails.slice(i, i + 100)
    const r = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST', headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' }, body: JSON.stringify(chunk),
    })
    if (r.ok) sent += chunk.length
    else failed.push((await r.text()).slice(0, 200))
  }
  if (sent) {
    const now = new Date().toISOString()
    await db.from('teams').update({ roster_reminded_at: now }).in('id', list.map(t => t.id))
  }
  return json({ sent, skipped: noEmail, failed })
})
