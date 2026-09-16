-- API-role grants. Needed because the project was created with "Automatically expose new tables" OFF.
-- RLS (002) still decides row visibility; these only let the anon/authenticated roles reach the tables at all.
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
alter default privileges in schema public grant select on tables to anon, authenticated;
alter default privileges in schema public grant insert, update, delete on tables to authenticated;
