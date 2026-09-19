-- resolve_seeds() runs from the match trigger, so the bracket fills the moment the last group
-- match is marked final. It can still be called by hand from the admin, for the cases the trigger
-- cannot cover — a schedule republished after the groups finished, or a result fixed out of order.
-- It is idempotent and returns immediately for a category whose groups are still running.
revoke execute on function public.resolve_seeds(uuid, text) from anon;
grant  execute on function public.resolve_seeds(uuid, text) to authenticated;
