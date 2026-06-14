-- Fix: events_special_events may predate the CMS migration and lack timestamp columns
-- while the updated_at trigger is already attached (causes "record new has no field updated_at").

alter table public.events_special_events
  add column if not exists created_at timestamptz not null default now();

alter table public.events_special_events
  add column if not exists updated_at timestamptz not null default now();

alter table public.events_special_events
  add column if not exists button_text text not null default 'View Details';

alter table public.events_special_events
  add column if not exists redirect_url text;

update public.events_special_events
set
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where created_at is null or updated_at is null;
