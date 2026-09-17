-- 018: three city photos were PNGs of a photograph — around 1 MB between them for pictures that are
-- never shown larger than a card. They are JPEGs now, at half the weight and the same size on screen.
update public.cities   set image_url = replace(image_url, '-min.png', '-min.jpg') where image_url like '%-min.png';
update public.photos   set url       = replace(url, '-min.png', '-min.jpg')       where url like '%-min.png';
update public.tournaments set cover_url = replace(cover_url, '-min.png', '-min.jpg') where cover_url like '%-min.png';
