-- Slot catalog used by /api/slots for autocomplete and admin-managed slot records.

create extension if not exists pg_trgm;

create table if not exists slots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider text not null default '',
  thumbnail_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, provider)
);

alter table slots alter column provider set default '';
update slots set provider = '' where provider is null;
alter table slots alter column provider set not null;

create index if not exists idx_slots_name on slots using gin (name gin_trgm_ops);

alter table slots enable row level security;

drop policy if exists "Public read slots catalog" on slots;
create policy "Public read slots catalog" on slots for select using (true);

drop policy if exists "Admin insert slots catalog" on slots;
create policy "Admin insert slots catalog" on slots for insert with check (true);

drop policy if exists "Admin update slots catalog" on slots;
create policy "Admin update slots catalog" on slots for update using (true);
