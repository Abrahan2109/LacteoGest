alter table orders
add column if not exists payment_status text default 'pendiente',
add column if not exists delivery_status text default 'pendiente';
