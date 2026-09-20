-- Arrival times are published on their own, so a tournament can announce when each category shows up
-- without putting the full schedule online. Their own column keeps the scheduler's internal settings
-- (and the results backup inside settings_json) off the public payload.
alter table public.tournaments add column if not exists arrivals_json jsonb;
