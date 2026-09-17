-- 009: all-time rankings (teams and players across every tournament) + counters for the home page.
-- Teams are one row per registration, so the all-time table groups by the team name; players keep one row
-- across tournaments because register_team/join_team reuse them by email.

-- every final match of a public tournament, once per side
create or replace view public.team_results as
select t.id              as team_id,
       lower(btrim(t.name)) as team_key,
       t.name            as team_name,
       t.tournament_id,
       t.category_id,
       m.id              as match_id,
       case when m.home_team_id = t.id then m.home_score else m.away_score end as points_for,
       case when m.home_team_id = t.id then m.away_score else m.home_score end as points_against
from public.teams t
join public.tournaments tr on tr.id = t.tournament_id and tr.is_public
left join public.matches m
       on m.status = 'final' and m.home_score is not null and m.away_score is not null
      and t.id in (m.home_team_id, m.away_team_id)
where t.status <> 'removed';

-- βαθμοί = 2 ανά νίκη + 1 ανά ήττα (όπως στους ομίλους) + μπόνους θέσης: 1η 10, 2η 6, 3η 4
create or replace view public.team_rankings as
with agg as (
  select team_key,
         max(team_name)                                          as name,
         count(distinct tournament_id)::int                      as tournaments,
         count(match_id)::int                                    as played,
         count(match_id) filter (where points_for > points_against)::int as wins,
         count(match_id) filter (where points_for < points_against)::int as losses,
         coalesce(sum(points_for), 0)::int                        as points_for,
         coalesce(sum(points_against), 0)::int                    as points_against,
         max(team_id::text)                                       as sample_team
  from public.team_results
  group by team_key
),
medals as (
  select lower(btrim(t.name)) as team_key,
         count(*) filter (where w.place = 1)::int as gold,
         count(*) filter (where w.place = 2)::int as silver,
         count(*) filter (where w.place = 3)::int as bronze
  from public.tournament_winners w
  join public.teams t on t.id = w.team_id
  group by 1
)
select a.team_key, a.name, a.tournaments, a.played, a.wins, a.losses, a.points_for, a.points_against,
       coalesce(m.gold, 0)   as gold,
       coalesce(m.silver, 0) as silver,
       coalesce(m.bronze, 0) as bronze,
       a.sample_team::uuid   as team_id,
       (a.wins * 2 + a.losses + coalesce(m.gold, 0) * 10 + coalesce(m.silver, 0) * 6 + coalesce(m.bronze, 0) * 4)::int as points
from agg a
left join medals m on m.team_key = a.team_key;

create or replace view public.player_rankings as
with mine as (
  select tp.player_id, r.*
  from public.team_players tp
  join public.team_results r on r.team_id = tp.team_id
),
agg as (
  select player_id,
         count(distinct tournament_id)::int as tournaments,
         count(distinct team_key)::int      as teams,
         count(match_id)::int               as played,
         count(match_id) filter (where points_for > points_against)::int as wins,
         count(match_id) filter (where points_for < points_against)::int as losses
  from mine group by player_id
),
medals as (
  select tp.player_id,
         count(*) filter (where w.place = 1)::int as gold,
         count(*) filter (where w.place = 2)::int as silver,
         count(*) filter (where w.place = 3)::int as bronze
  from public.tournament_winners w
  join public.team_players tp on tp.team_id = w.team_id
  group by 1
)
select a.player_id, p.display_name, p.city, p.since_year, p.avatar_url,
       a.tournaments, a.teams, a.played, a.wins, a.losses,
       coalesce(m.gold, 0) as gold, coalesce(m.silver, 0) as silver, coalesce(m.bronze, 0) as bronze,
       (a.wins * 2 + a.losses + coalesce(m.gold, 0) * 10 + coalesce(m.silver, 0) * 6 + coalesce(m.bronze, 0) * 4)::int as points
from agg a
join public.players p on p.id = a.player_id
left join medals m on m.player_id = a.player_id;

-- one row, for the counters on the home page
create or replace view public.site_stats as
select (select count(*) from public.cities)::int                                            as cities,
       (select count(*) from public.tournaments where is_public)::int                        as tournaments,
       (select count(distinct lower(btrim(name))) from public.teams where status <> 'removed')::int as teams,
       (select count(*) from public.players)::int                                            as players,
       (select count(*) from public.matches where status = 'final')::int                     as matches,
       (select coalesce(min(extract(year from starts_on))::int, 2018) from public.tournaments where is_public) as since_year;

-- views run as owner so RLS on the base tables does not hide rows from the public projections
alter view public.team_results set (security_invoker = off);
alter view public.team_rankings set (security_invoker = off);
alter view public.player_rankings set (security_invoker = off);
alter view public.site_stats set (security_invoker = off);
grant select on public.team_rankings, public.player_rankings, public.site_stats to anon, authenticated;
grant select on public.team_results to authenticated;
