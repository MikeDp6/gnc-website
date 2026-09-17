-- 019: the all-time tables split by category.
-- A name like "Wolves" can be an U13 team one year and an 18+ team the next, so the row a visitor
-- should compare is (ομάδα, κατηγορία), not the name on its own. The views now carry the category and
-- group by it; the site adds the rows up itself for the «Όλες» view.

-- the column list changes, and Postgres will not let a replace reorder columns, so both views go first
drop view if exists public.player_rankings;
drop view if exists public.team_rankings;

create view public.team_rankings as
with agg as (
  select team_key,
         category_id,
         max(team_name)                                          as name,
         count(distinct tournament_id)::int                      as tournaments,
         count(match_id)::int                                    as played,
         count(match_id) filter (where points_for > points_against)::int as wins,
         count(match_id) filter (where points_for < points_against)::int as losses,
         coalesce(sum(points_for), 0)::int                        as points_for,
         coalesce(sum(points_against), 0)::int                    as points_against,
         max(team_id::text)                                       as sample_team
  from public.team_results
  group by team_key, category_id
),
medals as (
  select lower(btrim(t.name)) as team_key,
         t.category_id,
         count(*) filter (where w.place = 1)::int as gold,
         count(*) filter (where w.place = 2)::int as silver,
         count(*) filter (where w.place = 3)::int as bronze
  from public.tournament_winners w
  join public.teams t on t.id = w.team_id
  group by 1, 2
)
select a.team_key, a.category_id, a.name, a.tournaments, a.played, a.wins, a.losses,
       a.points_for, a.points_against,
       coalesce(m.gold, 0)   as gold,
       coalesce(m.silver, 0) as silver,
       coalesce(m.bronze, 0) as bronze,
       a.sample_team::uuid   as team_id,
       (a.wins * 2 + a.losses + coalesce(m.gold, 0) * 10 + coalesce(m.silver, 0) * 6 + coalesce(m.bronze, 0) * 4)::int as points
from agg a
left join medals m on m.team_key = a.team_key and m.category_id is not distinct from a.category_id;

create view public.player_rankings as
with mine as (
  select tp.player_id, r.*
  from public.team_players tp
  join public.team_results r on r.team_id = tp.team_id
),
agg as (
  select player_id,
         category_id,
         count(distinct tournament_id)::int as tournaments,
         count(distinct team_key)::int      as teams,
         count(match_id)::int               as played,
         count(match_id) filter (where points_for > points_against)::int as wins,
         count(match_id) filter (where points_for < points_against)::int as losses
  from mine group by player_id, category_id
),
medals as (
  select tp.player_id,
         t.category_id,
         count(*) filter (where w.place = 1)::int as gold,
         count(*) filter (where w.place = 2)::int as silver,
         count(*) filter (where w.place = 3)::int as bronze
  from public.tournament_winners w
  join public.team_players tp on tp.team_id = w.team_id
  join public.teams t on t.id = w.team_id
  group by 1, 2
)
select a.player_id, a.category_id, p.display_name, p.city, p.since_year, p.avatar_url,
       a.tournaments, a.teams, a.played, a.wins, a.losses,
       coalesce(m.gold, 0) as gold, coalesce(m.silver, 0) as silver, coalesce(m.bronze, 0) as bronze,
       (a.wins * 2 + a.losses + coalesce(m.gold, 0) * 10 + coalesce(m.silver, 0) * 6 + coalesce(m.bronze, 0) * 4)::int as points
from agg a
join public.players p on p.id = a.player_id
left join medals m on m.player_id = a.player_id and m.category_id is not distinct from a.category_id;

alter view public.team_rankings set (security_invoker = off);
alter view public.player_rankings set (security_invoker = off);
grant select on public.team_rankings, public.player_rankings to anon, authenticated;
