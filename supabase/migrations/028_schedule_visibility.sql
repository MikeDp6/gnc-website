-- Μια διοργάνωση μπορεί να θέλει να ανακοινώσει μόνο τις ώρες προσέλευσης και να κρατήσει το
-- αναλυτικό πρόγραμμα εκτός site. Οι αγώνες μένουν στη βάση — η γραμματεία περνάει σκορ κανονικά —
-- αλλά παύουν να είναι αναγνώσιμοι από το κοινό. Δεν αρκεί να κρύψουμε καρτέλες: χωρίς αλλαγή στην
-- πολιτική, οι γραμμές θα κατέβαιναν ούτως ή άλλως από το API.
alter table public.tournaments add column if not exists schedule_public boolean not null default true;

drop policy if exists "public read matches" on public.matches;
create policy "public read matches" on public.matches for select
  using (exists (
    select 1 from public.tournaments t
    where t.id = tournament_id
      and ((t.is_public and t.schedule_public) or public.is_admin())
  ));

-- οι όμιλοι μόνοι τους δεν λένε τίποτα χωρίς αγώνες, αλλά για να μη φαίνεται καν η κλήρωση:
drop policy if exists "public read groups" on public.groups;
create policy "public read groups" on public.groups for select
  using (exists (
    select 1 from public.tournaments t
    where t.id = tournament_id
      and ((t.is_public and t.schedule_public) or public.is_admin())
  ));
