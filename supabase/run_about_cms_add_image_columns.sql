-- Fix: Could not find the 'image_url_2' column of 'cms_content'
-- Run in Supabase SQL Editor, then wait ~30s or reload the API schema.

alter table public.cms_content
  add column if not exists image_url_2 text not null default '';

alter table public.cms_content
  add column if not exists image_url_3 text not null default '';

-- Refresh PostgREST schema cache (Supabase usually picks this up within seconds)
notify pgrst, 'reload schema';
