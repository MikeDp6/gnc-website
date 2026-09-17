-- 016: who ran the tournament in each city — the municipality, the local club, regional sponsors.
-- Stored as a small list so the admin can edit it without a schema change:
--   [{ "name": "Δήμος Αγρινίου", "role": "Διοργάνωση", "url": "https://..." }]
alter table public.cities add column if not exists partners jsonb not null default '[]'::jsonb;

comment on column public.cities.partners is 'Τοπικοί συνεργάτες: [{name, role?, url?}]';
