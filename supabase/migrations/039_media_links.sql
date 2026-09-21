-- 039: φωτογραφίες και βίντεο ως σύνδεσμοι σε Facebook / Instagram.
-- Τα άλμπουμ μένουν εκεί που ζουν ήδη· το site κρατάει μόνο μια μικρή εικόνα-εξώφυλλο (~100 KB) για την
-- κάρτα και τον σύνδεσμο. Ο παλιός πίνακας photos μένει για όσα έχουν ήδη ανέβει.
create table if not exists public.media_links (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  city_id text references public.cities(id) on delete set null,
  url text not null,
  platform text not null default 'other' check (platform in ('instagram','facebook','youtube','tiktok','other')),
  kind text not null default 'photos' check (kind in ('photos','video','reel','album')),
  title text,
  thumb_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists media_links_tournament_idx on public.media_links (tournament_id, sort_order);
alter table public.media_links enable row level security;
drop policy if exists "public read media_links" on public.media_links;
create policy "public read media_links" on public.media_links for select using (true);
drop policy if exists "admin all media_links" on public.media_links;
create policy "admin all media_links" on public.media_links for all using (public.is_admin()) with check (public.is_admin());
grant select on public.media_links to anon, authenticated;
grant insert, update, delete on public.media_links to authenticated;
