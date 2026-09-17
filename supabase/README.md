# Supabase — GNC 3on3

Ξεχωριστό project για την GNC (όχι το HoopOps). Η δομή tournaments/days/teams/matches ακολουθεί το HoopOps ώστε scheduler και arena να πορτάρονται.

## Setup
1. Supabase → New project (`gnc-3on3`, region Europe). «Automatically expose new tables» OFF, «Enable automatic RLS» ON.
2. SQL editor → τρέξε με τη σειρά:
   - `migrations/001_schema.sql` — πίνακες, views (`group_standings`, `players_public`), triggers
   - `migrations/002_rls.sql` — RLS: public read, admin write, players βλέπουν μόνο τον εαυτό τους
   - `migrations/003_seed_pefki.sql` — Πεύκη 2026 (52 πραγματικές ομάδες) + δείγμα ομίλων/αποτελεσμάτων 35+
   - `migrations/004_grants.sql` — grants στους ρόλους anon/authenticated (απαραίτητο με «expose new tables» OFF)
   - `migrations/005_propagate.sql` — trigger: νικητής → επόμενος γύρος, seeds νοκ-άουτ από βαθμολογία ομίλων
   - `migrations/006_cities.sql` — οι 40 πραγματικές πόλεις της περιοδείας (κουκκίδες χάρτη)
   - `migrations/007_registration.sql` — RPC `register_team` / `join_team` / `submit_contact` + πίνακας `contact_requests` (φόρμες του site)
   - `migrations/008_cms.sql` — CMS: `news`, `rentals`, `season_events`, φωτο/βίντεο πόλεων, bucket `media` + seed με το υπάρχον περιεχόμενο
   - `migrations/009_rankings.sql` — views `team_rankings`, `player_rankings`, `site_stats` (κατάταξη όλων των εποχών + μετρητές αρχικής)
   - `migrations/010_sponsor_tiers.sql` — βαθμίδες χορηγών, `subscribers` + RPC `subscribe` (newsletter), `photos` (γκαλερί ανά διοργάνωση)
3. Database → Replication → enable για `matches` (live σκορ / μετακινήσεις) και `ticker_items`.
4. Project Settings → API → URL + anon key → `.env.local` (δες `.env.example`).
5. Για admin: Authentication → πρόσθεσε χρήστη, μετά `insert into public.admins (user_id, role) values ('<uuid>', 'owner');`

## Μοντέλο
- `tournaments` (slug, status, settings_json = ρυθμίσεις scheduler) → `tournament_days`, `tournament_categories` (format, qualifiers)
- `teams` (status pending/active/waitlist, invite_code, checked_in_at) → `team_players` → `players` (user_id προαιρετικό, guardian consent)
- `groups` → `group_teams`; βαθμολογία από το view `group_standings` (νίκη 2, ήττα 1)
- `matches` (phase, day_id, court, slot_time, home/away team ή source `W:<match>` / `G:<group>:<rank>` + label, score, status)
- `tournament_winners` (αρχείο), `sponsors` (logo_url), `ticker_items`, `cities` (χάρτης + `image_url`, `videos`, `years`), `admins`
- CMS: `news` (slug, body σε Markdown, published), `rentals` (εξοπλισμός/υπηρεσίες), `season_events` (ημερολόγιο σεζόν — και οι στάσεις που δεν τρέχουν από το σύστημα)
- Storage: public bucket `media` (φάκελοι `news/`, `rentals/`, `cities/`, `sponsors/`, `photos/<tournament>/`) — ανέβασμα μόνο από admin
- Κατάταξη: `team_rankings` (ένωση ομάδων με βάση το όνομα), `player_rankings` (με βάση το email της δήλωσης) — νίκη 2, ήττα 1, 1η θέση +10, 2η +6, 3η +4

## Frontend
`src/lib/api.ts` → `fetchBundle()` διαβάζει τα πάντα για την ενεργή διοργάνωση σε ένα `Bundle`. Χωρίς `.env.local` το site τρέχει με `src/data/mock.ts`. Realtime στα `matches` ξαναφορτώνει το bundle.

## Admin panel (`/admin`)
1. Authentication → Users → «Add user» (email + κωδικός, με «Auto confirm»).
2. SQL editor: `insert into public.admins (user_id, role) select id, 'owner' from auth.users where email = 'EMAIL';`
3. Άνοιξε `/admin/login`.
Ενότητες: Διοργανώσεις · Αιτήματα (φόρμες) · Πόλεις (κουκκίδες + φωτο/βίντεο) · Ημερολόγιο (σεζόν) · News · Ενοικιάσεις · Φωτογραφίες (γκαλερί ανά διοργάνωση) · Ticker & χορηγοί (με βαθμίδες και λογότυπα).
Καρτέλες ανά διοργάνωση: Στοιχεία (status, δημόσιο, ημέρες/ώρες/γήπεδα) · Κατηγορίες (format, νοκ-άουτ) · Ομάδες (επικόλληση λίστας, έγκριση, check-in) · Αγώνες & σκορ (live/τελικό — realtime στο site) · Πρόγραμμα (scheduler — επόμενο βήμα).

## Εισαγωγή από το WordPress (gnc3on3.gr)
1. Στο WP: Εργαλεία → Εξαγωγή → «Όλο το περιεχόμενο» → κατεβάζεις το `.xml`.
2. `node scripts/import-wp.mjs <αρχείο>.xml` → φτιάχνει `supabase/import/news_from_wp.sql` (άρθρα με πλήρες κείμενο σε Markdown) και `supabase/import/wp-media.txt`.
3. `.\scripts\fetch-wp-media.ps1` → κατεβάζει τις φωτογραφίες των άρθρων στο `public/img/wp/`.
4. Supabase SQL editor → τρέξε το `news_from_wp.sql` (κάνει upsert στο slug, ξανατρέχει χωρίς διπλοεγγραφές).
Ο φάκελος `supabase/import/` και το `public/img/wp/` είναι στο `.gitignore`.
