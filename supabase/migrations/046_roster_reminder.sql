-- 046: πότε στάλθηκε στον αρχηγό η υπενθύμιση ότι λείπουν παίκτες από το ρόστερ.
-- Κρατιέται ανά ομάδα ώστε να φαίνεται ποιον έχουμε ήδη ειδοποιήσει και να μην πέφτουν διπλά email.
alter table public.teams add column if not exists roster_reminded_at timestamptz;
