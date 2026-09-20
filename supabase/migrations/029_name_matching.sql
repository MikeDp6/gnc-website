-- Ταυτοποίηση προσώπου. Η κατάταξη ακολουθεί ανθρώπους, όχι ονόματα ομάδων: όταν κάποιος φτιάχνει
-- προφίλ πρέπει να βρίσκουμε τη γραμμή που υπάρχει ήδη από τις δηλώσεις συμμετοχής.
--
-- Το ίδιο πρόσωπο γράφεται «Μιχάλης Διπλάρος», «MICHALIS DIPLAROS», «Mixalis Diplaros», «Μιχαλης
-- Διπλαρος». Παράγουμε «σκελετό»: όλα σε λατινικά, χωρίς τόνους, με ισοπεδωμένες τις αμφισημίες
-- της μεταγραφής (η/ι/υ/ει/οι → i, ο/ω → o, θ/th → t, χ/ch/h → k, β/b/v → v) και χωρίς διπλά γράμματα.
--
-- Τρεις αμφισημίες δεν λύνονται, οπότε κρατάμε ΟΛΕΣ τις αναγνώσεις ως σύνολο σκελετών:
--   · λατινικό x → ξ ή χ                 (Xenos / Xristos)
--   · λατινικό h → χ ή άφωνο             (Zaharopoulos / Theodorou)
--   · ελληνικά δίψηφα φωνήεντα, που στα κεφαλαία χάνουν τα διαλυτικά (ΑΙΒΑΛΗ = Αϊβαλή ή Αιβαλή)
-- Δύο ονόματα θεωρούνται υποψήφια όταν τα σύνολά τους τέμνονται.
--
-- Ο σκελετός είναι εσκεμμένα χονδροειδής — «Παππά» και «Παπά» πέφτουν μαζί. Γι' αυτό ΔΕΝ ενώνει
-- ποτέ μόνος του δύο πρόσωπα: παράγει υποψηφίους που επιβεβαιώνει ο ίδιος ο παίκτης. Η μόνη
-- αυτόματη σύνδεση παραμένει το email, που είναι μονοσήμαντο.

create or replace function public.name_keys(p text) returns text[]
language plpgsql immutable as $$
declare base text; v text; u text; w text; out text[] := '{}';
        dig boolean; hv text; xv text;
begin
  if p is null or btrim(p) = '' then return '{}'; end if;
  base := lower(btrim(p));
  base := translate(base, 'άέήίόύώ', 'αεηιουω');                    -- τόνοι, ΟΧΙ διαλυτικά
  base := translate(base, 'áàâäãéèêëíìîïóòôöõúùûüñç', 'aaaaaeeeeiiiiooooouuuunc');
  base := replace(base, 'ς', 'σ');

  foreach dig in array array[true, false] loop
    v := base;
    if dig then
      v := replace(v,'αι','e'); v := replace(v,'ει','i');
      v := replace(v,'οι','i'); v := replace(v,'υι','i');
    end if;
    v := translate(v, 'ϊϋΐΰ', 'ιυιυ');                              -- διαλυτικά μετά τα δίψηφα

    v := replace(v,'ου','u'); v := replace(v,'μπ','b'); v := replace(v,'ντ','d');
    v := replace(v,'γκ','g'); v := replace(v,'γγ','g'); v := replace(v,'τσ','ts');
    v := replace(v,'τζ','tz'); v := replace(v,'θ','th'); v := replace(v,'χ','ch');
    v := replace(v,'ψ','ps'); v := replace(v,'ξ','ks');
    v := translate(v, 'αβγδεζηικλμνοπρστυφω', 'avgdeziiklmnoprstifo');

    v := replace(v,'yi','gi'); v := replace(v,'mp','b'); v := replace(v,'nt','d');
    v := replace(v,'gk','g');  v := replace(v,'th','t'); v := replace(v,'ph','f');
    v := replace(v,'ch','k');  v := replace(v,'kh','k'); v := replace(v,'sh','s');
    v := replace(v,'ou','u');

    foreach hv in array (case when position('h' in v) > 0 then array['', 'k'] else array[null] end) loop
      u := case when hv is null then v else replace(v, 'h', hv) end;
      foreach xv in array (case when position('x' in u) > 0 then array['ks', 'k'] else array[null] end) loop
        w := case when xv is null then u else replace(u, 'x', xv) end;
        w := replace(w,'y','i'); w := replace(w,'j','i'); w := replace(w,'w','o');
        w := replace(w,'b','v'); w := replace(w,'q','k'); w := replace(w,'c','k');
        w := regexp_replace(w, '[^a-z]', '', 'g');
        w := regexp_replace(w, '(.)\1+', '\1', 'g');
        if w <> '' and not (w = any(out)) then out := out || w; end if;
      end loop;
    end loop;
  end loop;
  return out;
end $$;

-- Ταξινομημένο ζεύγος, ώστε να ταιριάζει και όταν στη φόρμα μπήκε το επώνυμο στη θέση του ονόματος.
create or replace function public.player_name_keys(p_first text, p_last text) returns text[]
language sql immutable as $$
  select coalesce(array_agg(distinct case when a <= b then a || '|' || b else b || '|' || a end), '{}')
  from unnest(coalesce(nullif(public.name_keys(p_first), '{}'), array[''])) a,
       unnest(coalesce(nullif(public.name_keys(p_last),  '{}'), array[''])) b
$$;

create index if not exists players_name_keys_idx
  on public.players using gin (public.player_name_keys(first_name, last_name));

-- Υποψήφιες παλιές εγγραφές για κάποιον που φτιάχνει τώρα προφίλ. Επιστρέφει μόνο ό,τι χρειάζεται
-- για να αναγνωρίσει κανείς τον εαυτό του — ποτέ email ή τηλέφωνο άλλου ανθρώπου.
create or replace function public.player_candidates(p_first text, p_last text, p_birth_year int default null)
returns jsonb language sql security definer set search_path = public stable as $$
  select coalesce(jsonb_agg(x order by (x->>'strong')::boolean desc nulls last, x->>'last_name'), '[]'::jsonb)
  from (
    select jsonb_build_object(
             'id', p.id, 'first_name', p.first_name, 'last_name', p.last_name,
             'city', p.city, 'birth_year', p.birth_year,
             -- «ισχυρό» = ταιριάζει και το έτος γέννησης· τότε η πρόταση είναι σχεδόν σίγουρη
             'strong', (p_birth_year is not null and p.birth_year = p_birth_year),
             'tournaments', (select count(distinct t.tournament_id)
                             from team_players tp join teams t on t.id = tp.team_id
                             where tp.player_id = p.id)
           ) as x
    from players p
    where p.user_id is null
      and player_name_keys(p.first_name, p.last_name) && player_name_keys(p_first, p_last)
      and (p_birth_year is null or p.birth_year is null or p.birth_year = p_birth_year)
    limit 10
  ) s;
$$;
grant execute on function public.player_candidates(text, text, int) to authenticated;

-- Σύνδεση με επιλεγμένη παλιά εγγραφή. Ο έλεγχος του σκελετού είναι εδώ και όχι μόνο στη διεπαφή:
-- κανείς δεν οικειοποιείται τη γραμμή άλλου στέλνοντας ένα τυχαίο id.
create or replace function public.link_my_player(
  p_player_id uuid, p_first text, p_last text,
  p_phone text default null, p_birth_year int default null, p_city text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_email text; v_ok boolean;
begin
  if auth.uid() is null then raise exception 'Χρειάζεται σύνδεση'; end if;
  if exists (select 1 from players where user_id = auth.uid()) then
    raise exception 'Ο λογαριασμός έχει ήδη προφίλ';
  end if;

  select (user_id is null
          and player_name_keys(first_name, last_name) && player_name_keys(p_first, p_last))
    into v_ok from players where id = p_player_id;
  if not coalesce(v_ok, false) then raise exception 'Η εγγραφή δεν αντιστοιχεί σε αυτό το όνομα'; end if;

  select lower(email) into v_email from auth.users where id = auth.uid();

  update players set
    user_id    = auth.uid(),
    first_name = coalesce(nullif(btrim(p_first), ''), first_name),
    last_name  = coalesce(nullif(btrim(p_last),  ''), last_name),
    phone      = coalesce(nullif(btrim(p_phone), ''), phone),
    birth_year = coalesce(p_birth_year, birth_year),
    city       = coalesce(nullif(btrim(p_city),  ''), city),
    email      = coalesce(email, v_email)
  where id = p_player_id;

  return (select to_jsonb(p) - 'user_id' from players p where p.id = p_player_id);
end $$;
grant execute on function public.link_my_player(uuid, text, text, text, int, text) to authenticated;
