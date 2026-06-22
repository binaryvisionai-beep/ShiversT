-- Welcome Card 4.0: homepage grid slot 4 (after cards 1–3)

alter table public.homepage_content
  add column if not exists welcome_card_4_0_title text,
  add column if not exists welcome_card_4_0_subtitle text,
  add column if not exists welcome_card_4_0_image text;
