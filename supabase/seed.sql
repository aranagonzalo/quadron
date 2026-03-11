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
  created_at timestamptz default now()
);
