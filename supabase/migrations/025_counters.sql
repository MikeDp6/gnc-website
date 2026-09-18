-- 025: the counters of the old site, carried over as a starting point.
--
-- The WordPress site showed four numbers — population reached, spectators, athletes, cities — typed
-- in by hand. They are the record of years of touring and must not be thrown away, so they become
-- the BASELINE: whatever the database counts from now on is added on top.
--
-- site_stats is a view that counts everything live, so the baseline needs a table of its own.
-- counted_since is the line between the two: rows created before it are already inside the baseline,
-- rows created after are counted live. Nothing is counted twice.

create table if not exists public.counter_base (
  id            boolean primary key default true check (id),
  population    bigint      not null default 0,
  spectators    integer     not null default 0,
  base_cities   integer     not null default 0,
  base_players  integer     not null default 0,
  counted_since timestamptz not null default now()
);

insert into public.counter_base (id, population, spectators, base_cities, base_players, counted_since)
values (true, 4103431, 15000, 17, 4000, now())
on conflict (id) do nothing;

alter table public.counter_base enable row level security;
drop policy if exists "read counter_base" on public.counter_base;
create policy "read counter_base" on public.counter_base for select using (true);
drop policy if exists "admin writes counter_base" on public.counter_base;
create policy "admin writes counter_base" on public.counter_base for all using (public.is_admin()) with check (public.is_admin());
grant select on public.counter_base to anon, authenticated;
grant insert, update on public.counter_base to authenticated;

-- cities never recorded when they were added; the ones already there belong to the baseline
alter table public.cities add column if not exists created_at timestamptz not null default now();
update public.cities set created_at = timestamptz '2000-01-01' where created_at > timestamptz '2020-01-01';

-- the view now carries the two hand-written numbers, and adds the live count to the two baselines
create or replace view public.site_stats as
select
  (b.base_cities + (select count(*) from public.cities c where c.created_at > b.counted_since))::int as cities,
  greatest(
    (select count(*) from public.season_events where extract(year from starts_on) = extract(year from current_date)),
    (select count(*) from public.tournaments where is_public)
  )::int                                                                                            as tournaments,
  (select count(distinct lower(btrim(name))) from public.teams where status <> 'removed')::int       as teams,
  (b.base_players + (select count(*) from public.players p where p.created_at > b.counted_since))::int as players,
  (select count(*) from public.matches where status = 'final')::int                                  as matches,
  least(
    2018,
    coalesce((select min(extract(year from starts_on))::int from public.tournaments where is_public), 2018)
  )                                                                                                  as since_year,
  b.population,
  b.spectators
from public.counter_base b
where b.id;

alter view public.site_stats set (security_invoker = off);
grant select on public.site_stats to anon, authenticated;
