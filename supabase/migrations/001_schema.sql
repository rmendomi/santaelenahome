-- =====================================================
-- Gastos Santa Elena — Schema + RLS + Storage
-- =====================================================

-- Profiles (auto-creado al registrarse)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'user',
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: usuario ve y edita su perfil"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Trigger: crear profile al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================
-- Categories
-- =====================================================
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  color       text default '#2D6A4F',
  icon        text default '🏷️',
  active      boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "categories: autenticados leen"
  on public.categories for select
  using (auth.role() = 'authenticated');

create policy "categories: autenticados escriben"
  on public.categories for insert
  with check (auth.role() = 'authenticated');

create policy "categories: autenticados actualizan"
  on public.categories for update
  using (auth.role() = 'authenticated');

-- =====================================================
-- Payment Methods
-- =====================================================
create table if not exists public.payment_methods (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  icon        text default '💳',
  active      boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.payment_methods enable row level security;

create policy "payment_methods: autenticados leen"
  on public.payment_methods for select
  using (auth.role() = 'authenticated');

create policy "payment_methods: autenticados escriben"
  on public.payment_methods for insert
  with check (auth.role() = 'authenticated');

create policy "payment_methods: autenticados actualizan"
  on public.payment_methods for update
  using (auth.role() = 'authenticated');

-- =====================================================
-- Responsibles
-- =====================================================
create table if not exists public.responsibles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  active      boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.responsibles enable row level security;

create policy "responsibles: autenticados leen"
  on public.responsibles for select
  using (auth.role() = 'authenticated');

create policy "responsibles: autenticados escriben"
  on public.responsibles for insert
  with check (auth.role() = 'authenticated');

create policy "responsibles: autenticados actualizan"
  on public.responsibles for update
  using (auth.role() = 'authenticated');

-- =====================================================
-- Expenses
-- =====================================================
create table if not exists public.expenses (
  id                 uuid primary key default gen_random_uuid(),
  expense_date       date not null default current_date,
  amount             integer not null check (amount > 0),
  category_id        uuid references public.categories(id),
  payment_method_id  uuid references public.payment_methods(id),
  responsible_id     uuid references public.responsibles(id),
  detail             text,
  vendor             text,
  receipt_url        text,
  kind               text not null default 'simple' check (kind in ('simple', 'grouped')),
  created_by         uuid references auth.users(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "expenses: autenticados leen"
  on public.expenses for select
  using (auth.role() = 'authenticated');

create policy "expenses: autenticados insertan"
  on public.expenses for insert
  with check (auth.role() = 'authenticated');

create policy "expenses: autenticados actualizan"
  on public.expenses for update
  using (auth.role() = 'authenticated');

create policy "expenses: autenticados eliminan"
  on public.expenses for delete
  using (auth.role() = 'authenticated');

-- Trigger: updated_at automático
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger expenses_updated_at
  before update on public.expenses
  for each row execute function public.update_updated_at();

-- Índices para consultas frecuentes
create index if not exists expenses_date_idx on public.expenses(expense_date desc);
create index if not exists expenses_category_idx on public.expenses(category_id);
create index if not exists expenses_responsible_idx on public.expenses(responsible_id);
create index if not exists expenses_created_by_idx on public.expenses(created_by);

-- =====================================================
-- Expense Items (para compras agrupadas)
-- =====================================================
create table if not exists public.expense_items (
  id          uuid primary key default gen_random_uuid(),
  expense_id  uuid not null references public.expenses(id) on delete cascade,
  name        text not null,
  amount      integer not null check (amount > 0),
  category_id uuid references public.categories(id),
  created_at  timestamptz not null default now()
);

alter table public.expense_items enable row level security;

create policy "expense_items: autenticados leen"
  on public.expense_items for select
  using (auth.role() = 'authenticated');

create policy "expense_items: autenticados insertan"
  on public.expense_items for insert
  with check (auth.role() = 'authenticated');

create policy "expense_items: autenticados actualizan"
  on public.expense_items for update
  using (auth.role() = 'authenticated');

create policy "expense_items: autenticados eliminan"
  on public.expense_items for delete
  using (auth.role() = 'authenticated');

create index if not exists expense_items_expense_idx on public.expense_items(expense_id);

-- =====================================================
-- App Settings (configuración global)
-- =====================================================
create table if not exists public.app_settings (
  key         text primary key,
  value       jsonb not null default '{}',
  updated_at  timestamptz not null default now()
);

alter table public.app_settings enable row level security;

create policy "app_settings: autenticados leen"
  on public.app_settings for select
  using (auth.role() = 'authenticated');

create policy "app_settings: autenticados escriben"
  on public.app_settings for all
  using (auth.role() = 'authenticated');

-- =====================================================
-- Storage: bucket receipts
-- =====================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  true,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

create policy "receipts: autenticados suben"
  on storage.objects for insert
  with check (bucket_id = 'receipts' and auth.role() = 'authenticated');

create policy "receipts: lectura pública"
  on storage.objects for select
  using (bucket_id = 'receipts');

create policy "receipts: autenticados eliminan"
  on storage.objects for delete
  using (bucket_id = 'receipts' and auth.role() = 'authenticated');
