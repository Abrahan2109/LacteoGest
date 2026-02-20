create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  client_name text not null,
  order_date date not null default now(),
  delivery_date date,
  status text not null default 'pendiente',
  production_batch text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  recipe_id uuid not null references recipes(id) on delete restrict,
  quantity numeric not null,
  unit text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

drop trigger if exists t_upd_orders on orders;
create trigger t_upd_orders
before update on orders
for each row
execute function handle_updated_at();

drop trigger if exists t_upd_order_items on order_items;
create trigger t_upd_order_items
before update on order_items
for each row
execute function handle_updated_at();

alter table orders enable row level security;
alter table order_items enable row level security;

create policy "allow read orders anon" on orders
for select
to anon
using (true);

create policy "allow read order_items anon" on order_items
for select
to anon
using (true);

create policy "allow write orders anon" on orders
for all
to anon
using (true)
with check (true);

create policy "allow write order_items anon" on order_items
for all
to anon
using (true)
with check (true);

