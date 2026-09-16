-- Public team registration (from the site form) + quote/contact requests.
-- Anonymous users can't write to teams/players directly (RLS); they call a SECURITY DEFINER function that validates and inserts.

create table if not exists public.registrations_log (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete set null,
  ip inet, user_agent text, created_at timestamptz not null default now()
);
create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('contact','quote')),
  name text not null, email text not null, phone text, org text, subject text, item text, event_date date, message text,
  handled boolean not null default false, created_at timestamptz not null default now()
);
alter table public.registrations_log enable row level security;
alter table public.contact_requests enable row level security;
create policy "admin all registrations_log" on public.registrations_log for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all contact_requests" on public.contact_requests for all using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.registrations_log, public.contact_requests to authenticated;

-- Register a team: creates the captain (player), the team (pending or waitlist), links them, returns team id + invite code.
create or replace function public.register_team(
  p_tournament uuid, p_category text, p_team_name text, p_city text,
  p_first text, p_last text, p_email text, p_phone text, p_birth_year int,
  p_guardian text default null, p_mates text[] default '{}'
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_player uuid; v_team uuid; v_code text; v_max int; v_count int; v_status text; v_open boolean;
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
  return jsonb_build_object('team_id', v_team, 'invite_code', v_code, 'status', v_status);
end $$;
grant execute on function public.register_team(uuid, text, text, text, text, text, text, text, int, text, text[]) to anon, authenticated;

-- Contact / quote form
create or replace function public.submit_contact(p_kind text, p_name text, p_email text, p_phone text, p_org text, p_subject text, p_item text, p_event_date date, p_message text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  if p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Μη έγκυρο email'; end if;
  insert into contact_requests (kind, name, email, phone, org, subject, item, event_date, message) values (p_kind, p_name, lower(p_email), p_phone, p_org, p_subject, p_item, p_event_date, p_message) returning id into v;
  return v;
end $$;
grant execute on function public.submit_contact(text, text, text, text, text, text, text, date, text) to anon, authenticated;

-- Join a team with the invite code (teammate fills only their own details)
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
  return jsonb_build_object('team_id', v_team, 'team_name', v_name);
end $$;
grant execute on function public.join_team(text, text, text, text, text, int, text) to anon, authenticated;
