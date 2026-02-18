CREATE EXTENSION IF NOT EXISTS pgcrypto;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'material_type') THEN
    CREATE TYPE material_type AS ENUM ('leche','insumo','empaque');
  END IF;
END
$$;
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
drop policy if exists "allow read for anon" on materials;
drop policy if exists "allow insert for anon" on materials;
drop policy if exists "allow update for anon" on materials;
create policy "allow read for anon" on materials for select to anon using (true);
create policy "allow insert for anon" on materials for insert to anon with check (true);
create policy "allow update for anon" on materials for update to anon using (true) with check (true);
