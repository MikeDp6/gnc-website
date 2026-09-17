#!/usr/bin/env node
// Push the articles produced by import-wp.mjs straight into Supabase, in small batches.
// The SQL editor refuses pastes of this size ("request entity too large"), so this talks to the API instead.
//
//   1) add this line to .env.local (it is git-ignored, and the key never leaves your machine):
//        SUPABASE_SERVICE_ROLE_KEY=<Project Settings → API → service_role secret>
//   2) node scripts/import-wp.mjs import/<export>.xml     (writes supabase/import/news.json)
//   3) node scripts/push-news.mjs
//
// Re-running is safe: rows are matched on slug and updated in place.

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

// --- config from .env.local (no dependency on dotenv) ---
const env = { ...process.env }
const envFile = resolve('.env.local')
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
const url = env.VITE_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url) { console.error('Λείπει το VITE_SUPABASE_URL από το .env.local'); process.exit(1) }
if (!key) {
  console.error('Λείπει το SUPABASE_SERVICE_ROLE_KEY από το .env.local.')
  console.error('Supabase → Project Settings → API → service_role (secret) → πρόσθεσε τη γραμμή:')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=...')
  process.exit(1)
}

const jsonFile = resolve('supabase/import/news.json')
if (!existsSync(jsonFile)) { console.error('Δεν βρέθηκε το supabase/import/news.json — τρέξε πρώτα το scripts/import-wp.mjs'); process.exit(1) }
const rows = JSON.parse(readFileSync(jsonFile, 'utf8'))

const sb = createClient(url, key, { auth: { persistSession: false } })

// the four articles seeded by migration 008 carry a shortened slug — drop them once the real ones arrive
const { error: delErr, count } = await sb.from('news').delete({ count: 'exact' })
  .in('source_url', rows.map(r => r.source_url).filter(Boolean))
  .not('slug', 'in', `(${rows.map(r => `"${r.slug}"`).join(',')})`)
if (delErr) console.warn('(προσοχή) καθαρισμός διπλοεγγραφών:', delErr.message)
else if (count) console.log(`καθαρίστηκαν ${count} διπλές εγγραφές`)

const BATCH = 25
let done = 0
for (let i = 0; i < rows.length; i += BATCH) {
  const slice = rows.slice(i, i + BATCH)
  const { error } = await sb.from('news').upsert(slice, { onConflict: 'slug' })
  if (error) { console.error(`\nΣφάλμα στη δέσμη ${i / BATCH + 1}: ${error.message}`); process.exit(1) }
  done += slice.length
  process.stdout.write(`\r${done}/${rows.length} άρθρα…`)
}
const { count: total } = await sb.from('news').select('id', { count: 'exact', head: true })
console.log(`\n✓ ολοκληρώθηκε — ${total} άρθρα στη βάση`)
