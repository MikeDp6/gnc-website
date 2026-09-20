-- Newsletter: από κουτί συλλογής email σε πραγματική λίστα.
--
-- Τρία πράγματα έλειπαν και είναι απαιτούμενα, όχι στολίδια:
--   · διπλή επιβεβαίωση — αλλιώς ο καθένας γράφει το email τρίτου
--   · σύνδεσμος διαγραφής σε κάθε μήνυμα, που δουλεύει χωρίς σύνδεση
--   · αρχείο του τι στάλθηκε, σε ποιον και πότε
-- Οι δύο πρώτοι είναι νομική υποχρέωση για εμπορικό email στην ΕΕ.

alter table public.subscribers add column if not exists confirm_token uuid not null default gen_random_uuid();
alter table public.subscribers add column if not exists unsub_token   uuid not null default gen_random_uuid();
alter table public.subscribers add column if not exists confirmed_at  timestamptz;
alter table public.subscribers add column if not exists confirm_sent_at timestamptz;

create unique index if not exists subscribers_confirm_token_idx on public.subscribers (confirm_token);
create unique index if not exists subscribers_unsub_token_idx   on public.subscribers (unsub_token);

-- όσοι μπήκαν πριν από τη διπλή επιβεβαίωση θεωρούνται επιβεβαιωμένοι: είχαν γραφτεί μόνοι τους
update public.subscribers set confirmed_at = coalesce(confirmed_at, created_at) where confirmed;

-- ---------- επιβεβαίωση και διαγραφή, χωρίς σύνδεση ----------
-- Το token είναι το διαπιστευτήριο. Δεν επιστρέφουμε ποτέ ολόκληρο το email: ο σύνδεσμος μπορεί να
-- καταλήξει σε ιστορικό browser ή σε προεπισκόπηση μηνύματος.
create or replace function public.newsletter_confirm(p_token uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v record;
begin
  update subscribers set confirmed = true, confirmed_at = coalesce(confirmed_at, now()), unsubscribed_at = null
   where confirm_token = p_token returning * into v;
  if not found then return jsonb_build_object('ok', false); end if;
  return jsonb_build_object('ok', true, 'hint', regexp_replace(v.email, '^(.).*(@.*)$', '\1***\2'));
end $$;

create or replace function public.newsletter_unsubscribe(p_token uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v record;
begin
  update subscribers set unsubscribed_at = now() where unsub_token = p_token returning * into v;
  if not found then return jsonb_build_object('ok', false); end if;
  return jsonb_build_object('ok', true, 'hint', regexp_replace(v.email, '^(.).*(@.*)$', '\1***\2'));
end $$;

grant execute on function public.newsletter_confirm(uuid), public.newsletter_unsubscribe(uuid) to anon, authenticated;

-- ---------- εκστρατείες ----------
create table if not exists public.newsletter_campaigns (
  id          uuid primary key default gen_random_uuid(),
  subject     text not null,
  body        text not null,                 -- απλό κείμενο με κενές γραμμές· το HTML φτιάχνεται στην αποστολή
  lang        text not null default 'el' check (lang in ('el', 'en', 'all')),
  status      text not null default 'draft' check (status in ('draft', 'sending', 'sent')),
  sent_count  int  not null default 0,
  created_at  timestamptz not null default now(),
  sent_at     timestamptz
);

create table if not exists public.newsletter_sends (
  campaign_id   uuid not null references public.newsletter_campaigns(id) on delete cascade,
  subscriber_id uuid not null references public.subscribers(id) on delete cascade,
  sent_at       timestamptz not null default now(),
  error         text,
  primary key (campaign_id, subscriber_id)
);

alter table public.newsletter_campaigns enable row level security;
alter table public.newsletter_sends     enable row level security;
create policy "admin campaigns" on public.newsletter_campaigns for all using (public.is_admin()) with check (public.is_admin());
create policy "admin sends"     on public.newsletter_sends     for all using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.newsletter_campaigns to authenticated;
grant select, insert, update, delete on public.newsletter_sends to authenticated;

-- ---------- τι βλέπει ο διαχειριστής ----------
create or replace view public.newsletter_stats as
select count(*)::int                                                              as total,
       count(*) filter (where confirmed and unsubscribed_at is null)::int          as active,
       count(*) filter (where not confirmed and unsubscribed_at is null)::int      as pending,
       count(*) filter (where unsubscribed_at is not null)::int                    as unsubscribed,
       count(*) filter (where lang = 'el' and confirmed and unsubscribed_at is null)::int as el,
       count(*) filter (where lang = 'en' and confirmed and unsubscribed_at is null)::int as en
from public.subscribers;
alter view public.newsletter_stats set (security_invoker = on);
grant select on public.newsletter_stats to authenticated;
