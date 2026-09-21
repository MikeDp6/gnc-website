// Email με τις ώρες προσέλευσης στους αρχηγούς των εγκεκριμένων ομάδων μιας διοργάνωσης.
//
// Διαβάζει ό,τι δημοσιεύτηκε στο tournaments.arrivals_json (το ίδιο που βλέπει το κοινό), ώστε το email
// και η σελίδα να λένε πάντα το ίδιο. Κάθε αρχηγός παίρνει μόνο την κατηγορία της ομάδας του — και, αν η
// ομάδα του έχει ήδη προκριθεί, το ζευγάρι του νοκ-άουτ. Αν έχει ξανασταλεί, το θέμα γράφει «Ενημέρωση».
// Μόνο για διαχειριστές. Η αποστολή γίνεται με το batch API του Resend (ως 100 μηνύματα ανά κλήση).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const URL_ = Deno.env.get('SUPABASE_URL')!
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!
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
const norm = (x: string) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim()

interface Row { day: number; dayLabel: string; categoryId: string; category: string; first: string; arrive: string; phase: 'group' | 'ko' }
interface Ko { categoryId: string; dayLabel: string; time: string; court: number; label: string; home: string; away: string }
interface Arrivals { lead: number; rows: Row[]; ko: Ko[] }

const cell = (x: string, big = false) => `<td style="padding:10px 0;border-top:1px solid rgba(255,255,255,0.08);font-family:Arial,Helvetica,sans-serif;font-size:${big ? 22 : 14}px;${big ? 'font-weight:bold;color:#FF8700;' : 'color:#C9CDD1;'}">${x}</td>`

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

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)

  const auth = req.headers.get('Authorization') ?? ''
  if (!auth.startsWith('Bearer ')) return json({ error: 'Χρειάζεται σύνδεση' }, 401)
  const asUser = createClient(URL_, ANON, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } })
  const { data: me } = await asUser.auth.getUser()
  if (!me?.user) return json({ error: 'Χρειάζεται σύνδεση' }, 401)
  const { data: isAdmin } = await asUser.from('admins').select('role').eq('user_id', me.user.id).maybeSingle()
  if (!isAdmin) return json({ error: 'Μόνο για διαχειριστές' }, 403)

  let body: { tournament_id?: string; dry_run?: boolean }
  try { body = await req.json() } catch { return json({ error: 'bad body' }, 400) }
  const db = createClient(URL_, SERVICE, { auth: { persistSession: false } })

  const { data: tour } = await db.from('tournaments')
    .select('id,name,slug,venue,address,arrivals_json,arrivals_emailed_at').eq('id', String(body.tournament_id ?? '')).maybeSingle()
  if (!tour) return json({ error: 'Η διοργάνωση δεν βρέθηκε' }, 404)
  const arr = tour.arrivals_json as Arrivals | null
  if (!arr?.rows?.length) return json({ error: 'Δεν έχουν δημοσιευτεί ώρες προσέλευσης' }, 400)

  const { data: teams } = await db.from('teams')
    .select('id,name,category_id,captain:players!teams_captain_id_fkey(first_name,email)')
    .eq('tournament_id', tour.id).eq('status', 'active')
  type T = { id: string; name: string; category_id: string; captain: { first_name: string; email: string | null } | null }
  const list = ((teams ?? []) as unknown as T[]).filter(t => t.captain?.email && arr.rows.some(r => r.categoryId === t.category_id))
  const skipped = (teams ?? []).length - list.length
  if (body.dry_run) return json({ recipients: list.length, skipped, update: !!tour.arrivals_emailed_at })

  const update = !!tour.arrivals_emailed_at
  const where = [tour.venue, tour.address].filter(Boolean).join(' · ')
  const mails = list.map(t => {
    const rows = arr.rows.filter(r => r.categoryId === t.category_id).sort((a, b) => a.day - b.day)
    const ko = (arr.ko ?? []).filter(k => k.categoryId === t.category_id && (norm(k.home) === norm(t.name) || norm(k.away) === norm(t.name)))
    const cat = rows[0]?.category ?? ''
    const html = shell('Ώρα προσέλευσης', `
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:.16em;text-transform:uppercase;color:#FF8700;padding:0 0 10px 0;">${update ? 'Ενημέρωση · ' : ''}Ώρα προσέλευσης</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:26px;line-height:1.2;font-weight:bold;color:#F5F4F1;padding:0 0 12px 0;">${esc(t.name)} · ${esc(cat)}</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#C9CDD1;padding:0 0 16px 0;">
        Γεια σου ${esc(t.captain!.first_name)}, ${update ? 'άλλαξαν οι ώρες για το' : 'αυτές είναι οι ώρες για το'} <b style="color:#F5F4F1;">${esc(tour.name)}</b>.
        Η ομάδα πρέπει να είναι στο γήπεδο <b style="color:#F5F4F1;">${arr.lead}΄ πριν</b> τον πρώτο αγώνα της κατηγορίας.</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8A9096;">Ημέρα</td>
            <td style="padding:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8A9096;">Προσέλευση</td>
            <td style="padding:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8A9096;">Πρώτος αγώνας</td></tr>
        ${rows.map(r => `<tr>${cell(esc(r.dayLabel) + (r.phase === 'ko' ? ' · νοκ-άουτ' : ''))}${cell(esc(r.arrive), true)}${cell(esc(r.first))}</tr>`).join('')}
      </table>
      ${ko.length ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#C9CDD1;padding:20px 0 6px 0;"><b style="color:#F5F4F1;">Προκριθήκατε.</b> Ο επόμενος αγώνας σας:</div>
        ${ko.map(k => `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#F5F4F1;padding:4px 0;"><b>${esc(k.label)}</b>: ${esc(k.home)} – ${esc(k.away)} · ${esc(k.dayLabel)} ${esc(k.time)} · Γήπεδο ${k.court}</div>`).join('')}` : ''}
      ${where ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#C9CDD1;padding:20px 0 0 0;">📍 ${esc(where)}</div>` : ''}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0 0;"><tr><td bgcolor="#FF8700" style="background:#FF8700;border-radius:999px;">
        <a href="${SITE}/tournaments/${esc(tour.slug)}" style="display:inline-block;padding:14px 30px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;letter-spacing:.06em;text-transform:uppercase;color:#111111;text-decoration:none;">Σελίδα διοργάνωσης</a></td></tr></table>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#8A9096;border-top:1px solid rgba(255,255,255,0.09);margin:24px 0 0 0;padding:16px 0 0 0;">Προώθησε το μήνυμα στους συμπαίκτες σου.</div>`)
    return { from: FROM, to: t.captain!.email!, reply_to: REPLY_TO, subject: `${update ? 'Ενημέρωση: ' : ''}Ώρα προσέλευσης — ${t.name} · ${tour.name}`, html }
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
  if (sent) await db.from('tournaments').update({ arrivals_emailed_at: new Date().toISOString() }).eq('id', tour.id)
  return json({ sent, skipped, failed })
})
