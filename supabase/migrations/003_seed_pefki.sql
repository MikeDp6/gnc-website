-- GNC 3on3 — seed: Λυκόβρυση–Πεύκη 2026 (real registrations, 52 teams) + sample groups/results for 35+ and U11
-- Deterministic UUIDs (uuid5) so the frontend can link to them during development.
insert into public.cities (id,name,name_en,region,lat,lng,sort_order) values
 ('pefki','Λυκόβρυση–Πεύκη','Lykovrysi–Pefki','Αττική',38.0620,23.7960,1),
 ('pallini','Παλλήνη','Pallini','Αττική',38.0050,23.8850,2),
 ('thessaloniki','Θεσσαλονίκη','Thessaloniki','Κεντρική Μακεδονία',40.6401,22.9444,3),
 ('patra','Πάτρα','Patras','Δυτική Ελλάδα',38.2466,21.7346,4),
 ('irakleio','Ηράκλειο','Heraklion','Κρήτη',35.3387,25.1442,5),
 ('larisa','Λάρισα','Larissa','Θεσσαλία',39.6390,22.4191,6),
 ('kalamata','Καλαμάτα','Kalamata','Πελοπόννησος',37.0389,22.1142,7),
 ('mykonos','Μύκονος','Mykonos','Νότιο Αιγαίο',37.4467,25.3289,8)
on conflict (id) do nothing;

insert into public.categories (id,label,short,color_key,gender,sort_order) values
 ('u11_mixed','U11 MIXED','U11','u11','mixed',10),
 ('u13_mixed','U13 MIXED','U13','u13','mixed',20),
 ('u15_men','U15 MEN','U15','u15','men',30),
 ('u18_men','U18 MEN','U18 MEN','u18','men',40),
 ('u18_women','U18 WOMEN','U18 WOMEN','u18','women',41),
 ('o18_men','18+ MEN','18+ MEN','o18','men',50),
 ('o18_women','18+ WOMEN','18+ WOMEN','o18','women',51),
 ('o35_men','35+ MEN','35+ MEN','o35','men',60),
 ('o40_men','40+ MEN','40+ MEN','o35','men',61)
on conflict (id) do nothing;

insert into public.tournaments (id,slug,name,name_en,city_id,venue,address,starts_on,ends_on,courts,status,is_public,cover_url,settings_json) values
 ('8a47efff-180a-5080-a241-62ed28a78804','pefki-2026','Λυκόβρυση–Πεύκη 2026','Lykovrysi–Pefki 2026','pefki','Δημοτικό Γήπεδο Πεύκης','Ελ. Βενιζέλου 12, Πεύκη','2026-09-19','2026-09-20',2,'upcoming',true,'/img/hero-dark.jpg',
  '{"slot":20,"flow":"block","ko":"after","gap":1,"gapSoft":true,"maxGap":45,"latestStart":"22:00","koTailRule":true}'::jsonb);
insert into public.tournament_days (id,tournament_id,day_index,date,start_time,end_time,courts) values
 ('a338814b-a193-5c9c-a1d9-c39ed8de1a63','8a47efff-180a-5080-a241-62ed28a78804',1,'2026-09-19','17:00','23:30',2),
 ('7dfa81ba-bd76-5629-9328-5b9e6267a001','8a47efff-180a-5080-a241-62ed28a78804',2,'2026-09-20','16:00','23:30',2);
insert into public.tournament_categories (tournament_id,category_id,format,qualifiers,sort_order) values
 ('8a47efff-180a-5080-a241-62ed28a78804','u11_mixed','rr4',2,1),('8a47efff-180a-5080-a241-62ed28a78804','u13_mixed','rr4',null,2),('8a47efff-180a-5080-a241-62ed28a78804','u15_men','rr4',null,3),('8a47efff-180a-5080-a241-62ed28a78804','u18_men','rr4',2,4),
 ('8a47efff-180a-5080-a241-62ed28a78804','u18_women','rr4',null,5),('8a47efff-180a-5080-a241-62ed28a78804','o18_men','rr4',8,6),('8a47efff-180a-5080-a241-62ed28a78804','o18_women','rr4',null,7),('8a47efff-180a-5080-a241-62ed28a78804','o35_men','rr4',8,8);

insert into public.teams (id,tournament_id,category_id,name,status) values
 ('da3ae58a-3921-5684-a604-d9200fc09595','8a47efff-180a-5080-a241-62ed28a78804','u11_mixed','Γλυκά Νερά','active'),
 ('4b9af9c2-ca54-5eb3-8769-67c2969ed724','8a47efff-180a-5080-a241-62ed28a78804','u11_mixed','ΣΦΕΝΤΟΝΑΚΙΑ','active'),
 ('1b0c9de9-27c4-5583-8a30-69b476ee8313','8a47efff-180a-5080-a241-62ed28a78804','u11_mixed','PEFKI HEAT','active'),
 ('87033a9f-1bee-5261-b458-277ab81892d6','8a47efff-180a-5080-a241-62ed28a78804','u11_mixed','Wolves','active'),
 ('0e708650-2596-5546-b3c3-c2fbfb30c3e5','8a47efff-180a-5080-a241-62ed28a78804','u13_mixed','Pefki Killers','active'),
 ('cd8d4e58-fa85-5de1-bec2-0f9c22821dfb','8a47efff-180a-5080-a241-62ed28a78804','u13_mixed','Cool Aids','active'),
 ('3c436152-f21a-592a-96ae-ea9aee450ea0','8a47efff-180a-5080-a241-62ed28a78804','u15_men','Clutch time','active'),
 ('5ff6278e-9093-57a4-96c4-91a60361b406','8a47efff-180a-5080-a241-62ed28a78804','u15_men','Fantastic 3','active'),
 ('1168014c-6c74-5f22-8f99-d4a67e09c53f','8a47efff-180a-5080-a241-62ed28a78804','u18_men','3 ξάδερφοι 1 θρύλος','active'),
 ('64a76e3f-1227-5285-8c3e-2e3b6f70938a','8a47efff-180a-5080-a241-62ed28a78804','u18_men','ΤεΣαΠεΠα','active'),
 ('2ed83372-689e-5e41-8941-2e92cd4d5fde','8a47efff-180a-5080-a241-62ed28a78804','u18_men','Sea Men','active'),
 ('64430c3d-bc0e-53ad-a4e4-2b4bf8413d59','8a47efff-180a-5080-a241-62ed28a78804','u18_men','Ατάλαντοι Hawks','active'),
 ('88bb5bf6-8806-5a4d-9f1d-abff5a213476','8a47efff-180a-5080-a241-62ed28a78804','u18_women','KYPSELI STARS','active'),
 ('5aece230-4670-5528-9329-217ac413d753','8a47efff-180a-5080-a241-62ed28a78804','u18_women','THE STARTERS','active'),
 ('04a5581d-0fc2-5203-a142-9efcc759412c','8a47efff-180a-5080-a241-62ed28a78804','o18_men','Athens Modelsprint','active'),
 ('2eaa0380-d702-57dd-b034-fb22acba9698','8a47efff-180a-5080-a241-62ed28a78804','o18_men','Ασχετόπουλοι','active'),
 ('ef61de79-7d53-59d5-90b9-13de41c4c3cc','8a47efff-180a-5080-a241-62ed28a78804','o18_men','Loosers','active'),
 ('dc5bd818-518a-50db-85b0-9bb0d6c04d5d','8a47efff-180a-5080-a241-62ed28a78804','o18_men','ΚΑΠΗ Σεπολίων','active'),
 ('2d5e6ad5-ab0c-5e7a-b4e8-512ba1139e96','8a47efff-180a-5080-a241-62ed28a78804','o18_men','ΚΑΔΜΟΥ','active'),
 ('e83f3097-f749-58ab-b53f-653c02bff627','8a47efff-180a-5080-a241-62ed28a78804','o18_men','Εθνική Πλατείας Λαού','active'),
 ('6f5c20ac-0b28-538a-863c-4a1601af35a0','8a47efff-180a-5080-a241-62ed28a78804','o18_men','BARCA🏀PEFKIS','active'),
 ('d473ab91-c8f2-56d7-a298-be192b0d329d','8a47efff-180a-5080-a241-62ed28a78804','o18_men','Μαϊλος','active'),
 ('47c9f64f-44b1-5609-ac53-a8473b7106c4','8a47efff-180a-5080-a241-62ed28a78804','o18_men','Peronia bc','active'),
 ('88de7e50-db75-559b-90eb-5b3848d99476','8a47efff-180a-5080-a241-62ed28a78804','o18_men','John Pork bc','active'),
 ('38a639db-e3fa-5853-950d-027355d24d9d','8a47efff-180a-5080-a241-62ed28a78804','o18_men','Pefkiham BC','active'),
 ('e74b5294-b439-575c-b7fd-c4a592399dec','8a47efff-180a-5080-a241-62ed28a78804','o18_men','Τα κουκουνάρια','active'),
 ('4ca602d5-2c6c-5b8f-ba2a-63257dc28c27','8a47efff-180a-5080-a241-62ed28a78804','o18_men','Asteras finest','active'),
 ('a1bcbea3-96a2-50a3-bc0e-3095066e851a','8a47efff-180a-5080-a241-62ed28a78804','o18_men','MIATIASMENOI','active'),
 ('00b6fc21-bb50-5e22-9f0e-4b9c91d0ece9','8a47efff-180a-5080-a241-62ed28a78804','o18_men','Lempi Netzo','active'),
 ('5652de4a-8cda-5fbc-bd88-fb7fdd2222e3','8a47efff-180a-5080-a241-62ed28a78804','o18_men','Salto Πεσταλ','active'),
 ('8edccabe-d795-5987-b468-373c4fce8411','8a47efff-180a-5080-a241-62ed28a78804','o18_men','Trigger Pointers','active'),
 ('b61e8728-d04e-5d08-b3ff-737951b58561','8a47efff-180a-5080-a241-62ed28a78804','o18_men','Power Rangers','active'),
 ('533026cb-c0cd-5577-9d11-86d354d01139','8a47efff-180a-5080-a241-62ed28a78804','o18_men','ALKO BC','active'),
 ('93ff66f9-ad09-55c0-8f55-4d3aa8ac7730','8a47efff-180a-5080-a241-62ed28a78804','o18_men','Τα ταγαρια','active'),
 ('ef16e6e4-9696-564d-b576-3bd7851ce09e','8a47efff-180a-5080-a241-62ed28a78804','o18_men','Βουνά','active'),
 ('61788e1a-4e2e-5473-af4c-40ceec7e9857','8a47efff-180a-5080-a241-62ed28a78804','o18_men','NFTates','active'),
 ('a54de221-441c-5deb-be76-169707038e82','8a47efff-180a-5080-a241-62ed28a78804','o18_men','Οι απροπόνητοι','active'),
 ('65cf4ebb-25c5-5a91-9a99-abdee34042f8','8a47efff-180a-5080-a241-62ed28a78804','o18_women','Final dance','active'),
 ('35d1c4e5-a16e-51b1-895f-bf6b89cf7e47','8a47efff-180a-5080-a241-62ed28a78804','o35_men','Erasitechnes BC','active'),
 ('51feded2-2f03-52ca-90d5-60bbf524a740','8a47efff-180a-5080-a241-62ed28a78804','o35_men','RAFINA WARRIORS','active'),
 ('a1d88dbe-3e29-5a78-872d-0c5322d209da','8a47efff-180a-5080-a241-62ed28a78804','o35_men','G(old) Εθνική Πλατείας Λαού','active'),
 ('4776887e-f265-56a0-a2b4-32008294d119','8a47efff-180a-5080-a241-62ed28a78804','o35_men','ΜΑΝΑΓΓΙΑΡΤ','active'),
 ('07545f51-07f0-518d-84fb-1ad6642533d5','8a47efff-180a-5080-a241-62ed28a78804','o35_men','Δαλάι Κλάμα','active'),
 ('fb4ee00b-930d-535c-a357-c603886eb00d','8a47efff-180a-5080-a241-62ed28a78804','o35_men','Babasket','active'),
 ('83b2f07d-2b29-55af-b05a-a5fddeb69ce8','8a47efff-180a-5080-a241-62ed28a78804','o35_men','Chicago Cools','active'),
 ('1db9dafe-45f7-5107-bd48-08c1d5b2be91','8a47efff-180a-5080-a241-62ed28a78804','o35_men','ΦΑΕΘΩΝ','active'),
 ('fd8c92ed-a383-5112-8ea8-606eb4d7e39e','8a47efff-180a-5080-a241-62ed28a78804','o35_men','Brokos BC','active'),
 ('100f8880-3b58-540b-891a-b4c5c864ba0b','8a47efff-180a-5080-a241-62ed28a78804','o35_men','Retro Ballers','active'),
 ('a68c1abe-205f-5be8-993b-0dbeb14ada10','8a47efff-180a-5080-a241-62ed28a78804','o35_men','ΤΟΞΟΤΗΣ ΠΕΥΚΗΣ','active'),
 ('5b68d90f-abb8-5343-8c25-f27f5c1ab3f8','8a47efff-180a-5080-a241-62ed28a78804','o35_men','45 και Βάλε','active'),
 ('58ea919b-e09f-5e9f-a385-c5a9f5ef5f5b','8a47efff-180a-5080-a241-62ed28a78804','o35_men','Phenoms','active'),
 ('e759c24a-15bd-5348-849a-e46da38a6983','8a47efff-180a-5080-a241-62ed28a78804','o35_men','DUNKERS','active');

-- sample players (fictional names) for Erasitechnes BC
insert into public.players (id,first_name,last_name,city,since_year) values
 ('2bc9bcbe-e685-5062-a60f-a3dc6facde1f','Γιώργος','Αντωνίου','Αθήνα',2019),
 ('f9c4f873-b975-5c17-a13f-e13acb4941a6','Νίκος','Καραμάνος','Αθήνα',2022),
 ('517c244e-3196-575f-a0d5-3b7036b03f86','Δημήτρης','Πετρίδης','Αθήνα',2023),
 ('831cec4c-b28f-51f6-be37-bf175907d4a7','Στέλιος','Λαμπρόπουλος','Αθήνα',2026);
update public.teams set captain_id='2bc9bcbe-e685-5062-a60f-a3dc6facde1f', city='Αθήνα', checked_in_at='2026-09-19 16:42+03' where id='35d1c4e5-a16e-51b1-895f-bf6b89cf7e47';
insert into public.team_players (team_id,player_id,role,accepted_at) values
 ('35d1c4e5-a16e-51b1-895f-bf6b89cf7e47','2bc9bcbe-e685-5062-a60f-a3dc6facde1f','captain',now()),
 ('35d1c4e5-a16e-51b1-895f-bf6b89cf7e47','f9c4f873-b975-5c17-a13f-e13acb4941a6','player',now()),
 ('35d1c4e5-a16e-51b1-895f-bf6b89cf7e47','517c244e-3196-575f-a0d5-3b7036b03f86','player',now()),
 ('35d1c4e5-a16e-51b1-895f-bf6b89cf7e47','831cec4c-b28f-51f6-be37-bf175907d4a7','player',now());

-- sample groups (the scheduler will generate the real ones)
insert into public.groups (id,tournament_id,category_id,name,sort_order,note) values ('33b49bb3-9e2d-5651-94d7-845046afed39','8a47efff-180a-5080-a241-62ed28a78804','o35_men','Όμιλος Α',1,'Μπλε = προκρίνονται στα νοκ-άουτ');
insert into public.group_teams (group_id,team_id,seed) values ('33b49bb3-9e2d-5651-94d7-845046afed39','35d1c4e5-a16e-51b1-895f-bf6b89cf7e47',1), ('33b49bb3-9e2d-5651-94d7-845046afed39','4776887e-f265-56a0-a2b4-32008294d119',2), ('33b49bb3-9e2d-5651-94d7-845046afed39','fb4ee00b-930d-535c-a357-c603886eb00d',3), ('33b49bb3-9e2d-5651-94d7-845046afed39','1db9dafe-45f7-5107-bd48-08c1d5b2be91',4);
insert into public.groups (id,tournament_id,category_id,name,sort_order,note) values ('5e0552ed-fee4-5fd2-aab6-4b7ad646073c','8a47efff-180a-5080-a241-62ed28a78804','o35_men','Όμιλος Β',2,'Ισοβαθμία: μεταξύ τους αγώνας → διαφορά πόντων');
insert into public.group_teams (group_id,team_id,seed) values ('5e0552ed-fee4-5fd2-aab6-4b7ad646073c','51feded2-2f03-52ca-90d5-60bbf524a740',1), ('5e0552ed-fee4-5fd2-aab6-4b7ad646073c','100f8880-3b58-540b-891a-b4c5c864ba0b',2), ('5e0552ed-fee4-5fd2-aab6-4b7ad646073c','83b2f07d-2b29-55af-b05a-a5fddeb69ce8',3), ('5e0552ed-fee4-5fd2-aab6-4b7ad646073c','07545f51-07f0-518d-84fb-1ad6642533d5',4);
insert into public.groups (id,tournament_id,category_id,name,sort_order,note) values ('4e647926-f4f4-56b0-aee3-9daef3b1794e','8a47efff-180a-5080-a241-62ed28a78804','u11_mixed','Όμιλος Α',1,'Οι 2 πρώτοι στον τελικό');
insert into public.group_teams (group_id,team_id,seed) values ('4e647926-f4f4-56b0-aee3-9daef3b1794e','da3ae58a-3921-5684-a604-d9200fc09595',1), ('4e647926-f4f4-56b0-aee3-9daef3b1794e','87033a9f-1bee-5261-b458-277ab81892d6',2), ('4e647926-f4f4-56b0-aee3-9daef3b1794e','4b9af9c2-ca54-5eb3-8769-67c2969ed724',3), ('4e647926-f4f4-56b0-aee3-9daef3b1794e','1b0c9de9-27c4-5583-8a30-69b476ee8313',4);

-- sample matches (a slice of Saturday + the 35+ knockout)
insert into public.matches (id,tournament_id,category_id,phase,label,code,group_id,day_id,court,slot_time,home_team_id,away_team_id,home_score,away_score,status,home_label,away_label,home_source,away_source) values
 ('a18c3756-059b-57eb-81f2-44d5492b3ceb','8a47efff-180a-5080-a241-62ed28a78804','u11_mixed','group','Όμιλος Α','u11:g:1','4e647926-f4f4-56b0-aee3-9daef3b1794e','a338814b-a193-5c9c-a1d9-c39ed8de1a63',1,'17:00','da3ae58a-3921-5684-a604-d9200fc09595','1b0c9de9-27c4-5583-8a30-69b476ee8313',14,9,'final',null,null,null,null),
 ('fc48f1c2-e7ae-5e15-94f4-cf99e82b34b5','8a47efff-180a-5080-a241-62ed28a78804','u11_mixed','group','Όμιλος Α','u11:g:2','4e647926-f4f4-56b0-aee3-9daef3b1794e','a338814b-a193-5c9c-a1d9-c39ed8de1a63',2,'17:00','4b9af9c2-ca54-5eb3-8769-67c2969ed724','87033a9f-1bee-5261-b458-277ab81892d6',11,12,'final',null,null,null,null),
 ('8a236dc2-1dec-5c75-9971-5e09245d9728','8a47efff-180a-5080-a241-62ed28a78804','u18_men','group','Όμιλος Α','u18:g:1',null,'a338814b-a193-5c9c-a1d9-c39ed8de1a63',1,'17:20','1168014c-6c74-5f22-8f99-d4a67e09c53f','64430c3d-bc0e-53ad-a4e4-2b4bf8413d59',21,16,'final',null,null,null,null),
 ('1c64403f-5d25-56ff-b194-b1c75d65b9c2','8a47efff-180a-5080-a241-62ed28a78804','u13_mixed','group','Όμιλος','u13:g:1',null,'a338814b-a193-5c9c-a1d9-c39ed8de1a63',2,'17:20','0e708650-2596-5546-b3c3-c2fbfb30c3e5','cd8d4e58-fa85-5de1-bec2-0f9c22821dfb',18,15,'final',null,null,null,null),
 ('6422f096-2a6b-5ac7-bbea-6a6ab2d9208f','8a47efff-180a-5080-a241-62ed28a78804','u18_men','group','Όμιλος Α','u18:g:2',null,'a338814b-a193-5c9c-a1d9-c39ed8de1a63',1,'17:40','64a76e3f-1227-5285-8c3e-2e3b6f70938a','2ed83372-689e-5e41-8941-2e92cd4d5fde',14,9,'live',null,null,null,null),
 ('121e2d04-37bb-5083-b1cf-933d72629f77','8a47efff-180a-5080-a241-62ed28a78804','u15_men','group','Όμιλος','u15:g:1',null,'a338814b-a193-5c9c-a1d9-c39ed8de1a63',2,'17:40','3c436152-f21a-592a-96ae-ea9aee450ea0','5ff6278e-9093-57a4-96c4-91a60361b406',null,null,'scheduled',null,null,null,null),
 ('303d5993-1222-5077-865b-af4ce95fec62','8a47efff-180a-5080-a241-62ed28a78804','u11_mixed','group','Όμιλος Α','u11:g:3','4e647926-f4f4-56b0-aee3-9daef3b1794e','a338814b-a193-5c9c-a1d9-c39ed8de1a63',1,'18:00','da3ae58a-3921-5684-a604-d9200fc09595','4b9af9c2-ca54-5eb3-8769-67c2969ed724',null,null,'scheduled',null,null,null,null),
 ('e3cd5a01-9478-54ad-b27d-99f5f20d94a6','8a47efff-180a-5080-a241-62ed28a78804','u18_women','group','Όμιλος','u18w:g:1',null,'a338814b-a193-5c9c-a1d9-c39ed8de1a63',2,'18:00','88bb5bf6-8806-5a4d-9f1d-abff5a213476','5aece230-4670-5528-9329-217ac413d753',null,null,'scheduled',null,null,null,null),
 ('18f84b47-e624-5114-9913-4cad4993bb3f','8a47efff-180a-5080-a241-62ed28a78804','o35_men','group','Όμιλος Α','o35:g:1','33b49bb3-9e2d-5651-94d7-845046afed39','a338814b-a193-5c9c-a1d9-c39ed8de1a63',1,'18:20','35d1c4e5-a16e-51b1-895f-bf6b89cf7e47','1db9dafe-45f7-5107-bd48-08c1d5b2be91',21,12,'final',null,null,null,null),
 ('9cda662a-37a7-564d-96fc-14f008ed50a4','8a47efff-180a-5080-a241-62ed28a78804','o35_men','group','Όμιλος Β','o35:g:2','5e0552ed-fee4-5fd2-aab6-4b7ad646073c','a338814b-a193-5c9c-a1d9-c39ed8de1a63',2,'18:20','51feded2-2f03-52ca-90d5-60bbf524a740','100f8880-3b58-540b-891a-b4c5c864ba0b',null,null,'scheduled',null,null,null,null),
 ('577b9d52-24e7-56ba-97b1-a1e095e0e699','8a47efff-180a-5080-a241-62ed28a78804','o18_men','group','Όμιλος Α','o18:g:1',null,'a338814b-a193-5c9c-a1d9-c39ed8de1a63',1,'18:40','04a5581d-0fc2-5203-a142-9efcc759412c','dc5bd818-518a-50db-85b0-9bb0d6c04d5d',null,null,'scheduled',null,null,null,null),
 ('7fcdc594-42b3-51f7-a07f-ed1187e450b5','8a47efff-180a-5080-a241-62ed28a78804','o18_men','group','Όμιλος Β','o18:g:2',null,'a338814b-a193-5c9c-a1d9-c39ed8de1a63',2,'18:40','6f5c20ac-0b28-538a-863c-4a1601af35a0','47c9f64f-44b1-5609-ac53-a8473b7106c4',null,null,'scheduled',null,null,null,null),
 ('383789f5-9a46-596d-a500-b97fc14faa85','8a47efff-180a-5080-a241-62ed28a78804','o35_men','group','Όμιλος Α','o35:g:3','33b49bb3-9e2d-5651-94d7-845046afed39','a338814b-a193-5c9c-a1d9-c39ed8de1a63',2,'19:40','4776887e-f265-56a0-a2b4-32008294d119','35d1c4e5-a16e-51b1-895f-bf6b89cf7e47',14,17,'final',null,null,null,null),
 ('bacdfdff-06d0-583e-be25-a6fd7420ef9b','8a47efff-180a-5080-a241-62ed28a78804','o35_men','group','Όμιλος Α','o35:g:4','33b49bb3-9e2d-5651-94d7-845046afed39','a338814b-a193-5c9c-a1d9-c39ed8de1a63',1,'21:00','35d1c4e5-a16e-51b1-895f-bf6b89cf7e47','fb4ee00b-930d-535c-a357-c603886eb00d',19,12,'final',null,null,null,null),
 ('85141cfa-3cb5-5402-b6dd-ca40ac8b997b','8a47efff-180a-5080-a241-62ed28a78804','o35_men','group','Όμιλος Α','o35:g:5','33b49bb3-9e2d-5651-94d7-845046afed39','a338814b-a193-5c9c-a1d9-c39ed8de1a63',1,'22:00','4776887e-f265-56a0-a2b4-32008294d119','1db9dafe-45f7-5107-bd48-08c1d5b2be91',20,10,'final',null,null,null,null),
 ('82ea894e-dcf6-5180-aab4-2fbecbba9f5a','8a47efff-180a-5080-a241-62ed28a78804','o35_men','group','Όμιλος Α','o35:g:6','33b49bb3-9e2d-5651-94d7-845046afed39','a338814b-a193-5c9c-a1d9-c39ed8de1a63',2,'22:20','fb4ee00b-930d-535c-a357-c603886eb00d','4776887e-f265-56a0-a2b4-32008294d119',14,17,'final',null,null,null,null),
 ('01e69a83-be32-5aa5-bb16-f03c4f2f4282','8a47efff-180a-5080-a241-62ed28a78804','o35_men','group','Όμιλος Α','o35:g:7','33b49bb3-9e2d-5651-94d7-845046afed39','a338814b-a193-5c9c-a1d9-c39ed8de1a63',1,'22:40','1db9dafe-45f7-5107-bd48-08c1d5b2be91','fb4ee00b-930d-535c-a357-c603886eb00d',6,14,'final',null,null,null,null),
 ('a0211a48-686b-5d24-aa48-00b26aae6e39','8a47efff-180a-5080-a241-62ed28a78804','o35_men','qf','Προημιτελικός 1','o35:qf:1',null,'7dfa81ba-bd76-5629-9328-5b9e6267a001',1,'20:00','35d1c4e5-a16e-51b1-895f-bf6b89cf7e47','07545f51-07f0-518d-84fb-1ad6642533d5',null,null,'scheduled',null,null,'G:33b49bb3-9e2d-5651-94d7-845046afed39:1','G:5e0552ed-fee4-5fd2-aab6-4b7ad646073c:4'),
 ('f6d9cd5d-cece-5e06-a78c-db9bd182d6cb','8a47efff-180a-5080-a241-62ed28a78804','o35_men','qf','Προημιτελικός 2','o35:qf:2',null,'7dfa81ba-bd76-5629-9328-5b9e6267a001',2,'20:00','51feded2-2f03-52ca-90d5-60bbf524a740','1db9dafe-45f7-5107-bd48-08c1d5b2be91',null,null,'scheduled',null,null,'G:5e0552ed-fee4-5fd2-aab6-4b7ad646073c:1','G:33b49bb3-9e2d-5651-94d7-845046afed39:4'),
 ('08f0ffd5-af9e-5a79-95f1-133a8774c541','8a47efff-180a-5080-a241-62ed28a78804','o35_men','qf','Προημιτελικός 3','o35:qf:3',null,'7dfa81ba-bd76-5629-9328-5b9e6267a001',1,'20:20','4776887e-f265-56a0-a2b4-32008294d119','83b2f07d-2b29-55af-b05a-a5fddeb69ce8',null,null,'scheduled',null,null,'G:33b49bb3-9e2d-5651-94d7-845046afed39:2','G:5e0552ed-fee4-5fd2-aab6-4b7ad646073c:3'),
 ('0d9e16f1-57b0-592b-8c7f-c341e99985be','8a47efff-180a-5080-a241-62ed28a78804','o35_men','qf','Προημιτελικός 4','o35:qf:4',null,'7dfa81ba-bd76-5629-9328-5b9e6267a001',2,'20:20','100f8880-3b58-540b-891a-b4c5c864ba0b','fb4ee00b-930d-535c-a357-c603886eb00d',null,null,'scheduled',null,null,'G:5e0552ed-fee4-5fd2-aab6-4b7ad646073c:2','G:33b49bb3-9e2d-5651-94d7-845046afed39:3'),
 ('68f0f177-6ee1-5d37-9954-595407a848af','8a47efff-180a-5080-a241-62ed28a78804','o35_men','sf','Ημιτελικός 1','o35:sf:1',null,'7dfa81ba-bd76-5629-9328-5b9e6267a001',1,'21:20',null,null,null,null,'scheduled','Νικ. Προημ. 1','Νικ. Προημ. 4','W:a0211a48-686b-5d24-aa48-00b26aae6e39','W:0d9e16f1-57b0-592b-8c7f-c341e99985be'),
 ('adcc1615-8e02-52c4-9b9c-5e9dfa07a9f6','8a47efff-180a-5080-a241-62ed28a78804','o35_men','sf','Ημιτελικός 2','o35:sf:2',null,'7dfa81ba-bd76-5629-9328-5b9e6267a001',2,'21:20',null,null,null,null,'scheduled','Νικ. Προημ. 2','Νικ. Προημ. 3','W:f6d9cd5d-cece-5e06-a78c-db9bd182d6cb','W:08f0ffd5-af9e-5a79-95f1-133a8774c541'),
 ('98db69b5-873d-5a54-ab8b-acf9d93b49b6','8a47efff-180a-5080-a241-62ed28a78804','o35_men','final','Τελικός','o35:final',null,'7dfa81ba-bd76-5629-9328-5b9e6267a001',1,'22:20',null,null,null,null,'scheduled','Νικ. Ημιτελικού 1','Νικ. Ημιτελικού 2','W:68f0f177-6ee1-5d37-9954-595407a848af','W:adcc1615-8e02-52c4-9b9c-5e9dfa07a9f6');

insert into public.ticker_items (tag,text,text_en,tone,sort_order) values
 ('LIVE','U18 MEN · ΤΕΣΑΠΕΠΑ – SEA MEN · ΓΗΠΕΔΟ 1','U18 MEN · TESAPEPA – SEA MEN · COURT 1','orange',1),
 ('ΕΠΟΜΕΝΟ','ΛΥΚΟΒΡΥΣΗ–ΠΕΥΚΗ · 19–20 ΣΕΠ','LYKOVRYSI–PEFKI · 19–20 SEP','blue',2),
 ('ΔΗΛΩΣΕΙΣ','ΠΑΛΛΗΝΗ · ΑΝΟΙΧΤΕΣ ΕΩΣ 3 ΟΚΤ','PALLINI · OPEN UNTIL 3 OCT','orange',3),
 ('ΠΡΟΓΡΑΜΜΑ','ΠΕΥΚΗ · ΑΝΑΡΤΗΘΗΚΕ','PEFKI · PUBLISHED','blue',4),
 ('ΝΕΟ','ΤΟ APP ΤΗΣ GNC ΣΤΟ APP STORE & GOOGLE PLAY','THE GNC APP ON APP STORE & GOOGLE PLAY','orange',5);
insert into public.sponsors (name,sort_order) values ('Χορηγός 1',1),('Χορηγός 2',2),('Δήμος Λυκόβρυσης–Πεύκης',3),('Χορηγός 3',4),('Media partner',5);