-- Optional per-event redirect link for public Events page cards

alter table public.events_special_events
  add column if not exists redirect_url text;
