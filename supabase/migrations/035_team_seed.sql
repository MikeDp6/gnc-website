-- Δύναμη ομάδας για την κλήρωση: το άθροισμα των βαθμών κατάταξης των παικτών της.
--
-- Επειδή η κατάταξη ακολουθεί ανθρώπους, μια ομάδα με νέο όνομα αλλά γνωστούς παίκτες είναι ισχυρή
-- από την πρώτη μέρα — που είναι ακριβώς το ζητούμενο, ώστε να μη συναντιούνται νωρίς οι κορυφαίοι.
--
-- Μετράνε ΜΟΝΟ προηγούμενες διοργανώσεις. Αν μετρούσαν και οι βαθμοί της τρέχουσας, η κλήρωση θα
-- άλλαζε καθώς εξελίσσεται το τουρνουά — και η κλήρωση γίνεται πριν παιχτεί ο πρώτος αγώνας.
create or replace view public.team_seed as
with pts as (
  select pp.player_id, pp.points, ta.starts_on
  from public.player_points pp
  join public.tournaments ta on ta.id = pp.tournament_id
)
select t.id                                  as team_id,
       t.tournament_id,
       coalesce(sum(p.points), 0)::int       as points,
       count(distinct tp.player_id)::int     as players
from public.teams t
join public.tournaments cur on cur.id = t.tournament_id
left join public.team_players tp on tp.team_id = t.id
left join pts p on p.player_id = tp.player_id and p.starts_on < cur.starts_on
group by t.id, t.tournament_id;

alter view public.team_seed set (security_invoker = on);
grant select on public.team_seed to authenticated;
