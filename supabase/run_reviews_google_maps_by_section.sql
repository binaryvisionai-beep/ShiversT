-- =============================================================================
-- RUN IN SUPABASE SQL EDITOR
-- One google_review_settings row per section (restaurant / rooms / tiffin)
-- google_profile_url = Google Maps link for "View on Google" on each page
-- =============================================================================

alter table public.google_review_settings
  add column if not exists section text;

update public.google_review_settings
set section = 'restaurant'
where id = '00000000-0000-0000-0000-000000000001'::uuid
   or section is null;

alter table public.google_review_settings
  drop constraint if exists google_review_settings_section_check;

alter table public.google_review_settings
  add constraint google_review_settings_section_check
  check (section is null or section in ('restaurant', 'rooms', 'tiffin'));

-- Rooms Oasis — Shivers Oasis on Google Maps
insert into public.google_review_settings (
  id,
  section,
  section_heading,
  average_rating,
  review_count_label,
  google_profile_url
)
values (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'rooms',
  'What Our Guests Say',
  5.0,
  '',
  'https://maps.app.goo.gl/ZwpBDJ43S9n1ekvY6'
)
on conflict (id) do update set
  section = excluded.section,
  google_profile_url = excluded.google_profile_url;

-- Northeast Tiffin Box — Google Maps
insert into public.google_review_settings (
  id,
  section,
  section_heading,
  average_rating,
  review_count_label,
  google_profile_url
)
values (
  '00000000-0000-0000-0000-000000000003'::uuid,
  'tiffin',
  'What Our Guests Say',
  5.0,
  '',
  'https://maps.app.goo.gl/sZ5Fs815izKUhbkN9'
)
on conflict (id) do update set
  section = excluded.section,
  google_profile_url = excluded.google_profile_url;

select id, section, google_profile_url, section_heading
from public.google_review_settings
order by section;
