#!/usr/bin/env node
// Quick health check: reads the database with the public (anon) key — exactly what a visitor's browser sees.
//   node scripts/check-db.mjs
// Anything marked ERR means the site will not show that section.

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const env = { ...process.env }
const f = resolve('.env.local')
if (existsSync(f)) for (const l of readFileSync(f, 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) { console.error('Λείπουν VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY από το .env.local'); process.exit(1) }
const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })

const count = async t => { const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true }); return error ? 'ERR ' + error.message : count }

console.log('\n— Πίνακες (όπως τους βλέπει ο επισκέπτης) —')
for (const t of ['tournaments', 'teams', 'matches', 'groups', 'cities', 'news', 'rentals', 'season_events', 'sponsors', 'photos'])
  console.log(' ', t.padEnd(15), await count(t))

console.log('\n— Views —')
const stats = await sb.from('site_stats').select('*').single()
console.log('  site_stats     ', stats.error ? 'ERR ' + stats.error.message : JSON.stringify(stats.data))
const tr = await sb.from('team_rankings').select('name,points').order('points', { ascending: false }).limit(3)
console.log('  team_rankings  ', tr.error ? 'ERR ' + tr.error.message : tr.data.map(x => `${x.name}:${x.points}`).join('  '))
const pr = await sb.from('player_rankings').select('display_name,points').order('points', { ascending: false }).limit(3)
console.log('  player_rankings', pr.error ? 'ERR ' + pr.error.message : pr.data.map(x => `${x.display_name}:${x.points}`).join('  '))

console.log('\n— Δείγματα —')
const news = await sb.from('news').select('slug,tag,published_on,image_url,body').order('published_on', { ascending: false }).limit(1)
if (news.error) console.log('  news           ERR ' + news.error.message)
else { const n = news.data[0]; console.log(`  τελευταίο άρθρο ${n.published_on} [${n.tag}] ${n.slug.slice(0, 50)}…`); console.log(`  φωτογραφία      ${n.image_url ?? '—'}`); console.log(`  κείμενο         ${(n.body ?? '').length} χαρακτήρες`) }
const city = await sb.from('cities').select('name,image_url,years,videos').eq('id', 'patra').single()
console.log('  Πάτρα          ', city.error ? 'ERR ' + city.error.message : `${city.data.image_url ?? '—'} · ${(city.data.years ?? []).join(',')} · ${(city.data.videos ?? []).length} βίντεο`)
const sp = await sb.from('sponsors').select('name,tier').order('sort_order')
console.log('  χορηγοί        ', sp.error ? 'ERR ' + sp.error.message : sp.data.map(x => `${x.name}/${x.tier}`).join(', '))

// the write path a visitor uses (nothing is stored: the address is not a real one)
const probe = await sb.rpc('subscribe', { p_email: 'check@example.invalid', p_lang: 'el', p_source: 'check' })
console.log('\n— Φόρμες —\n  newsletter RPC ', probe.error ? 'ERR ' + probe.error.message : 'ok')
console.log()
