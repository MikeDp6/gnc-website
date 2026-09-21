-- 038: ο σύνδεσμος πρόσκλησης βρίσκει τον συμπαίκτη που έγραψε ήδη ο αρχηγός.
--
-- Από τη 030 ο αρχηγός δηλώνει ο ίδιος όλη τη σύνθεση (όνομα, επώνυμο, έτος, προαιρετικά email). Η παλιά
-- join_team έψαχνε μόνο με email: όποιος είχε γραφτεί χωρίς email ή με άλλο γινόταν δεύτερο άτομο στην
-- ίδια ομάδα, και σε πλήρη τετράδα έπαιρνε «Η ομάδα είναι πλήρης» χωρίς να μπορεί να επιβεβαιώσει.
--
-- Σειρά αναζήτησης μέσα στην ομάδα:
--   1. ήδη μέλος με αυτό το email              → επιβεβαίωση
--   2. ένας ανεπιβεβαίωτος με ίδιο όνομα (Ελληνικά/Λατινικά, με/χωρίς τόνους) και συμβατό έτος
--                                              → αυτός είναι· παίρνει email/κινητό και επιβεβαιώνεται
--   3. κανένας                                 → νέος παίκτης, αν η ομάδα έχει θέση
-- Αν στο 2 το email ανήκει ήδη σε άλλον παίκτη (π.χ. έχει προφίλ από παλιότερη διοργάνωση), η θέση στην
-- ομάδα περνάει σε εκείνον και η πρόχειρη εγγραφή του αρχηγού σβήνεται — ένας άνθρωπος, ένα ιστορικό.

create or replace function public.join_team(p_code text, p_first text, p_last text, p_email text, p_phone text, p_birth_year int, p_guardian text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_team uuid; v_name text; v_n int; v_player uuid; v_slot uuid; v_other uuid; v_hits int;
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_first text := btrim(coalesce(p_first, '')); v_last text := btrim(coalesce(p_last, ''));
  v_how text;
begin
  select id, name into v_team, v_name from teams where lower(invite_code) = lower(btrim(p_code)) and status <> 'removed';
  if v_team is null then raise exception 'Ο κωδικός πρόσκλησης δεν βρέθηκε'; end if;
  if v_first = '' or v_last = '' then raise exception 'Χρειάζονται όνομα και επώνυμο'; end if;
  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Μη έγκυρο email'; end if;

  -- 1. ήδη στην ομάδα με αυτό το email
  select tp.player_id into v_slot from team_players tp join players p on p.id = tp.player_id
   where tp.team_id = v_team and lower(p.email) = v_email limit 1;
  if v_slot is not null then v_how := 'already'; end if;

  -- 2. ο συμπαίκτης που έγραψε ο αρχηγός
  if v_slot is null then
    select count(*), (array_agg(tp.player_id))[1] into v_hits, v_slot
      from team_players tp join players p on p.id = tp.player_id
     where tp.team_id = v_team and tp.role = 'player' and tp.accepted_at is null
       and player_name_keys(p.first_name, p.last_name) && player_name_keys(v_first, v_last)
       and (p.birth_year is null or p_birth_year is null or p.birth_year = p_birth_year);
    if v_hits <> 1 then v_slot := null; else v_how := 'matched'; end if;
  end if;

  if v_slot is not null then
    select id into v_other from players where lower(email) = v_email and id <> v_slot limit 1;
    if v_other is not null and v_how = 'matched' then
      -- το email έχει ήδη άνθρωπο: η θέση πάει σε εκείνον, η πρόχειρη εγγραφή φεύγει
      update team_players set player_id = v_other, accepted_at = now() where team_id = v_team and player_id = v_slot;
      update team_invites set player_id = v_other where player_id = v_slot;
      update players set phone = coalesce(phone, nullif(btrim(p_phone), '')), birth_year = coalesce(birth_year, p_birth_year),
             guardian_name = coalesce(guardian_name, p_guardian),
             guardian_consent_at = case when guardian_name is null and p_guardian is not null then now() else guardian_consent_at end
       where id = v_other;
      begin
        delete from players where id = v_slot and user_id is null
          and not exists (select 1 from team_players where player_id = v_slot);
      exception when foreign_key_violation then null;  -- κρατιέται αν κάτι άλλο το δείχνει
      end;
      v_player := v_other;
    else
      update players set email = coalesce(email, v_email), phone = coalesce(nullif(btrim(p_phone), ''), phone),
             birth_year = coalesce(birth_year, p_birth_year),
             guardian_name = coalesce(p_guardian, guardian_name),
             guardian_consent_at = case when p_guardian is not null then now() else guardian_consent_at end
       where id = v_slot;
      update team_players set accepted_at = coalesce(accepted_at, now()) where team_id = v_team and player_id = v_slot;
      v_player := v_slot;
    end if;
  else
    -- 3. νέος συμπαίκτης
    select count(*) into v_n from team_players where team_id = v_team;
    if v_n >= 4 then
      raise exception 'Η ομάδα έχει ήδη 4 παίκτες και δεν βρέθηκες στη σύνθεση που έδωσε ο αρχηγός. Έλεγξε ότι έγραψες όνομα και έτος γέννησης όπως τα δήλωσε, ή ζήτα από τον αρχηγό να σε προσθέσει.';
    end if;
    select id into v_player from players where lower(email) = v_email limit 1;
    if v_player is null then
      insert into players (first_name, last_name, email, phone, birth_year, guardian_name, guardian_consent_at, since_year)
      values (v_first, v_last, v_email, nullif(btrim(p_phone), ''), p_birth_year, p_guardian,
              case when p_guardian is not null then now() end, extract(year from now())::int)
      returning id into v_player;
    end if;
    insert into team_players (team_id, player_id, role, accepted_at) values (v_team, v_player, 'player', now())
    on conflict (team_id, player_id) do update set accepted_at = coalesce(team_players.accepted_at, now());
    v_how := 'added';
  end if;

  update team_invites set player_id = v_player, joined_at = coalesce(joined_at, now())
   where team_id = v_team and (lower(email) = v_email or player_id = v_player);
  return jsonb_build_object('team_id', v_team, 'team_name', v_name, 'how', v_how);
end $$;
grant execute on function public.join_team(text, text, text, text, text, int, text) to anon, authenticated;

-- για το email με τις ώρες προσέλευσης: πότε στάλθηκε, ώστε η επόμενη αποστολή να λέει «Ενημέρωση»
alter table public.tournaments add column if not exists arrivals_emailed_at timestamptz;
