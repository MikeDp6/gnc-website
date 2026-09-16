-- GNC 3on3 — Row Level Security
-- Public site reads with the anon key. Writes only by admins (admin panel / scheduler) or, later,
-- by players on their own rows. Never ship the service-role key to the browser.

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- enable RLS everywhere
alter table public.cities enable row level security;
alter table public.categories enable row level security;
alter table public.tournaments enable row level security;
alter table public.tournament_days enable row level security;
alter table public.tournament_categories enable row level security;
alter table public.players enable row level security;
alter table public.teams enable row level security;
alter table public.team_players enable row level security;
alter table public.groups enable row level security;
alter table public.group_teams enable row level security;
alter table public.matches enable row level security;
alter table public.tournament_winners enable row level security;
alter table public.sponsors enable row level security;
alter table public.ticker_items enable row level security;
alter table public.admins enable row level security;

-- ---------- public read ----------
create policy "public read cities" on public.cities for select using (true);
create policy "public read categories" on public.categories for select using (true);
create policy "public read tournaments" on public.tournaments for select using (is_public or public.is_admin());
create policy "public read days" on public.tournament_days for select
  using (exists (select 1 from public.tournaments t where t.id = tournament_id and (t.is_public or public.is_admin())));
create policy "public read tournament_categories" on public.tournament_categories for select
  using (exists (select 1 from public.tournaments t where t.id = tournament_id and (t.is_public or public.is_admin())));
create policy "public read teams" on public.teams for select
  using (status <> 'removed' and exists (select 1 from public.tournaments t where t.id = tournament_id and (t.is_public or public.is_admin())));
create policy "public read team_players" on public.team_players for select using (true);
create policy "public read groups" on public.groups for select using (true);
create policy "public read group_teams" on public.group_teams for select using (true);
create policy "public read matches" on public.matches for select
  using (exists (select 1 from public.tournaments t where t.id = tournament_id and (t.is_public or public.is_admin())));
create policy "public read winners" on public.tournament_winners for select using (true);
create policy "public read sponsors" on public.sponsors for select using (active or public.is_admin());
create policy "public read ticker" on public.ticker_items for select using (active or public.is_admin());

-- players: the table itself is NOT publicly readable (email/phone). The site uses the players_public view.
create policy "player reads self" on public.players for select using (user_id = auth.uid() or public.is_admin());
create policy "player updates self" on public.players for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "player creates self" on public.players for insert with check (user_id = auth.uid());

-- admins table: only admins can see who is admin
create policy "admins read admins" on public.admins for select using (public.is_admin());

-- ---------- admin writes (everything) ----------
do $$
declare t text;
begin
  foreach t in array array['cities','categories','tournaments','tournament_days','tournament_categories','players','teams',
                           'team_players','groups','group_teams','matches','tournament_winners','sponsors','ticker_items']
  loop
    execute format('create policy "admin all %1$s" on public.%1$s for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- views run with the invoker's rights by default in Postgres 15+; make the public projections readable
grant select on public.players_public to anon, authenticated;
grant select on public.group_standings to anon, authenticated;
alter view public.players_public set (security_invoker = off);
alter view public.group_standings set (security_invoker = off);

-- ---------- realtime ----------
-- Supabase dashboard → Database → Replication: enable for public.matches (scores/moves) and public.ticker_items.
-- Or:
-- alter publication supabase_realtime add table public.matches, public.ticker_items;
