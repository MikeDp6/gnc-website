-- The poster of each tournament, shown on the programme and teams cards.
-- cover_url stays what it is: a wide photo of the court that sits behind the title.
alter table public.tournaments add column if not exists poster_url text;
