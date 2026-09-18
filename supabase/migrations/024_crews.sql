-- 024: the standing team.
--
-- Until now a "team" was a team's entry in one tournament: teams.tournament_id and category_id are
-- both required, so three friends who play together every summer exist in the database as four
-- unrelated rows. A crew is the team itself — a name, a captain, members — and it lives whether or
-- not there is a tournament to enter. A tournament entry will later be able to point at one.
--
-- Membership is never assumed: a mate is invited and becomes a member only when they accept, which
-- is the same rule the tournament invites follow.

create table if not exists public.crews (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  city        text,
  captain_id  uuid not null references public.players(id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index if not exists crews_captain_idx on public.crews (captain_id);

create table if not exists public.crew_members (
  crew_id     uuid not null references public.crews(id) on delete cascade,
  player_id   uuid not null references public.players(id) on delete cascade,
  role        text not null default 'player' check (role in ('captain', 'player')),
  invited_at  timestamptz not null default now(),
  accepted_at timestamptz,                      -- null = invited, waiting on them
  primary key (crew_id, player_id)
);
create index if not exists crew_members_player_idx on public.crew_members (player_id);

-- a mate named by email who has no profile yet; it becomes a membership the moment they make one
create table if not exists public.crew_invites (
  id          uuid primary key default gen_random_uuid(),
  crew_id     uuid not null references public.crews(id) on delete cascade,
  email       text not null,
  created_at  timestamptz not null default now(),
  sent_at     timestamptz,                      -- filled when the mail actually goes out
  unique (crew_id, email)
);
create index if not exists crew_invites_email_idx on public.crew_invites (lower(email));

alter table public.crews enable row level security;
alter table public.crew_members enable row level security;
alter table public.crew_invites enable row level security;

-- everything goes through the functions below; direct reads are for the admin only
drop policy if exists "admin all crews" on public.crews;
create policy "admin all crews" on public.crews for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin all crew_members" on public.crew_members;
create policy "admin all crew_members" on public.crew_members for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin all crew_invites" on public.crew_invites;
create policy "admin all crew_invites" on public.crew_invites for all using (public.is_admin()) with check (public.is_admin());
grant select on public.crews, public.crew_members, public.crew_invites to service_role;

-- ---------- helpers ----------
create or replace function public.me_player()
returns uuid language sql security definer set search_path = public stable as $$
  select id from public.players where user_id = auth.uid()
$$;
grant execute on function public.me_player() to authenticated;

-- ---------- making one ----------
-- The captain names the crew and types their mates' emails. A mate who already has a profile gets a
-- pending membership; one who does not gets an invite row, which turns into a pending membership as
-- soon as they create a profile with that email. Either way nobody is in the crew until they accept.
create or replace function public.create_my_crew(p_name text, p_city text default null, p_mates text[] default '{}')
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_me uuid; v_crew uuid; v_mate text; v_email text; v_pid uuid;
begin
  v_me := public.me_player();
  if v_me is null then raise exception 'Φτιάξε πρώτα το προφίλ σου'; end if;
  if length(btrim(coalesce(p_name, ''))) < 2 then raise exception 'Λείπει το όνομα της ομάδας'; end if;

  insert into crews (name, city, captain_id) values (btrim(p_name), nullif(btrim(p_city), ''), v_me)
  returning id into v_crew;
  insert into crew_members (crew_id, player_id, role, accepted_at) values (v_crew, v_me, 'captain', now());

  foreach v_mate in array coalesce(p_mates, '{}') loop
    v_email := lower(btrim(v_mate));
    continue when v_email = '' or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$';
    -- their own address, or one they typed twice: skip quietly
    continue when v_email = (select lower(email) from players where id = v_me);

    select id into v_pid from players where lower(email) = v_email and user_id is not null order by created_at limit 1;
    if v_pid is not null then
      insert into crew_members (crew_id, player_id, role) values (v_crew, v_pid, 'player')
      on conflict (crew_id, player_id) do nothing;
    else
      insert into crew_invites (crew_id, email) values (v_crew, v_email)
      on conflict (crew_id, email) do nothing;
    end if;
  end loop;

  return public.my_crew(v_crew);
end $$;
grant execute on function public.create_my_crew(text, text, text[]) to authenticated;

-- adding one more mate to a crew you captain
create or replace function public.invite_to_my_crew(p_crew uuid, p_email text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_me uuid; v_email text; v_pid uuid;
begin
  v_me := public.me_player();
  if v_me is null then raise exception 'Χρειάζεται προφίλ'; end if;
  if not exists (select 1 from crews where id = p_crew and captain_id = v_me) then
    raise exception 'Μόνο ο αρχηγός προσκαλεί';
  end if;
  v_email := lower(btrim(p_email));
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Μη έγκυρο email'; end if;

  select id into v_pid from players where lower(email) = v_email and user_id is not null order by created_at limit 1;
  if v_pid is not null then
    insert into crew_members (crew_id, player_id, role) values (p_crew, v_pid, 'player') on conflict do nothing;
  else
    insert into crew_invites (crew_id, email) values (p_crew, v_email) on conflict do nothing;
  end if;
  return public.my_crew(p_crew);
end $$;
grant execute on function public.invite_to_my_crew(uuid, text) to authenticated;

-- ---------- reading ----------
create or replace function public.my_crew(p_crew uuid)
returns jsonb language sql security definer set search_path = public stable as $$
  select jsonb_build_object(
    'id', c.id, 'name', c.name, 'city', c.city,
    'captain', c.captain_id = public.me_player(),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'player_id', m.player_id, 'name', p.display_name, 'avatar', p.avatar_url,
        'role', m.role, 'accepted', m.accepted_at is not null) order by m.role, p.display_name)
      from crew_members m join players p on p.id = m.player_id where m.crew_id = c.id), '[]'::jsonb),
    'invites', coalesce((
      select jsonb_agg(jsonb_build_object('email', i.email, 'sent', i.sent_at is not null) order by i.email)
      from crew_invites i where i.crew_id = c.id), '[]'::jsonb))
  from crews c
  where c.id = p_crew
    and exists (select 1 from crew_members m where m.crew_id = c.id and m.player_id = public.me_player())
$$;
grant execute on function public.my_crew(uuid) to authenticated;

-- every crew I am in or have been invited to
create or replace function public.my_crews()
returns jsonb language sql security definer set search_path = public stable as $$
  select coalesce(jsonb_agg(public.my_crew(m.crew_id) || jsonb_build_object('accepted', m.accepted_at is not null)
                            order by m.accepted_at nulls first, m.invited_at), '[]'::jsonb)
  from crew_members m where m.player_id = public.me_player()
$$;
grant execute on function public.my_crews() to authenticated;

-- ---------- answering ----------
create or replace function public.respond_crew_invite(p_crew uuid, p_accept boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_me uuid;
begin
  v_me := public.me_player();
  if v_me is null then raise exception 'Χρειάζεται προφίλ'; end if;
  if not exists (select 1 from crew_members where crew_id = p_crew and player_id = v_me and accepted_at is null) then
    raise exception 'Δεν υπάρχει εκκρεμής πρόσκληση';
  end if;
  if p_accept then
    update crew_members set accepted_at = now() where crew_id = p_crew and player_id = v_me;
    return public.my_crew(p_crew);
  end if;
  delete from crew_members where crew_id = p_crew and player_id = v_me;
  return null;
end $$;
grant execute on function public.respond_crew_invite(uuid, boolean) to authenticated;

-- ---------- a profile arrives after the invite ----------
-- Called on sign-in: every crew that named this address becomes a pending membership.
create or replace function public.claim_crew_invites()
returns int language plpgsql security definer set search_path = public as $$
declare v_me uuid; v_email text; v_n int := 0;
begin
  v_me := public.me_player();
  if v_me is null then return 0; end if;
  select lower(email) into v_email from players where id = v_me;
  if v_email is null then return 0; end if;

  insert into crew_members (crew_id, player_id, role)
  select i.crew_id, v_me, 'player' from crew_invites i where lower(i.email) = v_email
  on conflict (crew_id, player_id) do nothing;
  get diagnostics v_n = row_count;

  delete from crew_invites i where lower(i.email) = v_email;
  return v_n;
end $$;
grant execute on function public.claim_crew_invites() to authenticated;

-- the edge function calls this once the mail has actually left, so a second attempt is a no-op
create or replace function public.mark_crew_invites_sent(p_crew uuid)
returns int language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  if not exists (select 1 from crews where id = p_crew and captain_id = public.me_player()) then
    raise exception 'Μόνο ο αρχηγός';
  end if;
  update crew_invites set sent_at = now() where crew_id = p_crew and sent_at is null;
  get diagnostics v_n = row_count;
  return v_n;
end $$;
grant execute on function public.mark_crew_invites_sent(uuid) to authenticated;
