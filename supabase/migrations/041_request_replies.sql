-- 041: απάντηση σε αίτημα επικοινωνίας μέσα από το admin.
-- Το κείμενο της απάντησης μένει δίπλα στο αίτημα, ώστε να φαίνεται τι απαντήθηκε και πότε.
alter table public.contact_requests add column if not exists reply text;
alter table public.contact_requests add column if not exists replied_at timestamptz;
