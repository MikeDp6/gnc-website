-- PIN που κρίνεται στον SERVER, όχι στη συσκευή.
--
-- Η τοπική εκδοχή φύλαγε τη συνεδρία κλειδωμένη στο κινητό. Δύο προβλήματα: η αποσύνδεση ακύρωνε το
-- token και το PIN ξεκλείδωνε νεκρή συνεδρία, και ο μετρητής αποτυχιών ζούσε στον browser, άρα
-- καθαριζόταν. Τώρα στο κινητό μένει μόνο ένα αναγνωριστικό συσκευής — τίποτα εκμεταλλεύσιμο αν κλαπεί.
--
-- Το κλείδωμα είναι το μισό της ασφάλειας: 10.000 συνδυασμοί σπάνε σε δευτερόλεπτα αν αφεθούν ελεύθεροι.
-- Πέντε αποτυχίες κλειδώνουν τη συσκευή για ένα τέταρτο· τρία τέτοια κλειδώματα την ακυρώνουν οριστικά.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.player_devices (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  label        text,
  pin_hash     text not null,
  failed       int  not null default 0,
  lock_count   int  not null default 0,
  locked_until timestamptz,
  revoked_at   timestamptz,
  last_used_at timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists player_devices_user_idx on public.player_devices (user_id);

alter table public.player_devices enable row level security;
-- Ο χρήστης βλέπει και σβήνει τις δικές του συσκευές. Το pin_hash δεν διαβάζεται από πουθενά αλλού:
-- η επαλήθευση γίνεται αποκλειστικά μέσα στις συναρτήσεις παρακάτω, με service_role.
create policy "own devices read"   on public.player_devices for select using (auth.uid() = user_id);
create policy "own devices delete" on public.player_devices for delete using (auth.uid() = user_id);
grant select, delete on public.player_devices to authenticated;

-- ---------- καταχώριση ----------
create or replace function public.device_enrol(p_user uuid, p_pin text, p_label text default null)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid;
begin
  if p_pin !~ '^\d{4}$' then raise exception 'Το PIN θέλει ακριβώς 4 ψηφία'; end if;
  if p_pin ~ '^(\d)\1{3}$' then raise exception 'Διάλεξε PIN που δεν είναι τέσσερα ίδια ψηφία'; end if;
  insert into player_devices (user_id, label, pin_hash)
  values (p_user, nullif(btrim(p_label), ''), extensions.crypt(p_pin, extensions.gen_salt('bf', 10)))
  returning id into v_id;
  return v_id;
end $$;
revoke execute on function public.device_enrol(uuid, text, text) from public, anon, authenticated;

-- ---------- ξεκλείδωμα ----------
-- Η απάντηση είναι σκόπιμα φτωχή: ποτέ δεν αποκαλύπτει αν το αναγνωριστικό υπάρχει. Αλλιώς το endpoint
-- γίνεται μαντείο που μαθαίνει ποιες συσκευές είναι εγγεγραμμένες.
create or replace function public.device_unlock(p_device uuid, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare d record; v_email text; v_ok boolean;
begin
  select * into d from player_devices where id = p_device and revoked_at is null for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'no'); end if;
  if d.locked_until is not null and d.locked_until > now() then
    return jsonb_build_object('ok', false, 'reason', 'locked', 'until', d.locked_until);
  end if;

  v_ok := (d.pin_hash = extensions.crypt(p_pin, d.pin_hash));
  if not v_ok then
    if d.failed + 1 >= 5 then
      update player_devices set failed = 0, lock_count = lock_count + 1,
             locked_until = now() + interval '15 minutes',
             revoked_at = case when lock_count + 1 >= 3 then now() else null end
       where id = d.id;
      return jsonb_build_object('ok', false, 'reason', 'locked', 'until', now() + interval '15 minutes');
    end if;
    update player_devices set failed = failed + 1 where id = d.id;
    return jsonb_build_object('ok', false, 'reason', 'pin', 'left', 5 - (d.failed + 1));
  end if;

  update player_devices set failed = 0, lock_count = 0, locked_until = null, last_used_at = now() where id = d.id;
  select email into v_email from auth.users where id = d.user_id;
  return jsonb_build_object('ok', true, 'user_id', d.user_id, 'email', v_email);
end $$;
revoke execute on function public.device_unlock(uuid, text) from public, anon, authenticated;

-- Οι δύο παραπάνω καλούνται ΜΟΝΟ από την edge function με service_role. Αν τις άνοιγα στον anon,
-- το κλείδωμα θα ήταν διακοσμητικό: ο καθένας θα δοκίμαζε PIN κατευθείαν στη βάση.
