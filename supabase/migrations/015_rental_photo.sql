-- 015: the mobile hoop had the wrong photo on the rentals page; point it at the cut-out from gnc3on3.gr.
update public.rentals
   set image_url = '/img/gnc/basketball-olympic.png'
 where name like 'Κινητή μπασκέτα%';
