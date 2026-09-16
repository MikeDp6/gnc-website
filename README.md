# GNC 3on3 — website

Vite + React 19 + TypeScript + Tailwind 4 + React Router. Same stack as HoopOps so knowledge and code carry over.

```
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc + vite build → dist/
```

## Structure
- `src/styles/theme.css` — the single source of design tokens (colours, fonts, radii, motion). The Capacitor app imports the same file.
- `src/data/types.ts` — domain types (Tournament, Category, Team, Player, Match, Group).
- `src/data/mock.ts` — Pefki 2026 mock data, used when `.env.local` is absent.
- `src/data/store.tsx` — `DataProvider` / `useData()`: one `Bundle` for the active tournament, from Supabase (`src/lib/api.ts`) or the mock. Realtime on `matches`.
- `supabase/` — migrations + README for the backend.
- `src/i18n` — EL/EN dictionaries + provider. Chrome strings only; content comes from the API in both languages.
- `src/components/layout` — Ticker, Nav, Footer, Band (page header), SubTabs.
- `src/components/ui` — Heading (two-tone), Button, Chip, Reveal (appear on scroll), Countdown, Marquee, Avatar, Timeline.
- `src/components/match|standings|bracket` — MatchRow, MatchCard, StandingsTable, BracketGrid.
- `src/pages` — Home, Tournament, Team, Player (+ placeholders).

## Motion (kept from the reference, all CSS, no library)
- Marquee (ticker, sponsors): `@keyframes marquee` on a duplicated track, pauses on hover.
- Appear on scroll: `.reveal` + IntersectionObserver in `Reveal.tsx`.
- Hover pop: `.pop` (0.3s overshoot ease).
- All disabled under `prefers-reduced-motion`.

## Pages
Public: `/` home · `/tournaments/:slug` · `/teams/:id` · `/players/:id` · `/cities/:id` (pins on the map) · `/archive` (tour + 2026 season) · `/news`, `/news/:slug` · `/rentals` · `/contact` · `/register` (3 steps → `register_team` RPC) · `/join/:code` (teammate joins by invite) · `/kanonismoi` · `/about` · `/volunteer` · `/oroi`.
Admin (`/admin`, code-split): tournaments (details, categories, teams, results, **scheduler**), requests inbox (pending teams + contact/quote), cities, ticker & sponsors.

## Content & assets
- Real GNC content (cities, 2026 calendar, sponsors, articles, rental equipment, rules/about/volunteer/terms) was pulled from gnc3on3.gr into `src/data/mock.ts` and `src/content/pages.ts`. Photos: run `scripts/fetch-assets.ps1` (PowerShell) once → `public/img/gnc/`.
- Schedule PDF: the tournament page's «PDF προγράμματος» button prints an A4 layout (`src/components/PrintSchedule.tsx`, print CSS in theme.css).

## Supabase migrations (run in order in the SQL editor)
001 schema · 002 RLS · 003 seed Pefki · 004 grants · 005 result propagation · 006 cities · 007 registration RPCs (register_team, join_team, submit_contact + contact_requests table).
