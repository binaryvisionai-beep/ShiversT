-- About page CMS: table, storage, extra image columns, seed content.
-- Run once in Supabase SQL Editor.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.adminauth where id = auth.uid()
  );
$$;

create table if not exists public.cms_content (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  title text not null default '',
  subtitle text not null default '',
  content text not null default '',
  image_url text not null default '',
  image_url_2 text not null default '',
  image_url_3 text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.cms_content
  add column if not exists image_url_2 text not null default '';

alter table public.cms_content
  add column if not exists image_url_3 text not null default '';

alter table public.cms_content enable row level security;

drop policy if exists "cms_public_select" on public.cms_content;
drop policy if exists "cms_admin_all" on public.cms_content;

create policy "cms_public_select"
  on public.cms_content for select using (true);

create policy "cms_admin_all"
  on public.cms_content for all
  using (public.is_admin())
  with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('about', 'about', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "about_storage_public_read" on storage.objects;
drop policy if exists "about_storage_admin_insert" on storage.objects;
drop policy if exists "about_storage_admin_update" on storage.objects;
drop policy if exists "about_storage_admin_delete" on storage.objects;

create policy "about_storage_public_read"
  on storage.objects for select using (bucket_id = 'about');

create policy "about_storage_admin_insert"
  on storage.objects for insert
  with check (bucket_id = 'about' and public.is_admin());

create policy "about_storage_admin_update"
  on storage.objects for update
  using (bucket_id = 'about' and public.is_admin());

create policy "about_storage_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'about' and public.is_admin());

insert into public.cms_content (section_key, title, subtitle, content) values
  ('about_hero', 'Shivers Oasis Luxury Rooms', 'Brand Story · Goa', 'A sanctuary shaped by silence, light, and intention|Some places are built with plans. Ours was built with feeling. Four rooms. One soul. A story that existed long before we ever thought to give it a name.'),
  ('about_intro', 'A sanctuary, not a hotel', '', 'There was never a grand blueprint spread across a polished table. No calculated vision of what the future should become. There were only hands — patient hands — shaping clay into walls, restoring old wood that already carried memories, placing objects not for decoration, but because they belonged.|Shivers did not emerge like a business. It unfolded the way a home does — slowly, instinctively, lovingly. A place shaped over time by people who believed that beauty should feel lived in, never manufactured.|We never designed rooms. We lived with them quietly, until they revealed what they wished to become — and so Oasis came into being. Not as a property. Not as a product, but as a sanctuary where every corner carries the imprint of the same hands that prepared the meals, swept the courtyard, lit the lamps at dusk, and welcomed strangers as though they had been expected all along.'),
  ('about_rooms_header', 'Four States|of Being', 'Four Rooms', 'We have only four rooms. Some things lose their soul the moment they are multiplied. Each room at Oasis was created like a letter written to someone deeply cherished — slowly, intimately, with intention in every detail.'),
  ('about_room_1', 'The Banyan', 'Super Deluxe Suite · King Size', 'Ancient · Majestic · Rooted|Named after Goa''s eternal guardian — the banyan tree that shelters life beneath its endless embrace. This is the grandest room in Oasis. A space with presence, depth, and quiet authority. A room that feels less occupied than inherited.'),
  ('about_room_2', 'The Canopy', 'Super Deluxe · Expansive Suite', 'Lush · Airy · Enveloping|The largest room in the house, named for the feeling it evokes. To stand beneath a canopy is to feel held inside something living — breathing, protective, green in spirit, even in silence. A space abundant with openness, yet never distant.'),
  ('about_room_3', 'The Nest', 'Deluxe Cozy Room', 'Intimate · Handcrafted · Warm|Small in scale, infinite in feeling. A nest is never merely shelter. It is tenderness made visible — carefully assembled piece by piece for rest, comfort, and stillness. This room was shaped with that same devotion — personal, soft, quietly human.'),
  ('about_room_4', 'The Burrow', 'Deluxe Cozy Room', 'Earthy · Hidden · Deeply Still|The retreat for weary souls. A burrow is where something gentle returns when the world becomes too loud. Held close to the earth, wrapped in silence, untouched by urgency. The kind of room where mornings arrive slowly, and leaving feels unnecessary.'),
  ('about_table', 'The Table at the Heart of It All', '', 'Before the rooms, there was always the table. At Shivers, we have long believed that the sincerest form of hospitality begins with a meal. Not performance. Not presentation. Not carefully rehearsed luxury. Simply honest food — prepared from ingredients grown nearby, cooked slowly by people who care deeply about what arrives on your plate.|The restaurant was never created as a service. It is an invitation — to sit longer than intended, to let conversations wander, and to allow the evening to unfold at its own pace.|We cook the way we built Oasis — patiently, from scratch, with our whole hearts in it.'),
  ('about_philosophy', 'Where earth, air, and flame come together in harmony', '', 'Rooted in the heart of Goa for over twenty years. Long before Goa became a destination, it was a feeling — and we made a quiet promise to create a refuge for those who arrive carrying the weight of the world, who have forgotten the sound of stillness, and whose spirit searches for something slower, deeper, more real. We found it here — not the Goa of neon and noise, but the one that wakes before the world does, where mornings carry the scent of earth after rain and life is not measured, but felt. There are no grand facades. No rehearsed gestures. Only the glow of firelight against timeworn walls, a meal shaped by the earth it came from, and long, unclaimed hours that belong entirely to you.'),
  ('about_stat_1', 'Rooms at Oasis', '4', ''),
  ('about_stat_2', 'Signature Dishes', '50', '+'),
  ('about_stat_3', 'Years in Goa', '20', '+'),
  ('about_stat_4', 'Guest Rating', '5', '★'),
  ('about_tiffin_header', 'An Awakening of|Forgotten Flavours', 'The Northeast Tiffin Box', 'Where the mountains of the Northeast meet the warmth of Goa''s table — a quiet journey of smoke, earth, and memory carried across distance with intention.'),
  ('about_tiffin_smoke', 'Smoke', '', 'Slow fire. Ancient technique. Flavours shaped with patience — never rushed, never replicated.'),
  ('about_tiffin_earth', 'Earth', '', 'Ingredients connected intimately to land and season. Honest. Untouched. Deeply rooted in origin.'),
  ('about_tiffin_memory', 'Memory', '', 'Recipes older than menus themselves. Heritage carried carefully forward in every spoonful.'),
  ('about_tiffin_quote', 'We do not simply serve food. We serve the feeling of arriving somewhere you have never been — and recognising it anyway.', '', ''),
  ('about_invite', 'Shivers is not merely a place you visit. It is a place that remains with you long after you have gone.', 'For more than twenty years, people have left Oasis carrying something they did not arrive with — something quieter, softer, entirely their own.', '')
on conflict (section_key) do nothing;
