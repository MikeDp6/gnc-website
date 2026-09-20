-- Η κατάταξη ακολουθεί ΑΝΘΡΩΠΟΥΣ. Δύο αλλαγές ουσίας:
--
-- 1. Ο τύπος γίνεται: 2 ανά νίκη, συν 10 / 6 / 4 για 1η, 2η και 3η θέση κατηγορίας.
--    Ο βαθμός της ήττας φεύγει — έδινε προβάδισμα σε όποιον απλώς εμφανίζεται παντού.
--
-- 2. Η κατάταξη ομάδων καταργείται. Ομαδοποιούσε με το ΟΝΟΜΑ, που αλλάζει από τουρνουά σε τουρνουά
--    ενώ οι άνθρωποι μένουν οι ίδιοι — ακριβώς η σύγχυση που θέλαμε να φύγει.
--
-- Και ένα κενό που έκρυβε ο παλιός κώδικας: το μπόνους διαβαζόταν από τον πίνακα tournament_winners,
-- στον οποίο δεν γράφει καμία οθόνη. Δηλαδή δεν ενεργοποιούνταν ποτέ. Τώρα οι θέσεις βγαίνουν μόνες
-- τους από τα αποτελέσματα, με τον πίνακα να παραμένει χειροκίνητη παράκαμψη όπου χρειαστεί.

-- ---------- ποιος τερμάτισε πού, ανά κατηγορία ----------
create or replace view public.category_places as
with manual as (
  select tournament_id, category_id, team_id, place from public.tournament_winners
),
fin as (   -- ο τελικός δίνει 1η και 2η θέση
  select m.tournament_id, m.category_id,
         case when m.home_score > m.away_score then m.home_team_id else m.away_team_id end as winner,
         case when m.home_score > m.away_score then m.away_team_id else m.home_team_id end as runner
  from public.matches m
  where m.phase = 'final' and m.status = 'final'
    and m.home_score is not null and m.away_score is not null and m.home_score <> m.away_score
    and m.home_team_id is not null and m.away_team_id is not null
),
sf as (    -- χωρίς μικρό τελικό, οι δύο χαμένοι ημιτελικοί μοιράζονται την 3η θέση
  select m.tournament_id, m.category_id,
         case when m.home_score > m.away_score then m.away_team_id else m.home_team_id end as loser
  from public.matches m
  where m.phase = 'sf' and m.status = 'final'
    and m.home_score is not null and m.away_score is not null and m.home_score <> m.away_score
    and m.home_team_id is not null and m.away_team_id is not null
),
-- κατηγορία χωρίς κανένα νοκ-άουτ: η κατάταξη του ομίλου είναι το αποτέλεσμα
grp as (
  select g.tournament_id, g.category_id, s.team_id,
         row_number() over (partition by g.tournament_id, g.category_id
                            order by s.points desc, (s.points_for - s.points_against) desc, s.points_for desc)::int as place
  from public.group_standings s
  join public.groups g on g.id = s.group_id
  where not exists (select 1 from public.matches m
                     where m.tournament_id = g.tournament_id and m.category_id = g.category_id and m.phase <> 'group')
    and not exists (select 1 from public.matches m
                     where m.tournament_id = g.tournament_id and m.category_id = g.category_id and m.status <> 'final')
),
derived as (
  select tournament_id, category_id, winner as team_id, 1 as place from fin
  union all select tournament_id, category_id, runner, 2 from fin
  union all select tournament_id, category_id, loser,  3 from sf
  union all select tournament_id, category_id, team_id, place from grp where place <= 3
)
select * from manual
union all
select d.* from derived d
where not exists (select 1 from manual x
                   where x.tournament_id = d.tournament_id and x.category_id = d.category_id);

-- ---------- βαθμοί ανά παίκτη και ανά διοργάνωση ----------
-- Χωριστή γραμμή ανά διοργάνωση, ώστε αύριο να μπορούμε να δείξουμε και «φετινή» κατάταξη
-- χωρίς να ξαναγραφτεί τίποτα.
create or replace view public.player_points as
with res as (
  select tp.player_id, r.tournament_id, r.category_id, r.team_id, r.match_id, r.points_for, r.points_against
  from public.team_players tp
  join public.team_results r on r.team_id = tp.team_id
),
agg as (
  select player_id, tournament_id, category_id,
         count(match_id)::int as played,
         count(match_id) filter (where points_for > points_against)::int as wins,
         count(match_id) filter (where points_for < points_against)::int as losses
  from res group by player_id, tournament_id, category_id
),
places as (
  select tp.player_id, cp.tournament_id, cp.category_id, min(cp.place)::int as place
  from public.category_places cp
  join public.team_players tp on tp.team_id = cp.team_id
  group by 1, 2, 3
)
select a.player_id, a.tournament_id, a.category_id,
       extract(year from t.starts_on)::int as season,
       a.played, a.wins, a.losses, p.place,
       (a.wins * 2 + case p.place when 1 then 10 when 2 then 6 when 3 then 4 else 0 end)::int as points
from agg a
join public.tournaments t on t.id = a.tournament_id
left join places p on p.player_id = a.player_id and p.tournament_id = a.tournament_id
                  and p.category_id is not distinct from a.category_id;

-- ---------- οι κατατάξεις ----------
drop view if exists public.team_rank_overall;
drop view if exists public.player_rank_overall;
drop view if exists public.player_rank_by_category;
drop view if exists public.player_rankings;
drop view if exists public.team_rankings;

create view public.player_rankings as
select pp.player_id, pp.category_id, p.display_name, p.city, p.since_year, p.avatar_url,
       count(distinct pp.tournament_id)::int                   as tournaments,
       (select count(distinct r.team_key) from public.team_results r
         join public.team_players tp on tp.team_id = r.team_id
        where tp.player_id = pp.player_id and r.category_id is not distinct from pp.category_id)::int as teams,
       sum(pp.played)::int                                     as played,
       sum(pp.wins)::int                                       as wins,
       sum(pp.losses)::int                                     as losses,
       count(*) filter (where pp.place = 1)::int               as gold,
       count(*) filter (where pp.place = 2)::int               as silver,
       count(*) filter (where pp.place = 3)::int               as bronze,
       sum(pp.points)::int                                     as points
from public.player_points pp
join public.players p on p.id = pp.player_id
group by pp.player_id, pp.category_id, p.display_name, p.city, p.since_year, p.avatar_url;

create view public.player_rank_overall as
with agg as (
  select player_id, max(display_name) as display_name,
         sum(played)::int as played, sum(wins)::int as wins, sum(losses)::int as losses,
         sum(gold)::int as gold, sum(silver)::int as silver, sum(bronze)::int as bronze,
         sum(points)::int as points
  from public.player_rankings group by player_id
)
select a.*,
       rank() over (order by a.points desc)::int as position,
       (select count(*) from agg)::int           as total
from agg a;

create view public.player_rank_by_category as
select r.player_id, r.category_id, r.points,
       rank() over (partition by r.category_id order by r.points desc)::int as position,
       count(*) over (partition by r.category_id)::int                      as total
from public.player_rankings r;

alter view public.category_places        set (security_invoker = off);
alter view public.player_points          set (security_invoker = off);
alter view public.player_rankings        set (security_invoker = off);
alter view public.player_rank_overall    set (security_invoker = off);
alter view public.player_rank_by_category set (security_invoker = off);
grant select on public.category_places, public.player_points, public.player_rankings,
                public.player_rank_overall, public.player_rank_by_category to anon, authenticated;
