-- 014: the real sponsor logos, taken from gnc3on3.gr and renamed after each sponsor.
-- Every file is a transparent PNG drawn in dark ink for a white page, so the site shows them on a light
-- panel; that is why the column only stores the path.

update public.sponsors set logo_url = '/img/gnc/sponsors/loux.png'               where lower(name) = 'loux';
update public.sponsors set logo_url = '/img/gnc/sponsors/affidea.png'            where lower(name) = 'affidea';
update public.sponsors set logo_url = '/img/gnc/sponsors/crossover.png'          where lower(name) = 'crossover';
update public.sponsors set logo_url = '/img/gnc/sponsors/skentzos.png'           where name = 'Σκέντζος';
update public.sponsors set logo_url = '/img/gnc/sponsors/kerasidis-group.png'    where lower(name) = 'kerasidis group';
update public.sponsors set logo_url = '/img/gnc/sponsors/wilson.png'             where lower(name) = 'wilson';
update public.sponsors set logo_url = '/img/gnc/sponsors/vlastaras.png'          where lower(name) = 'vlastaras';
update public.sponsors set logo_url = '/img/gnc/sponsors/account-saints.png'     where lower(name) = 'account saints';
update public.sponsors set logo_url = '/img/gnc/sponsors/my-way-hotel.png'       where lower(name) = 'my way hotel';
update public.sponsors set logo_url = '/img/gnc/sponsors/stegno.png'             where lower(name) = 'stegno';
update public.sponsors set logo_url = '/img/gnc/sponsors/theocar.png'            where lower(name) = 'theocar';
update public.sponsors set logo_url = '/img/gnc/sponsors/sbie.png'               where lower(name) = 'sbie';
update public.sponsors set logo_url = '/img/gnc/sponsors/yayaz.png'              where lower(name) = 'yayaz';

-- appears on the 2025 sponsor strip but was missing from the list
insert into public.sponsors (name, url, logo_url, tier, sort_order)
select 'Go Alexandroupolis', 'https://goalexandroupolis.com', '/img/gnc/sponsors/go-alexandroupolis.png', 'partner',
       coalesce((select max(sort_order) from public.sponsors), 0) + 1
where not exists (select 1 from public.sponsors where lower(name) = 'go alexandroupolis');
