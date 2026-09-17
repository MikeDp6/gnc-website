-- 013: player profiles — a public page for every player and an account they can sign into.
-- Privacy follows the approved structure: only the name, city, photo and results are public; contact
-- details and birth year never leave the admin. Minors are hidden from public listings by default.

-- ---------- visibility ----------
alter table public.players add column if not exists public_profile boolean not null default true;
alter table public.players add column if not exists nickname text;
-- a player under 18 is not listed publicly unless the guardian says so later from the admin
update public.players set public_profile = false
 where birth_year is not null and (extract(year from current_date)::int - birth_year) < 18;

-- the public projection: no email, no phone, no birth year, no guardian
drop view if exists public.players_public;
create view public.players_public as
select id, display_name, nickname, city, since_year, avatar_url
from public.players
where public_profile;
alter view public.players_public set (security_invoker = off);
grant select on public.players_public to anon, authenticated;

-- ---------- linking an account to a player row ----------
-- Players register through the team form long before they ever sign in, so the row already exists.
-- On first sign-in this claims the row whose email matches the signed-in account.
create or replace function public.claim_player()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_email text;
begin
  if auth.uid() is null then raise exception 'Χρειάζεται σύνδεση'; end if;
  select id into v_id from players where user_id = auth.uid();
  if v_id is not null then return jsonb_build_object('player_id', v_id, 'claimed', false); end if;

  select lower(email) into v_email from auth.users where id = auth.uid();
  if v_email is null then raise exception 'Ο λογαριασμός δεν έχει email'; end if;

  select id into v_id from players where lower(email) = v_email and user_id is null order by created_at limit 1;
  if v_id is null then return jsonb_build_object('player_id', null, 'claimed', false); end if;

  update players set user_id = auth.uid() where id = v_id;
  return jsonb_build_object('player_id', v_id, 'claimed', true);
end $$;
grant execute on function public.claim_player() to authenticated;

-- what the signed-in player sees about themselves (everything except other people's data)
create or replace function public.my_player()
returns jsonb language sql security definer set search_path = public stable as $$
  select to_jsonb(p) - 'user_id' from players p where p.user_id = auth.uid()
$$;
grant execute on function public.my_player() to authenticated;

-- players may edit only their own name, nickname, city, photo and visibility
create or replace function public.update_my_player(p_first text default null, p_last text default null,
  p_nickname text default null, p_city text default null, p_avatar text default null, p_public boolean default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  select id into v_id from players where user_id = auth.uid();
  if v_id is null then raise exception 'Δεν βρέθηκε προφίλ για αυτόν τον λογαριασμό'; end if;
  update players set
    first_name = coalesce(nullif(btrim(p_first), ''), first_name),
    last_name  = coalesce(nullif(btrim(p_last), ''), last_name),
    nickname   = case when p_nickname is null then nickname else nullif(btrim(p_nickname), '') end,
    city       = case when p_city is null then city else nullif(btrim(p_city), '') end,
    avatar_url = case when p_avatar is null then avatar_url else nullif(btrim(p_avatar), '') end,
    public_profile = coalesce(p_public, public_profile)
  where id = v_id;
  return (select to_jsonb(p) - 'user_id' from players p where p.id = v_id);
end $$;
grant execute on function public.update_my_player(text, text, text, text, text, boolean) to authenticated;

-- ---------- history across every tournament ----------
create or replace view public.player_history as
with agg as (
  select tp.player_id, r.tournament_id, r.team_id,
         max(r.team_name)                                                  as team_name,
         max(r.category_id)                                                as category_id,
         bool_or(tp.role = 'captain')                                      as captain,
         count(r.match_id)::int                                            as played,
         count(r.match_id) filter (where r.points_for > r.points_against)::int as wins,
         count(r.match_id) filter (where r.points_for < r.points_against)::int as losses
  from public.team_players tp
  join public.team_results r on r.team_id = tp.team_id
  group by tp.player_id, r.tournament_id, r.team_id
)
select a.player_id, a.tournament_id, a.team_id, a.team_name, a.captain, a.played, a.wins, a.losses,
       t.slug, t.name as tournament_name, t.starts_on, t.status, t.city_id,
       c.label as category_label, c.short as category_short, c.color_key,
       w.place
from agg a
join public.tournaments t on t.id = a.tournament_id and t.is_public
join public.categories c on c.id = a.category_id
left join public.tournament_winners w on w.tournament_id = a.tournament_id and w.team_id = a.team_id;
alter view public.player_history set (security_invoker = off);
grant select on public.player_history to anon, authenticated;

-- the same for a team, so its page can show where else that name has played
create or replace view public.team_history as
select r.team_key, r.team_id, t.id as tournament_id, t.slug, t.name as tournament_name, t.starts_on,
       c.label as category_label, c.color_key,
       count(r.match_id)::int                                                as played,
       count(r.match_id) filter (where r.points_for > r.points_against)::int as wins,
       count(r.match_id) filter (where r.points_for < r.points_against)::int as losses,
       max(w.place)                                                          as place
from public.team_results r
join public.tournaments t on t.id = r.tournament_id and t.is_public
join public.categories c on c.id = r.category_id
left join public.tournament_winners w on w.tournament_id = r.tournament_id and w.team_id = r.team_id
group by r.team_key, r.team_id, t.id, t.slug, t.name, t.starts_on, c.label, c.color_key;
alter view public.team_history set (security_invoker = off);
grant select on public.team_history to anon, authenticated;

-- rankings must not leak a hidden player
drop view if exists public.player_rankings;
create view public.player_rankings as
with mine as (
  select tp.player_id, r.* from public.team_players tp join public.team_results r on r.team_id = tp.team_id
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
  from public.tournament_winners w join public.team_players tp on tp.team_id = w.team_id
  group by 1
)
select a.player_id, p.display_name, p.city, p.since_year, p.avatar_url,
       a.tournaments, a.teams, a.played, a.wins, a.losses,
       coalesce(m.gold, 0) as gold, coalesce(m.silver, 0) as silver, coalesce(m.bronze, 0) as bronze,
       (a.wins * 2 + a.losses + coalesce(m.gold, 0) * 10 + coalesce(m.silver, 0) * 6 + coalesce(m.bronze, 0) * 4)::int as points
from agg a
join public.players p on p.id = a.player_id and p.public_profile
left join medals m on m.player_id = a.player_id;
alter view public.player_rankings set (security_invoker = off);
grant select on public.player_rankings to anon, authenticated;

-- ---------- avatars ----------
-- players upload into media/avatars/<their user id>/… ; everything else in the bucket stays admin-only
drop policy if exists "player uploads own avatar" on storage.objects;
create policy "player uploads own avatar" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = 'avatars' and (storage.foldername(name))[2] = auth.uid()::text);
drop policy if exists "player updates own avatar" on storage.objects;
create policy "player updates own avatar" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = 'avatars' and (storage.foldername(name))[2] = auth.uid()::text);
drop policy if exists "player deletes own avatar" on storage.objects;
create policy "player deletes own avatar" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = 'avatars' and (storage.foldername(name))[2] = auth.uid()::text);
