-- GNC 3on3 — core schema (Phase 1)
-- Run in the Supabase SQL editor, in order: 001_schema.sql → 002_rls.sql → 003_seed_pefki.sql
-- Structure mirrors HoopOps (tournaments / days / teams / matches) so scheduler + arena code ports over,
-- plus GNC-specific tables: players with accounts and history, cities/tour, winners (archive), sponsors, ticker.

create extension if not exists pgcrypto;

-- ---------- reference ----------
create table public.cities (
  id text primary key,                       -- 'pefki', 'pallini', 'thessaloniki'
  name text not null,
  name_en text not null,
  region text,
  lat double precision,
  lng double precision,
  sort_order integer not null default 0
);

create table public.categories (
  id text primary key,                       -- 'u11_mixed', 'o35_men'
  label text not null,                       -- 'U11 MIXED'
  short text not null,                       -- 'U11'
  color_key text not null check (color_key in ('u11','u13','u15','u18','o18','o35')),
  gender text not null default 'mixed' check (gender in ('men','women','mixed')),
  min_birth_year integer,                    -- e.g. U11 in 2026 → 2015
  max_birth_year integer,                    -- e.g. 35+ in 2026 → 1991
  sort_order integer not null default 0      -- young → old; the scheduler default order
);

-- ---------- tournaments ----------
create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,                 -- 'pefki-2026'
  name text not null,                        -- 'Λυκόβρυση–Πεύκη 2026'
  name_en text,
  city_id text references public.cities(id),
  venue text,
  address text,
  starts_on date not null,
  ends_on date not null,
  courts integer not null default 2,
  status text not null default 'draft'
    check (status in ('draft','registration','upcoming','live','done','archived')),
  is_public boolean not null default false,
  registration_deadline timestamptz,
  cover_url text,
  settings_json jsonb not null default '{}'::jsonb,   -- scheduler settings (flow, ko, gap, maxGap, latestStart…)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tournament_days (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  day_index integer not null,                -- 1, 2
  date date not null,
  start_time time not null default '17:00',
  end_time time not null default '23:30',
  courts integer not null default 2,
  unique (tournament_id, day_index)
);

create table public.tournament_categories (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  category_id text not null references public.categories(id),
  format text not null default 'rr4',        -- rr3 | x4 | rr4 | fast5 | rr5 (scheduler formats)
  qualifiers integer,                        -- KO size; null = no knockout
  max_teams integer,
  sort_order integer not null default 0,
  primary key (tournament_id, category_id)
);

-- ---------- players & teams ----------
create table public.players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,   -- null until the player creates an account
  first_name text not null,
  last_name text not null,
  display_name text generated always as (first_name || ' ' || last_name) stored,
  email text,
  phone text,
  city text,
  birth_year integer,
  since_year integer,                        -- first GNC participation
  avatar_url text,
  guardian_name text,                        -- minors: parental consent
  guardian_consent_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  category_id text not null references public.categories(id),
  name text not null,
  city text,
  captain_id uuid references public.players(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending','active','waitlist','removed')),
  invite_code text unique default encode(gen_random_bytes(6), 'hex'),
  checked_in_at timestamptz,
  import_ref text,                           -- id from the registration PDF/Excel when imported
  created_at timestamptz not null default now(),
  unique (tournament_id, category_id, name)
);

create table public.team_players (
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  role text not null default 'player' check (role in ('captain','player')),
  accepted_at timestamptz,
  primary key (team_id, player_id)
);

-- ---------- groups & matches ----------
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  category_id text not null references public.categories(id),
  name text not null,                        -- 'Όμιλος Α'
  sort_order integer not null default 0,
  note text
);

create table public.group_teams (
  group_id uuid not null references public.groups(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  seed integer,
  primary key (group_id, team_id)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  category_id text not null references public.categories(id),
  phase text not null check (phase in ('group','r16','qf','sf','final','third')),
  label text not null,                       -- 'Όμιλος Α' | 'Προημιτελικός 1'
  code text,                                 -- scheduler match key, e.g. 'o35:qf:1'
  group_id uuid references public.groups(id) on delete set null,
  round integer,
  match_number integer,
  day_id uuid references public.tournament_days(id) on delete set null,
  court integer,
  slot_time time,                            -- '17:00'
  home_team_id uuid references public.teams(id) on delete set null,
  away_team_id uuid references public.teams(id) on delete set null,
  home_source text,                          -- 'W:<match_id>' | 'L:<match_id>' | 'G:<group_id>:<rank>'
  away_source text,
  home_label text,                           -- placeholder shown while unresolved ('1ος Ομίλου Α')
  away_label text,
  home_score integer,
  away_score integer,
  status text not null default 'scheduled' check (status in ('scheduled','live','final','cancelled')),
  live_clock text,                           -- optional live: 'Q1 04:12' — Phase 1 optional
  manual_override boolean not null default false,   -- moved by hand in the scheduler
  updated_at timestamptz not null default now()
);
create index matches_tournament_idx on public.matches (tournament_id, day_id, slot_time, court);
create index matches_team_idx on public.matches (home_team_id, away_team_id);

-- ---------- archive / marketing ----------
create table public.tournament_winners (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  category_id text not null references public.categories(id),
  team_id uuid not null references public.teams(id) on delete cascade,
  place integer not null check (place in (1,2,3,4)),
  primary key (tournament_id, category_id, place)
);

create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  url text,
  tournament_id uuid references public.tournaments(id) on delete cascade,   -- null = global
  sort_order integer not null default 0,
  active boolean not null default true
);

create table public.ticker_items (
  id uuid primary key default gen_random_uuid(),
  tag text not null,                         -- 'LIVE', 'ΕΠΟΜΕΝΟ'
  text text not null,
  text_en text,
  tone text not null default 'blue' check (tone in ('blue','orange')),
  active boolean not null default true,
  sort_order integer not null default 0
);

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('owner','admin','secretariat')),
  created_at timestamptz not null default now()
);

-- ---------- standings (computed; win = 2, loss = 1, unplayed = 0) ----------
create or replace view public.group_standings as
with played as (
  select m.group_id, t.team_id,
         m.id as match_id,
         case when m.home_team_id = t.team_id then m.home_score else m.away_score end as pf,
         case when m.home_team_id = t.team_id then m.away_score else m.home_score end as pa
  from public.group_teams t
  join public.matches m on m.group_id = t.group_id and m.status = 'final'
                        and (m.home_team_id = t.team_id or m.away_team_id = t.team_id)
)
select gt.group_id, gt.team_id,
       count(p.match_id)::int                                   as played,
       count(p.match_id) filter (where p.pf > p.pa)::int        as wins,
       count(p.match_id) filter (where p.pf < p.pa)::int        as losses,
       coalesce(sum(p.pf), 0)::int                              as points_for,
       coalesce(sum(p.pa), 0)::int                              as points_against,
       (count(p.match_id) filter (where p.pf > p.pa) * 2 + count(p.match_id) filter (where p.pf < p.pa))::int as points
from public.group_teams gt
left join played p on p.group_id = gt.group_id and p.team_id = gt.team_id
group by gt.group_id, gt.team_id;

-- public-safe projection of players (no email/phone/guardian)
create or replace view public.players_public as
select id, display_name, city, since_year, avatar_url from public.players;

-- ---------- updated_at ----------
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger tournaments_touch before update on public.tournaments for each row execute function public.touch_updated_at();
create trigger matches_touch before update on public.matches for each row execute function public.touch_updated_at();
