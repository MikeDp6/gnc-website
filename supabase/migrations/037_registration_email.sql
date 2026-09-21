-- Email επιβεβαίωσης δήλωσης στον αρχηγό: στέλνεται μία φορά ανά ομάδα.
alter table public.teams add column if not exists confirmation_sent_at timestamptz;
