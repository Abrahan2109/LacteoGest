create extension if not exists pgcrypto;
create type material_type as enum ('leche','insumo','empaque');
create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider text,
  quantity numeric not null default 0,
  unit text not null,
  expiry_date date,
  type material_type not null,
  min_threshold numeric not null default 0,
  inserted_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table materials enable row level security;
create policy "allow read for anon" on materials for select to anon using (true);
create policy "allow insert for anon" on materials for insert to anon with check (true);
create policy "allow update for anon" on materials for update to anon using (true) with check (true);
