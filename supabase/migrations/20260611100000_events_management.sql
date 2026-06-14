-- Events special events CMS: schema, RLS, storage, seed data

create table if not exists public.events_special_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text not null default '',
  description text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  button_text text not null default 'View Details',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.events_special_events
  add column if not exists button_text text not null default 'View Details';

create table if not exists public.events_special_event_images (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events_special_events (id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists events_special_events_sort_order_idx
  on public.events_special_events (sort_order);

create index if not exists events_special_events_active_sort_idx
  on public.events_special_events (is_active, sort_order);

create index if not exists events_special_event_images_event_id_idx
  on public.events_special_event_images (event_id);

create or replace function public.set_events_special_events_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_special_events_updated_at on public.events_special_events;

create trigger events_special_events_updated_at
  before update on public.events_special_events
  for each row
  execute function public.set_events_special_events_updated_at();

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

alter table public.events_special_events enable row level security;
alter table public.events_special_event_images enable row level security;

drop policy if exists "events_special_events_public_select" on public.events_special_events;
drop policy if exists "events_special_events_admin_select" on public.events_special_events;
drop policy if exists "events_special_events_admin_insert" on public.events_special_events;
drop policy if exists "events_special_events_admin_update" on public.events_special_events;
drop policy if exists "events_special_events_admin_delete" on public.events_special_events;

create policy "events_special_events_public_select"
  on public.events_special_events for select
  using (is_active = true);

create policy "events_special_events_admin_select"
  on public.events_special_events for select
  using (public.is_admin());

create policy "events_special_events_admin_insert"
  on public.events_special_events for insert
  with check (public.is_admin());

create policy "events_special_events_admin_update"
  on public.events_special_events for update
  using (public.is_admin());

create policy "events_special_events_admin_delete"
  on public.events_special_events for delete
  using (public.is_admin());

drop policy if exists "events_special_event_images_public_select" on public.events_special_event_images;
drop policy if exists "events_special_event_images_admin_select" on public.events_special_event_images;
drop policy if exists "events_special_event_images_admin_insert" on public.events_special_event_images;
drop policy if exists "events_special_event_images_admin_update" on public.events_special_event_images;
drop policy if exists "events_special_event_images_admin_delete" on public.events_special_event_images;

create policy "events_special_event_images_public_select"
  on public.events_special_event_images for select
  using (
    exists (
      select 1 from public.events_special_events e
      where e.id = event_id and e.is_active = true
    )
  );

create policy "events_special_event_images_admin_select"
  on public.events_special_event_images for select
  using (public.is_admin());

create policy "events_special_event_images_admin_insert"
  on public.events_special_event_images for insert
  with check (public.is_admin());

create policy "events_special_event_images_admin_update"
  on public.events_special_event_images for update
  using (public.is_admin());

create policy "events_special_event_images_admin_delete"
  on public.events_special_event_images for delete
  using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'events',
  'events',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

drop policy if exists "events_storage_public_select" on storage.objects;
drop policy if exists "events_storage_admin_insert" on storage.objects;
drop policy if exists "events_storage_admin_update" on storage.objects;
drop policy if exists "events_storage_admin_delete" on storage.objects;

create policy "events_storage_public_select"
  on storage.objects for select
  using (bucket_id = 'events');

create policy "events_storage_admin_insert"
  on storage.objects for insert
  with check (bucket_id = 'events' and public.is_admin());

create policy "events_storage_admin_update"
  on storage.objects for update
  using (bucket_id = 'events' and public.is_admin());

create policy "events_storage_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'events' and public.is_admin());

-- Seed initial events (only when missing by title)
insert into public.events_special_events (title, subtitle, description, sort_order, is_active, button_text)
select v.title, v.subtitle, v.description, v.sort_order, true, 'View Details'
from (
  values
    (
      'Romantic Dinner',
      'An Evening Made for Two',
      'Celebrate love with an intimate candlelit dinner, curated menus, and elegant table settings designed for two.',
      1
    ),
    (
      'Sunday Roast',
      'Classic British feast every Sunday.',
      'Enjoy a traditional British Sunday roast with Yorkshire pudding, seasonal vegetables, and rich gravy every week.',
      2
    ),
    (
      'Corporate Events',
      'Where Business Meets Elegance',
      'Host meetings, conferences, and corporate dinners in a refined setting with professional service and custom setups.',
      3
    ),
    (
      'Christmas Festival',
      'Festive celebrations to remember.',
      'Experience the magic of the season with festive décor, special menus, and joyful celebrations for all ages.',
      4
    )
) as v(title, subtitle, description, sort_order)
where not exists (
  select 1 from public.events_special_events e where e.title = v.title
);
