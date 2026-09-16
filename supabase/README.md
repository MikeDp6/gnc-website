# Supabase — GNC 3on3

Ξεχωριστό project για την GNC (όχι το HoopOps). Η δομή tournaments/days/teams/matches ακολουθεί το HoopOps ώστε scheduler και arena να πορτάρονται.

## Setup
1. Supabase → New project (`gnc-3on3`, region Europe). «Automatically expose new tables» OFF, «Enable automatic RLS» ON.
2. SQL editor → τρέξε με τη σειρά:
   - `migrations/001_schema.sql` — πίνακες, views (`group_standings`, `players_public`), triggers
   - `migrations/002_rls.sql` — RLS: public read, admin write, players βλέπουν μόνο τον εαυτό τους
   - `migrations/003_seed_pefki.sql` — Πεύκη 2026 (52 πραγματικές ομάδες) + δείγμα ομίλων/αποτελεσμάτων 35+
3. Database → Replication → enable για `matches` (live σκορ / μετακινήσεις) και `ticker_items`.
4. Project Settings → API → URL + anon key → `.env.local` (δες `.env.example`).
5. Για admin: Authentication → πρόσθεσε χρήστη, μετά `insert into public.admins (user_id, role) values ('<uuid>', 'owner');`

## Μοντέλο
- `tournaments` (slug, status, settings_json = ρυθμίσεις scheduler) → `tournament_days`, `tournament_categories` (format, qualifiers)
- `teams` (status pending/active/waitlist, invite_code, checked_in_at) → `team_players` → `players` (user_id προαιρετικό, guardian consent)
- `groups` → `group_teams`; βαθμολογία από το view `group_standings` (νίκη 2, ήττα 1)
- `matches` (phase, day_id, court, slot_time, home/away team ή source `W:<match>` / `G:<group>:<rank>` + label, score, status)
- `tournament_winners` (αρχείο), `sponsors`, `ticker_items`, `cities` (χάρτης), `admins`

## Frontend
`src/lib/api.ts` → `fetchBundle()` διαβάζει τα πάντα για την ενεργή διοργάνωση σε ένα `Bundle`. Χωρίς `.env.local` το site τρέχει με `src/data/mock.ts`. Realtime στα `matches` ξαναφορτώνει το bundle.
