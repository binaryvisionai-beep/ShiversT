-- Run in Supabase SQL editor if migrations are not applied yet

alter table public.homepage_content
  add column if not exists welcome_card_4_0_title text,
  add column if not exists welcome_card_4_0_subtitle text,
  add column if not exists welcome_card_4_0_image text;
