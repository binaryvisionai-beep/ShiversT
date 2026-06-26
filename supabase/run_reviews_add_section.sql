-- =============================================================================
-- RUN IN SUPABASE SQL EDITOR (run the whole script at once)
-- Adds `section` column: restaurant | rooms | tiffin
-- =============================================================================

-- 1) Add column (nullable first — safest on existing tables)
alter table public.website_reviews
  add column if not exists section text;

-- 2) Backfill existing rows
update public.website_reviews
set section = 'restaurant'
where section is null or trim(section) = '';

-- 3) Enforce default + not null
alter table public.website_reviews
  alter column section set default 'restaurant';

alter table public.website_reviews
  alter column section set not null;

-- 4) Check constraint (separate step)
alter table public.website_reviews
  drop constraint if exists website_reviews_section_check;

alter table public.website_reviews
  add constraint website_reviews_section_check
  check (section in ('restaurant', 'rooms', 'tiffin'));

-- 5) Index
create index if not exists website_reviews_section_idx
  on public.website_reviews (section, status, created_at desc);

-- =============================================================================
-- SEED DATA (only if not already present for that section + name)
-- =============================================================================

-- Rooms Oasis
insert into public.website_reviews (guest_name, rating, comment, status, section)
select v.guest_name, v.rating, v.comment, 'approved', 'rooms'
from (values
  (
    'Karine T',
    5,
    'Very nice place, the room was lovley! Highly recomend to stay here. It''s very close to everything. Only 3 min walk to nearest beach. The restaurant at Shivers Oasis luxury rooms is exceptionaly good. The service and food is some of the best we have had in India. Alam at Shivers was most helpfull with baggasje and service.'
  ),
  (
    'A Veks',
    5,
    'Lovely place to stay with clean spacious rooms, amazing staff, very close to local shops, about ten minutes walk to the beach. Would definitely visit again on my next visit'
  ),
  (
    'Shohid Ahmed',
    5,
    'I really enjoyed the stay here. Quite and peaceful. The rooms were awesome.'
  ),
  (
    'Irfan Molla',
    5,
    'The rooms and the restaurant was too good. I will visit back soon.'
  )
) as v(guest_name, rating, comment)
where not exists (
  select 1
  from public.website_reviews r
  where r.guest_name = v.guest_name
    and r.section = 'rooms'
);

-- Northeast Tiffin Box
insert into public.website_reviews (guest_name, rating, comment, status, section)
select v.guest_name, v.rating, v.comment, 'approved', 'tiffin'
from (values
  (
    'Goutam Patra',
    5,
    'The food arrives fresh, well-packaged and bursting with distinctive flavours.'
  ),
  (
    'Rahul Wangkhei',
    5,
    'Chicken chilli fry that made my day. The bold spices and tender meat were simply irresistible. The place is blessing for those craving authentic Northeast dishes in goa'
  ),
  (
    'shivbhadra sutar',
    5,
    'Lovely and flavourful food. Staff very fruendly and helpful'
  ),
  (
    'Rimaka Kharbani',
    5,
    'Order the tiffin box and everything arrived hot and well packed, the flavours were amazing.'
  )
) as v(guest_name, rating, comment)
where not exists (
  select 1
  from public.website_reviews r
  where r.guest_name = v.guest_name
    and r.section = 'tiffin'
);

-- Verify
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'website_reviews'
  and column_name = 'section';

select section, count(*) as total
from public.website_reviews
where status = 'approved'
group by section
order by section;
