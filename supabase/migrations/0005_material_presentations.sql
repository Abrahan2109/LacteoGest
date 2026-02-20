create table if not exists material_presentations (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references materials(id) on delete cascade,
  presentation text not null,
  brand text,
  package_quantity numeric,
  package_unit text,
  package_cost numeric,
  available_packages numeric not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create trigger if not exists t_upd_material_presentations
before update on material_presentations
for each row execute function handle_updated_at();

alter table material_presentations enable row level security;

create policy if not exists "allow read material_presentations anon"
on material_presentations for select to anon using (true);

create policy if not exists "allow write material_presentations anon"
on material_presentations for all to anon using (true) with check (true);

