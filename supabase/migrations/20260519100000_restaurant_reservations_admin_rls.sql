-- Admin read/update policies for restaurant reservations (table created by public site)

alter table public.restaurant_reservations enable row level security;

drop policy if exists "admin read all reservations" on public.restaurant_reservations;
drop policy if exists "admin update reservations" on public.restaurant_reservations;

create policy "admin read all reservations"
  on public.restaurant_reservations for select to authenticated
  using (true);

create policy "admin update reservations"
  on public.restaurant_reservations for update to authenticated
  using (true)
  with check (true);
