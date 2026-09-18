-- 022: a player can have a profile without ever having been written on a registration form.
-- Until now the account page was a dead end for anyone whose email was not on a team declaration:
-- claim_player found nothing and there was no way forward. A player now creates their own profile,
-- and a declaration that arrives later attaches to it by email.

create or replace function public.create_my_player(
  p_first text,
  p_last text,
  p_phone text default null,
  p_birth_year int default null,
  p_city text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_email text; v_year int := extract(year from current_date)::int;
begin
  if auth.uid() is null then raise exception 'Χρειάζεται σύνδεση'; end if;

  -- already has one: hand it back rather than making a second
  select id into v_id from players where user_id = auth.uid();
  if v_id is not null then return (select to_jsonb(p) - 'user_id' from players p where p.id = v_id); end if;

  if nullif(btrim(p_first), '') is null or nullif(btrim(p_last), '') is null then
    raise exception 'Χρειάζονται όνομα και επώνυμο';
  end if;
  if p_birth_year is not null and (p_birth_year < 1930 or p_birth_year > v_year) then
    raise exception 'Μη έγκυρο έτος γέννησης';
  end if;

  select lower(email) into v_email from auth.users where id = auth.uid();
  if v_email is null then raise exception 'Ο λογαριασμός δεν έχει email'; end if;

  -- an unclaimed row with the same email is this person: take it over instead of duplicating them
  select id into v_id from players where lower(email) = v_email and user_id is null order by created_at limit 1;

  if v_id is not null then
    update players set
      user_id    = auth.uid(),
      first_name = btrim(p_first),
      last_name  = btrim(p_last),
      phone      = coalesce(nullif(btrim(p_phone), ''), phone),
      birth_year = coalesce(p_birth_year, birth_year),
      city       = coalesce(nullif(btrim(p_city), ''), city)
    where id = v_id;
  else
    insert into players (user_id, first_name, last_name, email, phone, birth_year, city, public_profile)
    values (auth.uid(), btrim(p_first), btrim(p_last), v_email,
            nullif(btrim(p_phone), ''), p_birth_year, nullif(btrim(p_city), ''),
            -- a minor is not listed publicly until a guardian says otherwise, as in 013
            case when p_birth_year is not null and (v_year - p_birth_year) < 18 then false else true end)
    returning id into v_id;
  end if;

  return (select to_jsonb(p) - 'user_id' from players p where p.id = v_id);
end $$;
grant execute on function public.create_my_player(text, text, text, int, text) to authenticated;

-- the same edit function, now also covering the phone and the birth year the player entered themselves
drop function if exists public.update_my_player(text, text, text, text, text, boolean);
create or replace function public.update_my_player(
  p_first text default null, p_last text default null, p_nickname text default null,
  p_city text default null, p_avatar text default null, p_public boolean default null,
  p_phone text default null, p_birth_year int default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_year int := extract(year from current_date)::int;
begin
  select id into v_id from players where user_id = auth.uid();
  if v_id is null then raise exception 'Δεν βρέθηκε προφίλ για αυτόν τον λογαριασμό'; end if;
  if p_birth_year is not null and (p_birth_year < 1930 or p_birth_year > v_year) then
    raise exception 'Μη έγκυρο έτος γέννησης';
  end if;
  update players set
    first_name = coalesce(nullif(btrim(p_first), ''), first_name),
    last_name  = coalesce(nullif(btrim(p_last), ''), last_name),
    nickname   = case when p_nickname is null then nickname else nullif(btrim(p_nickname), '') end,
    city       = case when p_city is null then city else nullif(btrim(p_city), '') end,
    avatar_url = case when p_avatar is null then avatar_url else nullif(btrim(p_avatar), '') end,
    phone      = case when p_phone is null then phone else nullif(btrim(p_phone), '') end,
    birth_year = coalesce(p_birth_year, birth_year),
    public_profile = coalesce(p_public, public_profile)
  where id = v_id;
  return (select to_jsonb(p) - 'user_id' from players p where p.id = v_id);
end $$;
grant execute on function public.update_my_player(text, text, text, text, text, boolean, text, int) to authenticated;
