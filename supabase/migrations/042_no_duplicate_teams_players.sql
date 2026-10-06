-- 042: δύο κανόνες μοναδικότητας σε κάθε διοργάνωση.
--
--   1. Ένα όνομα ομάδας, μία φορά σε ΟΛΗ τη διοργάνωση (όχι μόνο μέσα στην κατηγορία).
--   2. Ένας παίκτης σε μία μόνο ομάδα ανά κατηγορία της ίδιας διοργάνωσης.
--
-- Μπαίνουν ως triggers και όχι μέσα στη register_team, ώστε να ισχύουν από παντού: φόρμα δήλωσης,
-- σύνδεσμος πρόσκλησης, μαζική προσθήκη και χειροκίνητη προσθήκη παίκτη από το admin.

-- ---------- 0. κλειδί ονόματος ----------
-- «Πρεζαλγκιρις Β.C» και «Πρεζαλγκιρις B.C» είναι το ίδιο όνομα: το πρώτο έχει ελληνικό Β, το δεύτερο
-- λατινικό. Το κλειδί ισοπεδώνει πρώτα τα ελληνικά κεφαλαία που μοιάζουν με λατινικά, μετά τόνους,
-- κεφαλαία, κενά και σημεία στίξης.
create or replace function public.team_name_key(p text) returns text
language sql immutable set search_path = public as $$
  select regexp_replace(
           translate(
             lower(
               translate(btrim(coalesce(p, '')), 'ΑΒΕΖΗΙΚΜΝΟΡΤΥΧ', 'ABEZHIKMNOPTYX')
             ),
             'άέήίϊΐόύϋΰώς',
             'αεηιιιουυυωσ'),
           '[^a-z0-9α-ω]', '', 'g')
$$;

-- ---------- 1. όνομα ομάδας ----------
create or replace function public.teams_unique_name() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_other text;
begin
  if new.status = 'removed' then return new; end if;
  select c.label into v_other
    from teams t left join categories c on c.id = t.category_id
   where t.tournament_id = new.tournament_id
     and t.id is distinct from new.id
     and t.status <> 'removed'
     and team_name_key(t.name) = team_name_key(new.name)
   limit 1;
  if found then
    raise exception 'Υπάρχει ήδη ομάδα με το όνομα «%» σε αυτή τη διοργάνωση (%). Διάλεξε άλλο όνομα.',
      btrim(new.name), coalesce(v_other, 'άλλη κατηγορία');
  end if;
  return new;
end $$;

drop trigger if exists teams_unique_name on public.teams;
create trigger teams_unique_name before insert or update of name, status, category_id, tournament_id
  on public.teams for each row execute function public.teams_unique_name();

-- ---------- 2. ένας παίκτης, μία ομάδα ανά κατηγορία ----------
create or replace function public.team_players_one_per_category() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_tour uuid; v_cat text; v_other text; v_name text;
begin
  select tournament_id, category_id into v_tour, v_cat from teams where id = new.team_id;
  if v_tour is null then return new; end if;
  select t.name into v_other
    from team_players tp
    join teams t on t.id = tp.team_id
   where tp.player_id = new.player_id
     and tp.team_id <> new.team_id
     and t.tournament_id = v_tour
     and t.category_id = v_cat
     and t.status <> 'removed'
   limit 1;
  if found then
    select coalesce(first_name || ' ' || last_name, 'Ο παίκτης') into v_name from players where id = new.player_id;
    raise exception '% παίζει ήδη με την ομάδα «%» σε αυτή την κατηγορία. Ένας παίκτης δηλώνεται σε μία μόνο ομάδα ανά κατηγορία.', v_name, v_other;
  end if;
  return new;
end $$;

drop trigger if exists team_players_one_per_category on public.team_players;
create trigger team_players_one_per_category before insert or update of player_id, team_id
  on public.team_players for each row execute function public.team_players_one_per_category();
