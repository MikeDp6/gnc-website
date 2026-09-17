-- 008: CMS content tables (news, rentals, season calendar), city media, sponsor logos, media storage bucket.
-- Seeded with the content currently shipped in the code (from gnc3on3.gr) so the site is complete right after this runs.

-- ---------- tables ----------
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body text,                                   -- markdown
  tag text not null default 'Νέα',
  published_on date not null default current_date,
  image_url text,
  source_url text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.rentals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  blurb text,
  price text not null default 'Ζήτησε προσφορά',
  image_url text,
  sort_order integer not null default 0,
  active boolean not null default true
);
create table if not exists public.season_events (
  id uuid primary key default gen_random_uuid(),
  city_id text references public.cities(id) on delete set null,
  label text,                                  -- optional custom title; default = city name
  venue text,
  starts_on date not null,
  ends_on date not null,
  done boolean not null default false,
  registration_open boolean not null default false,
  sort_order integer not null default 0
);
alter table public.cities add column if not exists image_url text;
alter table public.cities add column if not exists videos jsonb not null default '[]'::jsonb;   -- [{kind:'youtube'|'instagram', id}]
alter table public.cities add column if not exists years integer[] not null default '{}';

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists news_touch on public.news;
create trigger news_touch before update on public.news for each row execute function public.touch_updated_at();

-- ---------- RLS ----------
alter table public.news enable row level security;
alter table public.rentals enable row level security;
alter table public.season_events enable row level security;
create policy "public read news" on public.news for select using (published or public.is_admin());
create policy "public read rentals" on public.rentals for select using (active or public.is_admin());
create policy "public read season" on public.season_events for select using (true);
create policy "admin all news" on public.news for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all rentals" on public.rentals for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all season_events" on public.season_events for all using (public.is_admin()) with check (public.is_admin());
grant select on public.news, public.rentals, public.season_events to anon, authenticated;
grant insert, update, delete on public.news, public.rentals, public.season_events to authenticated;

-- ---------- media storage (photos, sponsor logos, news images) ----------
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;
create policy "public read media" on storage.objects for select using (bucket_id = 'media');
create policy "admin upload media" on storage.objects for insert with check (bucket_id = 'media' and public.is_admin());
create policy "admin update media" on storage.objects for update using (bucket_id = 'media' and public.is_admin());
create policy "admin delete media" on storage.objects for delete using (bucket_id = 'media' and public.is_admin());

-- ---------- seed ----------

insert into public.news (slug,title,excerpt,tag,published_on,image_url,source_url) values
  ('apotheosi-tou-basket-sto-my-way-gnc-3on3-tis-patras-mia-mega','Αποθέωση του μπάσκετ στο MY WAY GNC 3on3 της Πάτρας – Μια μεγάλη γιορτή αθλητισμού με ρυθμό και θέαμα προς τιμήν του Κώστα Πετρόπουλου!','Το MY WAY GNC 3on3 στην Πάτρα (4-6 Σεπτεμβρίου) εξελίχθηκε σε κορυφαίο γεγονός streetball με περισσότερες από 180 ομάδες και συναυλία των Alcatrash. Η διοργάνωση, αφιερωμένη στη μνήμη του Κώστα Πετρόπουλου, χαρακτηρίστηκε «πραγματική γιορτή του αθλητισμού» με εκατοντάδες συμμετέχοντες.','Αποτελέσματα','2026-09-07','/img/gnc/gnc-patra-1-scaled.jpg','https://gnc3on3.gr/apotheosi-tou-basket-sto-my-way-gnc-3on3-tis-patras-mia-megali-giorti-athlitismou-me-rythmo-kai-theama-pros-timin-tou-kosta-petropoulou/'),
  ('me-apolyti-epitychia-oloklirothike-to-gnc-3on3-vonitsa-2026-','Με απόλυτη επιτυχία ολοκληρώθηκε το GNC 3on3 | ΒΟΝΙΤΣΑ 2026: Μια αξέχαστη καλοκαιρινή γιορτή του μπάσκετ!','Το GNC 3on3 ΒΟΝΙΤΣΑ 2026 πραγματοποιήθηκε στις 20 και 21 Αυγούστου, μετατρέποντας την παραλία σε καλοκαιρινό αθλητικό ραντεβού με εκατοντάδες αθλητές όλων των ηλικιών και δωρεάν συμμετοχή για όλες τις ομάδες. Η εκδήλωση στέφθηκε με απόλυτη οργανωτική και αγωνιστική επιτυχία χάρη στη συμβολή της Περιφέρειας Δυτικής Ελλάδας, του Δήμου Ακτίου-Βόνιτσας και του Αθλητικού Ομίλου Βόνιτσας.','Αποτελέσματα','2026-08-30','/img/gnc/gnc-vonitsa-apologistiko-scaled.jpg','https://gnc3on3.gr/me-apolyti-epitychia-oloklirothike-to-gnc-3on3-vonitsa-2026-mia-axechasti-kalokairini-giorti-tou-basket/'),
  ('megalo-tournoua-basket-3x3-me-dorean-symmetochi-ston-dimo-ly','Μεγάλο Τουρνουά Μπάσκετ 3×3 με Δωρεάν Συμμετοχή στον Δήμο Λυκόβρυσης – Πεύκης (19-20 Σεπτεμβρίου 2026)','Ο Δήμος Λυκόβρυσης – Πεύκης διοργανώνει δωρεάν τουρνουά μπάσκετ 3x3 στις 19-20 Σεπτεμβρίου 2026 στο 1ο Γενικό Λύκειο Πεύκης, σε συνεργασία με την Περιφέρεια Αττικής και το GNC 3on3. Η διοργάνωση είναι ανοιχτή σε όλες τις ηλικίες και επίπεδα, με εγγραφή μέσω ηλεκτρονικής φόρμας.','Δηλώσεις','2026-08-29','/img/gnc/gnc-pefki-3x3-1-scaled.jpg','https://gnc3on3.gr/megalo-tournoua-basket-3x3-me-dorean-symmetochi-ston-dimo-lykovrysis-pefkis-19-20-septemvriou-2026/'),
  ('basket-chamogela-mousiki-kai-lampsi-pagkosmiou-sto-gnc-3on3-','Μπάσκετ, χαμόγελα, μουσική και λάμψη… παγκοσμίου στο GNC 3on3 της Σκάλας!','Το GNC 3on3 της Σκάλας ολοκληρώθηκε με επιτυχία, με πολλές ομάδες και μια εντυπωσιακή ατμόσφαιρα γεμάτη μπάσκετ και μουσική. Τιμήθηκε ο 18χρονος Δημήτρης Πούλος από τη Σκάλα, πλέον αθλητής του Προμηθέα, για την κατάκτηση του παγκόσμιου σχολικού πρωταθλήματος τον Ιούνιο στη Σερβία.','Αποτελέσματα','2026-08-11','/img/gnc/gnc-3on3-skala-post-scaled.jpg','https://gnc3on3.gr/basket-chamogela-mousiki-kai-lampsi-pagkosmiou-sto-gnc-3on3-tis-skalas/')
on conflict (slug) do nothing;

insert into public.rentals (name,blurb,price,image_url,sort_order)
select * from (values
  ('Γήπεδο ENLIO SES Elite','Δάπεδο μπάσκετ 3×3 ENLIO — το επίσημο δάπεδο των Ολυμπιακών Αγώνων. FIBA approved courts, στήσιμο και αποξήλωση από την ομάδα μας.','Ζήτησε προσφορά','/img/gnc/0071.jpg',1),
  ('Μπασκέτα Schelde SAM 3×3','Η μπασκέτα των Ολυμπιακών Αγώνων και των παγκόσμιων πρωταθλημάτων 3×3.','Ζήτησε προσφορά','/img/gnc/SCHELDE-240x300.png',2),
  ('Μπασκέτα Artisport Black 17','Υδραυλικού τύπου, πιστοποιημένη FIBA approved για 3×3.','Ζήτησε προσφορά','/img/gnc/black-17.jpg',3),
  ('Κινητή μπασκέτα ολυμπιακού τύπου','Για γήπεδα 5×5 και εκδηλώσεις σε ανοιχτούς χώρους.','Ζήτησε προσφορά','/img/gnc/Εικόνα4.jpg',4),
  ('Video wall 12 m²','Waterproof οθόνη LED 4×3 μ. (pitch 3.8) για σκορ, replays και χορηγούς.','Ζήτησε προσφορά','/img/gnc/ΟΘΟΝΗ-768x513.jpg',5),
  ('Διαφημιστικές πινακίδες LED 20 μ.','Περιμετρικές LED πινακίδες 20 μέτρων για χορηγούς γύρω από το γήπεδο.','Ζήτησε προσφορά','/img/gnc/010-768x512.jpg',6)
) as v(name,blurb,price,image_url,sort_order)
where not exists (select 1 from public.rentals);

insert into public.season_events (city_id,label,venue,starts_on,ends_on,done,registration_open,sort_order)
select * from (values
  ('patra',null,'Πλ. Γεωργίου','2026-01-25'::date,'2026-01-26'::date,true,false,1),
  ('patra',null,'Πανεπιστήμιο Πατρών','2026-03-19'::date,'2026-03-20'::date,true,false,2),
  ('athina',null,'Πλ. Κοτζιά','2026-04-12'::date,'2026-04-13'::date,true,false,3),
  ('agrinio',null,'Πλ. Δημοκρατίας','2026-04-25'::date,'2026-04-26'::date,true,false,4),
  ('kavala',null,'Πλατεία Ηρωών','2026-05-10'::date,'2026-05-11'::date,true,false,5),
  ('alexandroupoli',null,'ALEXPO','2026-05-13'::date,'2026-05-14'::date,true,false,6),
  ('igoumenitsa',null,'Πλατεία Δημαρχείου','2026-05-31'::date,'2026-06-01'::date,true,false,7),
  ('metamorfosi',null,'Πλατεία Δημαρχείου','2026-06-07'::date,'2026-06-08'::date,true,false,8),
  ('irakleio',null,'Ενετικό Λιμάνι','2026-06-13'::date,'2026-06-15'::date,true,false,9),
  ('chania',null,'Εγκαταστάσεις Ο.Α.Χ.','2026-06-18'::date,'2026-06-19'::date,true,false,10),
  ('ierapetra',null,'Παραλιακή Πλατεία','2026-06-21'::date,'2026-06-22'::date,true,false,11),
  ('thessaloniki','ΘΕΣΣΑΛΟΝΙΚΗ – UNDER ARMOUR 3x3','Πλατεία Αριστοτέλους','2026-06-27'::date,'2026-06-27'::date,true,false,12),
  ('penteli',null,'Πλατεία Ηρώων Πολυτεχνείου','2026-06-28'::date,'2026-06-29'::date,true,false,13),
  ('patra',null,'Μώλος Αγίου Νικολάου','2026-07-01'::date,'2026-07-01'::date,true,false,14),
  ('peiraias','ΠΕΙΡΑΙΑΣ - UNDER ARMOYR 3x3','Δημοτικό Θέατρο','2026-07-11'::date,'2026-07-11'::date,true,false,15),
  ('paramythia',null,'Σχολείο Βούλγαρη','2026-07-12'::date,'2026-07-13'::date,true,false,16),
  ('pyrgos',null,'κεντρική Πλατεία','2026-07-18'::date,'2026-07-20'::date,true,false,17),
  ('korinthos',null,'Πλατεία Ηρώων Πολυτεχνείου','2026-07-25'::date,'2026-07-27'::date,true,false,18),
  ('vonitsa',null,'Παραλία Βόνιτσας','2026-07-30'::date,'2026-07-31'::date,true,false,19),
  ('skala',null,'Σχολικό Συγκρότημα Σκάλας','2026-08-02'::date,'2026-08-03'::date,true,false,20),
  ('gastouni',null,'Κεντρική Πλατεία','2026-08-08'::date,'2026-08-10'::date,true,false,21),
  ('amfilochia',null,'Πλατεία Αμφιλοχίας','2026-08-09'::date,'2026-08-10'::date,true,false,22),
  ('kalampaka',null,'Πλατεία Ρήγα Φεραίου','2026-08-23'::date,'2026-08-24'::date,true,false,23),
  ('kourouta',null,'Πλατεία Κουρούτας','2026-08-26'::date,'2026-08-27'::date,true,false,24),
  ('patra','Πατρα Κωστας Πετροπουλος','Πλατεία Γεωργίου','2026-08-29'::date,'2026-08-31'::date,true,false,25),
  ('moschato',null,'Πλατεία Ηρώων Πολυτεχνείου','2026-09-20'::date,'2026-09-21'::date,false,true,26)
) as v(city_id,label,venue,starts_on,ends_on,done,registration_open,sort_order)
where not exists (select 1 from public.season_events);

-- drop the placeholder sponsors of the Pefki seed, then add the real partner list from gnc3on3.gr
delete from public.sponsors where name in ('Χορηγός 1','Χορηγός 2','Χορηγός 3','Media partner');
insert into public.sponsors (name,url,sort_order)
select * from (values
  ('LOUX','https://www.loux.gr/',1),
  ('Σκέντζος','https://www.skentzos.com/',2),
  ('Kerasidis Group','https://kerasidisgroup.gr/',3),
  ('Affidea','https://affidea.gr/',4),
  ('Wilson','https://www.wilson.com/en-us/basketball',5),
  ('My Way Hotel','https://www.mywayhotel.gr/',6),
  ('Crossover','https://crossoverbrand.com/el',7),
  ('Vlastaras','https://www.vlastarasate.gr/',8),
  ('SBIE','https://sbie.edu.gr/',9),
  ('Yayaz','https://www.instagram.com/yayaz_the_place_to_be',10),
  ('Theocar','https://theocar.com/en/',11),
  ('Stegno','https://www.stegno.net',12),
  ('Account Saints','https://www.accountsaints.gr/',13)
) as v(name,url,sort_order)
where not exists (select 1 from public.sponsors s where s.name = v.name);

-- city media (photo, years, videos) from the gnc3on3.gr city pages
update public.cities set image_url='/img/gnc/gnc3on3_patra2-min.jpg', years='{2023,2024,2025}', videos='[{"kind": "instagram", "id": "DFkIbCnMlLx"}, {"kind": "instagram", "id": "C_qkaYgMoeG"}, {"kind": "instagram", "id": "C_vsAbpMd7D"}, {"kind": "instagram", "id": "C_qu6cGsgw_"}, {"kind": "instagram", "id": "C_0SuqcugtB"}, {"kind": "instagram", "id": "C_n7em0MMYZ"}, {"kind": "youtube", "id": "vMBvhlDaIOE"}, {"kind": "instagram", "id": "CwsbKKnsWDq"}]'::jsonb where id='patra';
update public.cities set image_url='/img/gnc/IMG_6714.jpg', years='{}', videos='[]'::jsonb where id='athina';
update public.cities set image_url='/img/gnc/gnc3on3_agrinio-min.png', years='{2023,2024}', videos='[{"kind": "instagram", "id": "C7ZYWoMs629"}, {"kind": "instagram", "id": "C7YWW7_MgWr"}, {"kind": "instagram", "id": "C7eyDURMUCC"}, {"kind": "youtube", "id": "98WRdRds2Bg"}, {"kind": "instagram", "id": "CtmlgBPMEHE"}]'::jsonb where id='agrinio';
update public.cities set image_url='/img/gnc/gnc3on3_kavala-min.jpg', years='{}', videos='[]'::jsonb where id='kavala';
update public.cities set image_url=null, years='{2024}', videos='[{"kind": "instagram", "id": "C70yjQgMaIc"}]'::jsonb where id='igoumenitsa';
update public.cities set image_url='/img/gnc/gnc3on3_irakleio-min.jpg', years='{2023,2024}', videos='[{"kind": "instagram", "id": "C7y-wW0sZ_U"}, {"kind": "instagram", "id": "C79mhZ_MDJ7"}, {"kind": "instagram", "id": "C7_leMZMxIR"}, {"kind": "instagram", "id": "C8ACH-hMAHZ"}, {"kind": "instagram", "id": "C8AYy3hMu7b"}, {"kind": "instagram", "id": "C8Ahp1dNl0F"}, {"kind": "instagram", "id": "C8CpzJeMJKE"}, {"kind": "instagram", "id": "C7-BZbmM1a2"}, {"kind": "youtube", "id": "WnSf1bIJUyE"}, {"kind": "instagram", "id": "CuXAELAgT0a"}, {"kind": "instagram", "id": "CuZ4Gh-LW1c"}]'::jsonb where id='irakleio';
update public.cities set image_url='/img/gnc/gnc3on3_chania-min.jpg', years='{2024}', videos='[{"kind": "instagram", "id": "C8M8Ljrgo78"}]'::jsonb where id='chania';
update public.cities set image_url='/img/gnc/gnc3on3_thessaloniki-min.jpg', years='{}', videos='[]'::jsonb where id='thessaloniki';
update public.cities set image_url=null, years='{2023,2024}', videos='[{"kind": "instagram", "id": "C9nQW7wsnbK"}, {"kind": "instagram", "id": "C9zMP1nMUjv"}, {"kind": "youtube", "id": "4yQ0lbJHM-U"}, {"kind": "instagram", "id": "CvP8XRfNDMA"}]'::jsonb where id='pyrgos';
update public.cities set image_url=null, years='{2024}', videos='[{"kind": "instagram", "id": "C9BG3pet08R"}, {"kind": "instagram", "id": "C9FxmEbMr_q"}, {"kind": "instagram", "id": "C9M_aQXMKyZ"}, {"kind": "instagram", "id": "C9FAbspMwAF"}]'::jsonb where id='korinthos';
update public.cities set image_url='/img/gnc/gnc-vonitsa-apologistiko-scaled.jpg', years='{}', videos='[]'::jsonb where id='vonitsa';
update public.cities set image_url='/img/gnc/gnc-3on3-skala-post-scaled.jpg', years='{2024}', videos='[{"kind": "instagram", "id": "C-rufldMY8Y"}]'::jsonb where id='skala';
update public.cities set image_url=null, years='{2024}', videos='[{"kind": "instagram", "id": "C-YX8W8MjLS"}, {"kind": "instagram", "id": "C-fAAeeML6m"}]'::jsonb where id='gastouni';
update public.cities set image_url=null, years='{2024}', videos='[{"kind": "instagram", "id": "C_559pmMamj"}, {"kind": "instagram", "id": "DAAwxfzsgzK"}]'::jsonb where id='amfilochia';
update public.cities set image_url=null, years='{2024}', videos='[{"kind": "instagram", "id": "C_LAjmyMKsh"}]'::jsonb where id='kalampaka';
update public.cities set image_url=null, years='{2023,2024}', videos='[{"kind": "instagram", "id": "C-LHiSjMlbj"}, {"kind": "instagram", "id": "C-LZX_asaCi"}, {"kind": "instagram", "id": "C-TLr7KM6NB"}, {"kind": "youtube", "id": "VHZd32aumWQ"}, {"kind": "instagram", "id": "CvkkVbesBhr"}]'::jsonb where id='kourouta';
update public.cities set image_url='/img/gnc/gnc3on3_aigio-1-min.jpg', years='{2023}', videos='[{"kind": "youtube", "id": "gc3YnsfcNN8"}, {"kind": "instagram", "id": "CwdT9BGMfih"}]'::jsonb where id='aigio';
update public.cities set image_url=null, years='{2024}', videos='[{"kind": "instagram", "id": "C9VHOn9M-dr"}, {"kind": "instagram", "id": "C9fBcbuMhhj"}]'::jsonb where id='akrata';
update public.cities set image_url=null, years='{2023}', videos='[{"kind": "youtube", "id": "wrWhDfYoxAo"}]'::jsonb where id='veroia';
update public.cities set image_url=null, years='{2023}', videos='[{"kind": "youtube", "id": "-NCoGmzEvQ0"}]'::jsonb where id='drama';
update public.cities set image_url=null, years='{2024}', videos='[{"kind": "instagram", "id": "C6T1VLxMpUB"}]'::jsonb where id='dytiki-achaia';
update public.cities set image_url=null, years='{2023,2024}', videos='[{"kind": "instagram", "id": "DAY04h4Meqh"}, {"kind": "instagram", "id": "DAg1HlBNaaw"}, {"kind": "youtube", "id": "MBIpokc17W4"}, {"kind": "instagram", "id": "CxQwJdAsAJi"}]'::jsonb where id='kalamata';
update public.cities set image_url=null, years='{2024}', videos='[{"kind": "instagram", "id": "C-99K22MXer"}, {"kind": "instagram", "id": "C_aeo0tsQjv"}, {"kind": "instagram", "id": "C_LeIu2MTrs"}]'::jsonb where id='karditsa';
update public.cities set image_url='/img/gnc/gnc3on3_komotini-1-min.jpg', years='{2023}', videos='[{"kind": "youtube", "id": "VOcC1Ix2zQw"}, {"kind": "instagram", "id": "Ct02EOGMmi3"}]'::jsonb where id='komotini';
update public.cities set image_url=null, years='{2024}', videos='[{"kind": "instagram", "id": "C61Qx3KMp7K"}, {"kind": "instagram", "id": "C6s0M69MAFL"}, {"kind": "instagram", "id": "C_F7FXdMWHC"}]'::jsonb where id='larisa';
update public.cities set image_url=null, years='{2023}', videos='[{"kind": "youtube", "id": "JWqlrnnOPbs"}, {"kind": "instagram", "id": "Cx3F4ussjTt"}, {"kind": "instagram", "id": "Cx3Sq8sMWur"}]'::jsonb where id='mykonos';
update public.cities set image_url=null, years='{2024}', videos='[{"kind": "instagram", "id": "C8ZrjU5sBEj"}, {"kind": "instagram", "id": "C8kK5pxspze"}]'::jsonb where id='paiania';
update public.cities set image_url=null, years='{2024}', videos='[{"kind": "instagram", "id": "C8UCTnGNoKq"}]'::jsonb where id='perama';
update public.cities set image_url='/img/gnc/gnc3on3_rafina-min.png', years='{2023}', videos='[{"kind": "youtube", "id": "EA5vlAm5Lpw"}, {"kind": "instagram", "id": "CwU73UaO0r9"}]'::jsonb where id='rafina';
update public.cities set image_url='/img/gnc/gnc3on3_rethymno-min.png', years='{}', videos='[]'::jsonb where id='rethymno';
update public.cities set image_url='/img/gnc/gnc3on3_agiosnikolaos-min.jpg', years='{}', videos='[]'::jsonb where id='agios-nikolaos';
update public.cities set image_url='/img/gnc/gnc-pefki-3x3-1-scaled.jpg', years='{}', videos='[]'::jsonb where id='pefki';
