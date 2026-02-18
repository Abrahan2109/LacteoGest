create type production_status as enum ('en_proceso','terminado');
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_milk numeric not null default 1,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
create table if not exists recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  material_id uuid references materials(id) on delete set null,
  material_name text,
  amount_per_liter numeric not null,
  unit text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
create table if not exists production_orders (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete restrict,
  date date not null default now(),
  batch text not null,
  status production_status not null default 'en_proceso',
  milk_volume numeric not null default 0,
  quantity_produced numeric not null default 0,
  waste numeric not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
create or replace function handle_updated_at() returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists t_upd_materials on materials;
create trigger t_upd_materials before update on materials for each row execute function handle_updated_at();
drop trigger if exists t_upd_recipes on recipes;
create trigger t_upd_recipes before update on recipes for each row execute function handle_updated_at();
drop trigger if exists t_upd_recipe_ingredients on recipe_ingredients;
create trigger t_upd_recipe_ingredients before update on recipe_ingredients for each row execute function handle_updated_at();
drop trigger if exists t_upd_production_orders on production_orders;
create trigger t_upd_production_orders before update on production_orders for each row execute function handle_updated_at();
alter table recipes enable row level security;
alter table recipe_ingredients enable row level security;
alter table production_orders enable row level security;
create policy "allow read recipes anon" on recipes for select to anon using (true);
create policy "allow read ingredients anon" on recipe_ingredients for select to anon using (true);
create policy "allow read production anon" on production_orders for select to anon using (true);
create policy "allow write recipes anon" on recipes for all to anon using (true) with check (true);
create policy "allow write ingredients anon" on recipe_ingredients for all to anon using (true) with check (true);
create policy "allow write production anon" on production_orders for all to anon using (true) with check (true);
