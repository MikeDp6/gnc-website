-- Η κατηγορία μιας ομάδας βγαίνει από τα έτη γέννησης, δεν τη διαλέγει ελεύθερα ο αρχηγός.
--
-- Μία αρχή τα καλύπτει όλα: η ομάδα παίζει όπου ΔΙΚΑΙΟΥΝΤΑΙ ΟΛΟΙ οι παίκτες της.
--   · U11 → U13 → U15 → U18 : ανεβαίνεις, δεν κατεβαίνεις (ο μεγαλύτερος ορίζει το πάτωμα)
--   · 35+ → 18+             : περνάς, το αντίστροφο όχι (ο μικρότερος ορίζει το ταβάνι)
-- Και τα δύο προκύπτουν από τα όρια της ίδιας της κατηγορίας, χωρίς ειδικές περιπτώσεις:
--   min_birth_year = «γεννημένος από το X και μετά» (ταβάνι ηλικίας, οι U)
--   max_birth_year = «γεννημένος ως το Y»           (πάτωμα ηλικίας, οι 18+ / 35+)

create or replace function public.category_fits(p_category text, p_years int[]) returns boolean
language sql stable set search_path = public as $$
  select case when p_years is null or array_length(p_years, 1) is null then false else
    not exists (
      select 1 from unnest(p_years) y, categories c
      where c.id = p_category
        and ( y is null
              or (c.min_birth_year is not null and y < c.min_birth_year)
              or (c.max_birth_year is not null and y > c.max_birth_year) )
    ) end
$$;

-- Οι κατηγορίες της διοργάνωσης στις οποίες χωράει ολόκληρη η ομάδα, με σημαδεμένη την προεπιλογή.
-- «Στενότερη» = το πιο σφιχτό όριο: μεγαλύτερο min για τις U, μικρότερο max για τις 18+/35+.
create or replace function public.eligible_categories(
  p_tournament uuid, p_years int[], p_gender text default null)
returns jsonb language sql stable security definer set search_path = public as $$
  with fit as (
    select c.id, c.label, c.short, c.gender, c.min_birth_year, c.max_birth_year, c.sort_order
    from tournament_categories tc
    join categories c on c.id = tc.category_id
    where tc.tournament_id = p_tournament
      and (p_gender is null or c.gender = p_gender)
      and category_fits(c.id, p_years)
  ), pick as (
    select id from fit
    order by coalesce(min_birth_year, -2147483648) desc,
             coalesce(max_birth_year,  2147483647) asc,
             sort_order
    limit 1
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', f.id, 'label', f.label, 'short', f.short, 'gender', f.gender,
           'suggested', f.id = (select id from pick)
         ) order by f.sort_order), '[]'::jsonb)
  from fit f;
$$;
grant execute on function public.category_fits(text, int[]) to anon, authenticated;
grant execute on function public.eligible_categories(uuid, int[], text) to anon, authenticated;

-- Η δήλωση ελέγχει τα ίδια στον server. Η διεπαφή βοηθάει· εδώ κρίνεται.
create or replace function public.register_team(
  p_tournament uuid, p_category text, p_team_name text, p_city text,
  p_first text, p_last text, p_email text, p_phone text, p_birth_year int,
  p_guardian text default null, p_mates jsonb default '[]'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_player uuid; v_team uuid; v_code text; v_max int; v_count int; v_status text; v_open boolean;
  m jsonb; m_first text; m_last text; m_email text; m_year int; m_id uuid; v_n int; v_added int := 0;
  v_years int[]; v_label text;
begin
  if length(btrim(p_team_name)) < 2 then raise exception 'Λείπει το όνομα ομάδας'; end if;
  if p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Μη έγκυρο email'; end if;
  if nullif(btrim(p_first),'') is null or nullif(btrim(p_last),'') is null then
    raise exception 'Χρειάζονται όνομα και επώνυμο αρχηγού'; end if;
  if p_birth_year is null then raise exception 'Χρειάζεται έτος γέννησης αρχηγού'; end if;

  select (status in ('registration','upcoming')) and (registration_deadline is null or registration_deadline > now())
    into v_open from tournaments where id = p_tournament and is_public;
  if v_open is distinct from true then raise exception 'Οι δηλώσεις για αυτή τη διοργάνωση είναι κλειστές'; end if;
  if not exists (select 1 from tournament_categories where tournament_id = p_tournament and category_id = p_category) then
    raise exception 'Η κατηγορία δεν παίζει σε αυτή τη διοργάνωση'; end if;

  -- όλα τα έτη της ομάδας, αρχηγός και συμπαίκτες, πριν γραφτεί οτιδήποτε
  v_years := array[p_birth_year];
  for m in select * from jsonb_array_elements(coalesce(p_mates, '[]'::jsonb)) loop
    if nullif(btrim(coalesce(m->>'first','')),'') is not null or nullif(btrim(coalesce(m->>'last','')),'') is not null then
      if nullif(m->>'birth_year','') is null then raise exception 'Κάθε συμπαίκτης θέλει έτος γέννησης'; end if;
      v_years := v_years || (m->>'birth_year')::int;
    end if;
  end loop;

  if not category_fits(p_category, v_years) then
    select label into v_label from categories where id = p_category;
    raise exception 'Δεν δικαιούνται όλοι οι παίκτες να παίξουν στην κατηγορία %. Η κατηγορία ορίζεται από τις ηλικίες όλης της ομάδας.', coalesce(v_label, p_category);
  end if;

  if exists (select 1 from teams where tournament_id = p_tournament and category_id = p_category
             and lower(name) = lower(btrim(p_team_name)) and status <> 'removed') then
    raise exception 'Υπάρχει ήδη ομάδα με αυτό το όνομα στην κατηγορία'; end if;

  select max_teams into v_max from tournament_categories where tournament_id = p_tournament and category_id = p_category;
  select count(*) into v_count from teams where tournament_id = p_tournament and category_id = p_category and status in ('pending','active');
  v_status := case when v_max is not null and v_count >= v_max then 'waitlist' else 'pending' end;

  select id into v_player from players where lower(email) = lower(btrim(p_email)) limit 1;
  if v_player is null then
    insert into players (first_name, last_name, email, phone, city, birth_year, guardian_name, guardian_consent_at, since_year)
    values (btrim(p_first), btrim(p_last), lower(btrim(p_email)), p_phone, p_city, p_birth_year,
            p_guardian, case when p_guardian is not null then now() end, extract(year from now())::int)
    returning id into v_player;
  end if;

  insert into teams (tournament_id, category_id, name, city, captain_id, status)
  values (p_tournament, p_category, btrim(p_team_name), p_city, v_player, v_status)
  returning id, invite_code into v_team, v_code;
  insert into team_players (team_id, player_id, role, accepted_at) values (v_team, v_player, 'captain', now());
  insert into registrations_log (team_id) values (v_team);

  for m in select * from jsonb_array_elements(coalesce(p_mates, '[]'::jsonb)) loop
    m_first := nullif(btrim(coalesce(m->>'first','')), '');
    m_last  := nullif(btrim(coalesce(m->>'last','')),  '');
    m_email := nullif(lower(btrim(coalesce(m->>'email',''))), '');
    m_year  := nullif(m->>'birth_year','')::int;
    continue when m_first is null and m_last is null and m_email is null;
    if m_first is null or m_last is null then raise exception 'Κάθε συμπαίκτης θέλει όνομα και επώνυμο'; end if;
    if m_email is not null and m_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Μη έγκυρο email συμπαίκτη'; end if;

    select count(*) into v_n from team_players where team_id = v_team;
    exit when v_n >= 4;

    m_id := null;
    if m_email is not null then select id into m_id from players where lower(email) = m_email limit 1; end if;
    if m_id is null then
      -- ίδιο όνομα, ίδιο έτος, και μοναδικός τέτοιος: αρκετά ισχυρό για αυτόματη σύνδεση
      select p.id into m_id from players p
       where p.user_id is null and p.birth_year = m_year
         and player_name_keys(p.first_name, p.last_name) && player_name_keys(m_first, m_last)
       limit 1;
      if m_id is not null and (select count(*) from players p
            where p.user_id is null and p.birth_year = m_year
              and player_name_keys(p.first_name, p.last_name) && player_name_keys(m_first, m_last)) > 1
      then m_id := null; end if;
    end if;
    if m_id is null then
      insert into players (first_name, last_name, email, birth_year, city, since_year)
      values (m_first, m_last, m_email, m_year, p_city, extract(year from now())::int)
      returning id into m_id;
    end if;

    insert into team_players (team_id, player_id, role, accepted_at)
    values (v_team, m_id, 'player', null) on conflict do nothing;
    if m_email is not null then
      insert into team_invites (team_id, email, player_id) values (v_team, m_email, m_id) on conflict do nothing;
    end if;
    v_added := v_added + 1;
  end loop;

  return jsonb_build_object('team_id', v_team, 'invite_code', v_code, 'status', v_status, 'mates', v_added);
end $$;
grant execute on function public.register_team(uuid, text, text, text, text, text, text, text, int, text, jsonb) to anon, authenticated;
