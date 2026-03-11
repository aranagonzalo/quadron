-- categories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#6366f1'
);
insert into categories (name, color) values
  ('Alimentación', '#22c55e'),
  ('Transporte', '#3b82f6'),
  ('Entretenimiento', '#a855f7'),
  ('Salud', '#ef4444'),
  ('Servicios', '#f97316'),
  ('Ropa', '#ec4899'),
  ('Viajes', '#14b8a6'),
  ('Otros gastos', '#6b7280')
on conflict do nothing;

-- cards
create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  bank text not null default 'Otro',
  last_four text,
  color text default '#6366f1',
  created_at timestamptz default now()
);

-- transactions
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  card_id uuid references cards(id) on delete set null,
  date date not null,
  description text not null,
  amount numeric(12,2) not null,
  type text not null check (type in ('gasto', 'abono')),
  category_id uuid references categories(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  month int not null,
  year int not null,
  tx_hash text unique,
  created_at timestamptz default now()
);

-- Migration for existing databases: run this once if the table already exists
-- alter table transactions add column if not exists tx_hash text unique;

-- income sources (cashflow)
create table if not exists income_sources (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  month int not null,
  year int not null,
  name text not null,
  amount numeric(12,2) not null,
  created_at timestamptz default now()
);
-- Migration for existing databases:
-- (run as-is, table is new)

-- subcategories
create table if not exists subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  unique(category_id, name)
);

-- Migration for existing databases:
-- alter table transactions add column if not exists subcategory_id uuid references subcategories(id) on delete set null;

insert into subcategories (category_id, name)
select id, unnest(array[
  'Delivery (Rappi/PedidosYa)', 'Restaurantes', 'Supermercado', 'Cafeterías', 'Fast food', 'Bares / Copas'
]) from categories where name = 'Alimentación' on conflict do nothing;

insert into subcategories (category_id, name)
select id, unnest(array[
  'Taxi / Rideshare (Uber/InDrive)', 'Gasolina', 'Peaje / Estacionamiento', 'Mantenimiento auto', 'Metro / Bus'
]) from categories where name = 'Transporte' on conflict do nothing;

insert into subcategories (category_id, name)
select id, unnest(array[
  'Streaming (Netflix/Spotify)', 'Cine', 'Eventos / Conciertos', 'Videojuegos', 'Suscripciones'
]) from categories where name = 'Entretenimiento' on conflict do nothing;

insert into subcategories (category_id, name)
select id, unnest(array[
  'Farmacia', 'Médico / Clínica', 'Gym (SmartFit/Bodytech)', 'Psicología', 'Spa / Masajes', 'Laboratorios'
]) from categories where name = 'Salud' on conflict do nothing;

insert into subcategories (category_id, name)
select id, unnest(array[
  'Alquiler', 'Luz / Agua / Gas', 'Internet / Teléfono', 'Muebles / Decoración', 'Limpieza'
]) from categories where name = 'Servicios' on conflict do nothing;

insert into subcategories (category_id, name)
select id, unnest(array[
  'Ropa', 'Zapatos', 'Accesorios', 'Peluquería / Belleza', 'Perfumes / Cosméticos'
]) from categories where name = 'Ropa' on conflict do nothing;

insert into subcategories (category_id, name)
select id, unnest(array[
  'Vuelos', 'Hotel / Airbnb', 'Tours / Actividades', 'Comida en viaje'
]) from categories where name = 'Viajes' on conflict do nothing;

insert into subcategories (category_id, name)
select id, unnest(array[
  'Regalos', 'Donaciones', 'Eventos sociales (bodas/cumples)', 'Tecnología', 'Educación / Cursos', 'Mascotas', 'Seguros / Comisiones bancarias'
]) from categories where name = 'Otros gastos' on conflict do nothing;
