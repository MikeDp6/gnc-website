-- 040: αυτόματη έγκριση δηλώσεων ανά διοργάνωση.
-- Με τον διακόπτη ανοιχτό, μια δήλωση από το site μπαίνει κατευθείαν «Ενεργή». Η λίστα αναμονής δεν
-- αλλάζει: όταν η κατηγορία έχει γεμίσει, η register_team γράφει ήδη 'waitlist' και αυτό δεν αγγίζεται.
alter table public.tournaments add column if not exists auto_approve boolean not null default false;

create or replace function public.teams_auto_approve() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'pending' and exists (select 1 from tournaments t where t.id = new.tournament_id and t.auto_approve) then
    new.status := 'active';
  end if;
  return new;
end $$;

drop trigger if exists teams_auto_approve on public.teams;
create trigger teams_auto_approve before insert on public.teams
  for each row execute function public.teams_auto_approve();

-- ο Πειραιάς ξεκινά με αυτόματη έγκριση
update public.tournaments set auto_approve = true where slug = 'piraeus-3x3-2026';
