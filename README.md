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
