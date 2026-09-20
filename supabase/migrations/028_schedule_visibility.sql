-- Μια διοργάνωση μπορεί να θέλει να ανακοινώσει μόνο τις ώρες προσέλευσης και να κρατήσει το
-- αναλυτικό πρόγραμμα εκτός της σελίδας της. Κρύβονται οι καρτέλες Πρόγραμμα / Όμιλοι / Νοκ-άουτ·
-- τα live σκορ, η αρχική και το ticker συνεχίζουν κανονικά, οπότε οι αγώνες μένουν αναγνώσιμοι.
alter table public.tournaments add column if not exists schedule_public boolean not null default true;

-- Επαναφορά των αρχικών πολιτικών ανάγνωσης, σε περίπτωση που είχε τρέξει αυστηρότερη εκδοχή.
drop policy if exists "public read matches" on public.matches;
create policy "public read matches" on public.matches for select
  using (exists (select 1 from public.tournaments t where t.id = tournament_id and (t.is_public or public.is_admin())));

drop policy if exists "public read groups" on public.groups;
create policy "public read groups" on public.groups for select using (true);
