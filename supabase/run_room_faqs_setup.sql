-- =============================================================================
-- RUN THIS IN SUPABASE: Dashboard → SQL Editor → New query → Paste → Run
-- Seeds the 6 room-page FAQs and enables admin CRUD via is_admin().
-- Safe to re-run.
-- =============================================================================

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

create table if not exists public.room_faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists room_faqs_display_order_idx on public.room_faqs (display_order);
create index if not exists room_faqs_is_active_idx on public.room_faqs (is_active);

alter table public.room_faqs enable row level security;

drop policy if exists "room_faqs_public_select_active" on public.room_faqs;
drop policy if exists "room_faqs_admin_select" on public.room_faqs;
drop policy if exists "room_faqs_admin_insert" on public.room_faqs;
drop policy if exists "room_faqs_admin_update" on public.room_faqs;
drop policy if exists "room_faqs_admin_delete" on public.room_faqs;

create policy "room_faqs_public_select_active"
  on public.room_faqs for select
  using (is_active = true);

create policy "room_faqs_admin_select"
  on public.room_faqs for select
  using (public.is_admin());

create policy "room_faqs_admin_insert"
  on public.room_faqs for insert
  with check (public.is_admin());

create policy "room_faqs_admin_update"
  on public.room_faqs for update
  using (public.is_admin());

create policy "room_faqs_admin_delete"
  on public.room_faqs for delete
  using (public.is_admin());

insert into public.room_faqs (question, answer, display_order, is_active)
select * from (values
  (
    'What are the check-in and check-out times?',
    'Check-in is at 2:00 PM and check-out is at 11:00 AM. Early check-in or late check-out may be arranged subject to availability — just let us know in advance.',
    0,
    true
  ),
  (
    'Is breakfast included with the room?',
    'Complimentary breakfast is included with most room categories. Please confirm at the time of booking.',
    1,
    true
  ),
  (
    'Do you offer airport transfers?',
    'Yes, we offer chargeable airport pickup and drop services. Please request at least 24 hours before your arrival.',
    2,
    true
  ),
  (
    'What is the cancellation policy?',
    'Cancellations made up to 48 hours before check-in are free of charge. Standard cancellation fees apply for later cancellations.',
    3,
    true
  ),
  (
    'Is the property suitable for couples?',
    'Absolutely. Shivers Oasis is a quiet, intimate retreat — well suited for couples looking for privacy, comfort, and a peaceful setting.',
    4,
    true
  ),
  (
    'Are pets allowed?',
    'We currently do not accommodate pets at the property. We apologise for any inconvenience.',
    5,
    true
  )
) as seed(question, answer, display_order, is_active)
where not exists (select 1 from public.room_faqs limit 1);
