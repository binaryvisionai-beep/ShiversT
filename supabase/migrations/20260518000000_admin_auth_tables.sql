-- Admin panel auth tables (run in Supabase SQL Editor if not using CLI migrations)

create table if not exists public.adminauth (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.adminsignup (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.adminauth (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.adminlogin (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.adminauth (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.adminauth enable row level security;
alter table public.adminsignup enable row level security;
alter table public.adminlogin enable row level security;

drop policy if exists "adminauth_select_own" on public.adminauth;
drop policy if exists "adminauth_insert_own" on public.adminauth;
drop policy if exists "adminauth_update_own" on public.adminauth;
drop policy if exists "adminsignup_insert_own" on public.adminsignup;
drop policy if exists "adminsignup_select_own" on public.adminsignup;
drop policy if exists "adminlogin_insert_own" on public.adminlogin;
drop policy if exists "adminlogin_select_own" on public.adminlogin;

create policy "adminauth_select_own"
  on public.adminauth for select
  using (auth.uid() = id);

create policy "adminauth_insert_own"
  on public.adminauth for insert
  with check (auth.uid() = id);

create policy "adminauth_update_own"
  on public.adminauth for update
  using (auth.uid() = id);

create policy "adminsignup_insert_own"
  on public.adminsignup for insert
  with check (auth.uid() = admin_id);

create policy "adminsignup_select_own"
  on public.adminsignup for select
  using (auth.uid() = admin_id);

create policy "adminlogin_insert_own"
  on public.adminlogin for insert
  with check (auth.uid() = admin_id);

create policy "adminlogin_select_own"
  on public.adminlogin for select
  using (auth.uid() = admin_id);

-- Create adminauth + adminsignup when a new auth user registers (works with email confirmation)
create or replace function public.handle_new_admin_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.adminauth (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;

  insert into public.adminsignup (admin_id, email)
  values (new.id, coalesce(new.email, ''));

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_admin on auth.users;

create trigger on_auth_user_created_admin
  after insert on auth.users
  for each row
  execute function public.handle_new_admin_user();
