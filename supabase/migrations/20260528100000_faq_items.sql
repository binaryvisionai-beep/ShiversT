create table if not exists public.faq_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists faq_items_sort_order_idx on public.faq_items (sort_order);
create index if not exists faq_items_published_idx on public.faq_items (is_published);

create or replace function public.set_faq_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists faq_items_updated_at on public.faq_items;

create trigger faq_items_updated_at
  before update on public.faq_items
  for each row
  execute function public.set_faq_items_updated_at();

alter table public.faq_items enable row level security;

drop policy if exists "faq_items_public_select_published" on public.faq_items;
drop policy if exists "faq_items_admin_select" on public.faq_items;
drop policy if exists "faq_items_admin_insert" on public.faq_items;
drop policy if exists "faq_items_admin_update" on public.faq_items;
drop policy if exists "faq_items_admin_delete" on public.faq_items;

create policy "faq_items_public_select_published"
  on public.faq_items for select
  using (is_published = true);

create policy "faq_items_admin_select"
  on public.faq_items for select
  using (public.is_admin());

create policy "faq_items_admin_insert"
  on public.faq_items for insert
  with check (public.is_admin());

create policy "faq_items_admin_update"
  on public.faq_items for update
  using (public.is_admin());

create policy "faq_items_admin_delete"
  on public.faq_items for delete
  using (public.is_admin());
