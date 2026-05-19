-- Gallery images table + storage for SHIVERS admin CMS

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  title text,
  image_url text not null,
  category text not null check (category in ('food', 'ambiance')),
  display_order integer not null default 0,
  is_visible boolean not null default true,
  object_position text not null default 'center center',
  alt_text text,
  blur_data_url text,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gallery_images_category_idx on public.gallery_images (category);
create index if not exists gallery_images_visible_order_idx on public.gallery_images (is_visible, display_order);
create index if not exists gallery_images_display_order_idx on public.gallery_images (display_order);

create or replace function public.set_gallery_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists gallery_images_updated_at on public.gallery_images;

create trigger gallery_images_updated_at
  before update on public.gallery_images
  for each row
  execute function public.set_gallery_updated_at();

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

alter table public.gallery_images enable row level security;

drop policy if exists "gallery_public_select" on public.gallery_images;
drop policy if exists "gallery_admin_select" on public.gallery_images;
drop policy if exists "gallery_admin_insert" on public.gallery_images;
drop policy if exists "gallery_admin_update" on public.gallery_images;
drop policy if exists "gallery_admin_delete" on public.gallery_images;

create policy "gallery_public_select"
  on public.gallery_images for select
  using (is_visible = true);

create policy "gallery_admin_select"
  on public.gallery_images for select
  using (public.is_admin());

create policy "gallery_admin_insert"
  on public.gallery_images for insert
  with check (public.is_admin());

create policy "gallery_admin_update"
  on public.gallery_images for update
  using (public.is_admin());

create policy "gallery_admin_delete"
  on public.gallery_images for delete
  using (public.is_admin());

-- Storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gallery-images',
  'gallery-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "gallery_storage_public_read" on storage.objects;
drop policy if exists "gallery_storage_admin_insert" on storage.objects;
drop policy if exists "gallery_storage_admin_update" on storage.objects;
drop policy if exists "gallery_storage_admin_delete" on storage.objects;

create policy "gallery_storage_public_read"
  on storage.objects for select
  using (bucket_id = 'gallery-images');

create policy "gallery_storage_admin_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'gallery-images'
    and public.is_admin()
  );

create policy "gallery_storage_admin_update"
  on storage.objects for update
  using (
    bucket_id = 'gallery-images'
    and public.is_admin()
  );

create policy "gallery_storage_admin_delete"
  on storage.objects for delete
  using (
    bucket_id = 'gallery-images'
    and public.is_admin()
  );
