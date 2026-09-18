-- 023: a poster for the stops that are on the calendar but not yet set up as tournaments,
-- so the programme page can show every card with its own poster.
alter table public.season_events add column if not exists poster_url text;
