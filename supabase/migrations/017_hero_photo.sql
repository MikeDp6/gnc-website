-- 017: the tour photo that opens the site — sunset, the ball in focus, the game going on behind it.
-- Only touches covers that came from the WordPress import (or none at all); anything uploaded from
-- the admin lives in Supabase storage and is left alone.
update public.tournaments
   set cover_url = '/img/gnc/hero-gnc-sunset.jpg'
 where cover_url is null
    or cover_url = ''
    or cover_url like '/img/%';
