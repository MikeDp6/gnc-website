-- 010: sponsor tiers (the three levels of the Δομή doc) + newsletter subscribers + tournament photo gallery.

-- ---------- sponsor tiers ----------
alter table public.sponsors add column if not exists tier text not null default 'partner';
do $$ begin
  alter table public.sponsors add constraint sponsors_tier_check check (tier in ('main', 'official', 'partner', 'media'));
exception when duplicate_object then null; end $$;
alter table public.sponsors add column if not exists blurb text;
-- LOUX is the naming sponsor of the tour; the rest keep the default level until the GNC sorts them in the admin
update public.sponsors set tier = 'main' where lower(name) = 'loux';
update public.sponsors set tier = 'official' where lower(name) in ('wilson', 'affidea', 'my way hotel');

-- ---------- newsletter ----------
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  lang text not null default 'el' check (lang in ('el', 'en')),
  source text,                                  -- 'footer', 'register', …
  confirmed boolean not null default true,      -- double opt-in comes with the email sending step
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.subscribers enable row level security;
create policy "admin all subscribers" on public.subscribers for all using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.subscribers to authenticated;

-- anonymous sign-up goes through a function, so nobody can read the list
create or replace function public.subscribe(p_email text, p_lang text default 'el', p_source text default 'site')
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Μη έγκυρο email'; end if;
  insert into subscribers (email, lang, source) values (lower(btrim(p_email)), coalesce(nullif(p_lang, ''), 'el'), p_source)
  on conflict (email) do update set unsubscribed_at = null, lang = excluded.lang;
  return true;
end $$;
grant execute on function public.subscribe(text, text, text) to anon, authenticated;

-- ---------- photo gallery per tournament ----------
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  city_id text references public.cities(id) on delete set null,
  url text not null,
  caption text,
  credit text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists photos_tournament_idx on public.photos (tournament_id, sort_order);
alter table public.photos enable row level security;
create policy "public read photos" on public.photos for select using (true);
create policy "admin all photos" on public.photos for all using (public.is_admin()) with check (public.is_admin());
grant select on public.photos to anon, authenticated;
grant insert, update, delete on public.photos to authenticated;
