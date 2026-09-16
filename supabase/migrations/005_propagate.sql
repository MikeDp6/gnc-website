-- Propagate results: when a match becomes final, fill the next-round matches that reference it
-- (home/away_source = 'W:<match id>' / 'L:<match id>'), and when all group matches of a category are final,
-- resolve bracket seeds ('S:<n>') from the standings: group winners first (by points, diff, PF), then runners-up, ...

create or replace function public.resolve_seeds(p_tournament uuid, p_category text) returns void
language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  -- all group matches of the category must be final
  if exists (select 1 from matches m where m.tournament_id = p_tournament and m.category_id = p_category and m.phase = 'group' and m.status <> 'final') then return; end if;
  for r in
    select s.team_id,
           row_number() over (partition by s.group_id order by s.points desc, (s.points_for - s.points_against) desc, s.points_for desc) as grank,
           s.points, (s.points_for - s.points_against) as diff, s.points_for
    from group_standings s join groups g on g.id = s.group_id
    where g.tournament_id = p_tournament and g.category_id = p_category
    order by 2, s.points desc, diff desc, s.points_for desc
  loop
    n := n + 1;
    update matches set home_team_id = r.team_id where tournament_id = p_tournament and category_id = p_category and home_source = 'S:' || n;
    update matches set away_team_id = r.team_id where tournament_id = p_tournament and category_id = p_category and away_source = 'S:' || n;
  end loop;
end $$;

create or replace function public.propagate_match_result() returns trigger
language plpgsql security definer set search_path = public as $$
declare w uuid; l uuid;
begin
  if new.status = 'final' and new.home_score is not null and new.away_score is not null and new.home_score <> new.away_score then
    if new.home_score > new.away_score then w := new.home_team_id; l := new.away_team_id; else w := new.away_team_id; l := new.home_team_id; end if;
    update matches set home_team_id = w where home_source = 'W:' || new.id::text;
    update matches set away_team_id = w where away_source = 'W:' || new.id::text;
    update matches set home_team_id = l where home_source = 'L:' || new.id::text;
    update matches set away_team_id = l where away_source = 'L:' || new.id::text;
    if new.group_id is not null then perform resolve_seeds(new.tournament_id, new.category_id); end if;
  end if;
  return new;
end $$;

drop trigger if exists matches_propagate on public.matches;
create trigger matches_propagate after update of status, home_score, away_score on public.matches
  for each row execute function public.propagate_match_result();
