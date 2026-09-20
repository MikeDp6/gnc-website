// Γρήγορη είσοδος με PIN, κριμένο στον server.
//
// Δύο ενέργειες:
//   enrol  — ο ήδη συνδεδεμένος χρήστης καταχωρεί PIN για αυτή τη συσκευή· επιστρέφει device id
//   unlock — η συσκευή στέλνει id + PIN και παίρνει πίσω κανονική συνεδρία Supabase
//
// Η συνεδρία φτιάχνεται με generateLink τύπου magiclink: παίρνουμε το token_hash και το γυρνάμε στον
// πελάτη, που το εξαργυρώνει με verifyOtp. Δεν στέλνεται email — ο σύνδεσμος δεν φεύγει από εδώ.
//
// Στις αποτυχίες η απάντηση είναι πάντα η ίδια, όποιος κι αν είναι ο λόγος: αλλιώς το endpoint
// μαρτυράει ποια αναγνωριστικά συσκευών υπάρχουν.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const URL_ = Deno.env.get('SUPABASE_URL')!
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)

  const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } })

  let body: { action?: string; pin?: string; device?: string; label?: string }
  try { body = await req.json() } catch { return json({ error: 'bad body' }, 400) }
  const pin = String(body.pin ?? '')

  // ---------- καταχώριση ----------
  if (body.action === 'enrol') {
    const auth = req.headers.get('Authorization') ?? ''
    if (!auth.startsWith('Bearer ')) return json({ error: 'Χρειάζεται σύνδεση' }, 401)
    const asUser = createClient(URL_, ANON, {
      global: { headers: { Authorization: auth } },
      auth: { persistSession: false },
    })
    const { data: me, error: meErr } = await asUser.auth.getUser()
    if (meErr || !me?.user) return json({ error: 'Χρειάζεται σύνδεση' }, 401)

    const { data, error } = await admin.rpc('device_enrol', {
      p_user: me.user.id, p_pin: pin, p_label: body.label ?? null,
    })
    if (error) return json({ error: error.message }, 400)
    return json({ device: data })
  }

  // ---------- ξεκλείδωμα ----------
  if (body.action === 'unlock') {
    const device = String(body.device ?? '')
    if (!/^[0-9a-f-]{36}$/i.test(device) || !/^\d{4}$/.test(pin)) return json({ error: 'Λάθος PIN' }, 401)

    const { data, error } = await admin.rpc('device_unlock', { p_device: device, p_pin: pin })
    if (error) return json({ error: 'Λάθος PIN' }, 401)

    const r = data as { ok: boolean; reason?: string; left?: number; until?: string; email?: string }
    if (!r.ok) {
      if (r.reason === 'locked') {
        return json({ error: 'Η συσκευή κλειδώθηκε προσωρινά μετά από πολλές λάθος προσπάθειες.', until: r.until }, 429)
      }
      // άγνωστη συσκευή και λάθος PIN δίνουν το ίδιο μήνυμα
      return json({ error: 'Λάθος PIN', left: r.left }, 401)
    }

    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink', email: r.email!,
    })
    if (linkErr || !link?.properties?.hashed_token) return json({ error: 'Δεν ήταν δυνατή η σύνδεση' }, 500)
    return json({ token_hash: link.properties.hashed_token })
  }

  return json({ error: 'unknown action' }, 400)
})
