-- 012: honest counters for the home page.
-- 009 counted «διοργανώσεις» as the tournaments run through the system (1 so far) and derived the starting
-- year from them (2026). The tour is older and much larger than what the system has seen: the season
-- calendar holds every stop of the year, and GNC has been running since 2018.

create or replace view public.site_stats as
select
  (select count(*) from public.cities where lat is not null and lng is not null)::int as cities,
  greatest(
    (select count(*) from public.season_events where extract(year from starts_on) = extract(year from current_date)),
    (select count(*) from public.tournaments where is_public)
  )::int                                                                              as tournaments,
  (select count(distinct lower(btrim(name))) from public.teams where status <> 'removed')::int as teams,
  (select count(*) from public.players)::int                                          as players,
  (select count(*) from public.matches where status = 'final')::int                   as matches,
  least(
    2018,
    coalesce((select min(extract(year from starts_on))::int from public.tournaments where is_public), 2018),
    coalesce((select min(extract(year from published_on))::int from public.news), 2018)
  )::int                                                                              as since_year;

alter view public.site_stats set (security_invoker = off);
grant select on public.site_stats to anon, authenticated;
