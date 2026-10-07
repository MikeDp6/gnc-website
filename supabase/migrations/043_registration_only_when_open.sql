-- 043: δηλώσεις μόνο όταν η διοργάνωση είναι σε «Δηλώσεις ανοιχτές».
--
-- Ως τώρα η register_team δεχόταν και κατάσταση «Επερχόμενο», οπότε βάζοντας τη διοργάνωση σε
-- επερχόμενο οι δηλώσεις συνέχιζαν να περνούν. Ο έλεγχος μπαίνει εδώ ως trigger, για να ισχύει
-- όποιος δρόμος κι αν χρησιμοποιηθεί. Ο διαχειριστής δεν εμποδίζεται ποτέ: προσθέτει ομάδες από το
-- admin ακόμα και με κλειστές δηλώσεις.
create or replace function public.teams_registration_open() returns trigger
language plpgsql security definer set search_path = public as $$
declare t record;
begin
  if public.is_admin() then return new; end if;
  select status, registration_deadline, is_public into t from tournaments where id = new.tournament_id;
  if t is null or not t.is_public or t.status <> 'registration'
     or (t.registration_deadline is not null and t.registration_deadline <= now()) then
    raise exception 'Οι δηλώσεις για αυτή τη διοργάνωση είναι κλειστές';
  end if;
  return new;
end $$;

drop trigger if exists teams_registration_open on public.teams;
create trigger teams_registration_open before insert on public.teams
  for each row execute function public.teams_registration_open();
