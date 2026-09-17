-- 020: the captain's side of a team, the invite that stops getting lost, and where a player stands.
--
-- Three things this fixes:
--   * the teammate emails typed into the registration form were accepted and thrown away
--   * the invite link was shown once, on the success screen, and existed nowhere else
--   * invite_code sits in `teams`, which anyone can read without signing in — so anyone could
--     collect every code and add themselves to any team

-- ---------- the teammates the captain named ----------
create table if not exists public.team_invites (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  email       text not null,
  player_id   uuid references public.players(id) on delete set null,   -- filled in when they join
  joined_at   timestamptz,
  created_at  timestamptz not null default now(),
  unique (team_id, email)
);
create index if not exists team_invites_team_idx on public.team_invites (team_id);

alter table public.team_invites enable row level security;
-- nobody reads this table directly: the captain gets it through my_teams(), the admin through its own policy
drop policy if exists "admin all team_invites" on public.team_invites;
create policy "admin all team_invites" on public.team_invites for all using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.team_invites to authenticated;
grant select on public.team_invites to service_role;

-- ---------- the invite code stops being public ----------
-- 004 granted select on the whole table, and a column-level revoke cannot cut a hole in a table-level
-- grant — so the table grant goes and every column except invite_code is granted back by name.
-- The captain reads the code through my_teams() and the admin through team_invite_code(); both check
-- who is asking. (A later migration that runs `grant select on all tables` would reopen it.)
revoke select on public.teams from anon, authenticated;
grant select (id, tournament_id, category_id, name, city, captain_id, status, checked_in_at, import_ref, created_at)
  on public.teams to anon, authenticated;

create or replace function public.team_invite_code(p_team uuid)
returns text language plpgsql security definer set search_path = public stable as $$
declare v_code text; v_captain uuid;
begin
  select t.invite_code, t.captain_id into v_code, v_captain from teams t where t.id = p_team;
  if v_code is null then return null; end if;
  if public.is_admin() then return v_code; end if;
  if exists (select 1 from players p where p.id = v_captain and p.user_id = auth.uid()) then return v_code; end if;
  raise exception 'Μόνο ο αρχηγός της ομάδας βλέπει τον κωδικό πρόσκλησης';
end $$;
grant execute on function public.team_invite_code(uuid) to authenticated;

-- ---------- registration keeps the teammate emails ----------
create or replace function public.register_team(
  p_tournament uuid, p_category text, p_team_name text, p_city text,
  p_first text, p_last text, p_email text, p_phone text, p_birth_year int,
  p_guardian text default null, p_mates text[] default '{}'
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_player uuid; v_team uuid; v_code text; v_max int; v_count int; v_status text; v_open boolean; v_mate text;
begin
  if length(trim(p_team_name)) < 2 then raise exception 'Λείπει το όνομα ομάδας'; end if;
  if p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Μη έγκυρο email'; end if;
  select (status in ('registration','upcoming')) and (registration_deadline is null or registration_deadline > now()) into v_open from tournaments where id = p_tournament and is_public;
  if v_open is distinct from true then raise exception 'Οι δηλώσεις για αυτή τη διοργάνωση είναι κλειστές'; end if;
  if not exists (select 1 from tournament_categories where tournament_id = p_tournament and category_id = p_category) then raise exception 'Η κατηγορία δεν παίζει σε αυτή τη διοργάνωση'; end if;
  if exists (select 1 from teams where tournament_id = p_tournament and category_id = p_category and lower(name) = lower(trim(p_team_name)) and status <> 'removed') then raise exception 'Υπάρχει ήδη ομάδα με αυτό το όνομα στην κατηγορία'; end if;
  -- capacity → waitlist
  select max_teams into v_max from tournament_categories where tournament_id = p_tournament and category_id = p_category;
  select count(*) into v_count from teams where tournament_id = p_tournament and category_id = p_category and status in ('pending','active');
  v_status := case when v_max is not null and v_count >= v_max then 'waitlist' else 'pending' end;
  -- captain: reuse by email
  select id into v_player from players where lower(email) = lower(p_email) limit 1;
  if v_player is null then
    insert into players (first_name, last_name, email, phone, city, birth_year, guardian_name, guardian_consent_at, since_year)
    values (trim(p_first), trim(p_last), lower(trim(p_email)), p_phone, p_city, p_birth_year, p_guardian, case when p_guardian is not null then now() end, extract(year from now())::int)
    returning id into v_player;
  end if;
  insert into teams (tournament_id, category_id, name, city, captain_id, status) values (p_tournament, p_category, trim(p_team_name), p_city, v_player, v_status) returning id, invite_code into v_team, v_code;
  insert into team_players (team_id, player_id, role, accepted_at) values (v_team, v_player, 'captain', now());
  insert into registrations_log (team_id) values (v_team);

  -- the teammates the captain named: kept, so an invite can be sent and the captain can see who is missing
  foreach v_mate in array coalesce(p_mates, '{}') loop
    if v_mate ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and lower(btrim(v_mate)) <> lower(btrim(p_email)) then
      insert into team_invites (team_id, email) values (v_team, lower(btrim(v_mate))) on conflict do nothing;
    end if;
  end loop;

  return jsonb_build_object('team_id', v_team, 'invite_code', v_code, 'status', v_status);
end $$;
grant execute on function public.register_team(uuid, text, text, text, text, text, text, text, int, text, text[]) to anon, authenticated;

-- ---------- joining ticks off the invite ----------
create or replace function public.join_team(p_code text, p_first text, p_last text, p_email text, p_phone text, p_birth_year int, p_guardian text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_team uuid; v_player uuid; v_n int; v_name text;
begin
  select id, name into v_team, v_name from teams where lower(invite_code) = lower(trim(p_code)) and status <> 'removed';
  if v_team is null then raise exception 'Ο κωδικός πρόσκλησης δεν βρέθηκε'; end if;
  select count(*) into v_n from team_players where team_id = v_team;
  if v_n >= 4 then raise exception 'Η ομάδα είναι πλήρης (4 παίκτες)'; end if;
  select id into v_player from players where lower(email) = lower(p_email) limit 1;
  if v_player is null then
    insert into players (first_name, last_name, email, phone, birth_year, guardian_name, guardian_consent_at, since_year)
    values (trim(p_first), trim(p_last), lower(trim(p_email)), p_phone, p_birth_year, p_guardian, case when p_guardian is not null then now() end, extract(year from now())::int) returning id into v_player;
  end if;
  insert into team_players (team_id, player_id, role, accepted_at) values (v_team, v_player, 'player', now()) on conflict do nothing;
  update team_invites set player_id = v_player, joined_at = now()
   where team_id = v_team and lower(email) = lower(btrim(p_email)) and joined_at is null;
  return jsonb_build_object('team_id', v_team, 'team_name', v_name);
end $$;
grant execute on function public.join_team(text, text, text, text, text, int, text) to anon, authenticated;

-- ---------- what the signed-in player sees about their own teams ----------
-- One row per team they belong to: the tournament, the roster, whether they are the captain, and
-- (only then) the invite code and the teammates still missing.
create or replace function public.my_teams()
returns jsonb language sql security definer set search_path = public stable as $$
  with me as (select id from players where user_id = auth.uid()),
  mine as (
    select t.*, tp.role
    from team_players tp
    join teams t on t.id = tp.team_id and t.status <> 'removed'
    where tp.player_id = (select id from me)
  )
  select coalesce(jsonb_agg(x order by x->>'starts_on' desc), '[]'::jsonb) from (
    select jsonb_build_object(
      'team_id', m.id,
      'name', m.name,
      'status', m.status,
      'captain', m.role = 'captain',
      'category', c.label,
      'category_short', c.short,
      'tournament', tr.name,
      'slug', tr.slug,
      'starts_on', tr.starts_on,
      'tournament_status', tr.status,
      'venue', tr.venue,
      'invite_code', case when m.role = 'captain' then m.invite_code end,
      'roster', (
        select coalesce(jsonb_agg(jsonb_build_object(
                 'player_id', p.id, 'name', p.display_name, 'role', tp2.role, 'joined_at', tp2.accepted_at
               ) order by tp2.role, p.display_name), '[]'::jsonb)
        from team_players tp2 join players p on p.id = tp2.player_id where tp2.team_id = m.id
      ),
      'invites', case when m.role = 'captain' then (
        select coalesce(jsonb_agg(jsonb_build_object('email', i.email, 'joined', i.joined_at is not null) order by i.created_at), '[]'::jsonb)
        from team_invites i where i.team_id = m.id
      ) end
    ) as x
    from mine m
    join tournaments tr on tr.id = m.tournament_id
    join categories c on c.id = m.category_id
  ) s
$$;
grant execute on function public.my_teams() to authenticated;

-- ---------- where a player stands ----------
-- player_rankings is one row per (player, category) since 019; these add the position, both in the
-- whole table and inside each category, so a profile can say "12th of 340".
create or replace view public.player_rank_overall as
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

create or replace view public.player_rank_by_category as
select r.player_id, r.category_id, r.points,
       rank() over (partition by r.category_id order by r.points desc)::int as position,
       count(*) over (partition by r.category_id)::int                      as total
from public.player_rankings r;

create or replace view public.team_rank_overall as
with agg as (
  select split_part(team_key, '|', 1) as team_key, max(name) as name,
         sum(played)::int as played, sum(wins)::int as wins, sum(losses)::int as losses,
         sum(points)::int as points
  from public.team_rankings group by 1
)
select a.*,
       rank() over (order by a.points desc)::int as position,
       (select count(*) from agg)::int           as total
from agg a;

alter view public.player_rank_overall     set (security_invoker = off);
alter view public.player_rank_by_category set (security_invoker = off);
alter view public.team_rank_overall       set (security_invoker = off);
grant select on public.player_rank_overall, public.player_rank_by_category, public.team_rank_overall to anon, authenticated;
