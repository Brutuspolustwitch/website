-- Standalone offer records for external websites such as Arena dos Bónus.
-- These offers are intentionally separate from the Brutuspolus casino_offers table.

create table if not exists external_offer_sites (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'),
  name text not null,
  title text not null default '',
  description text not null default '',
  cta_label text not null default 'Apostar Agora',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into external_offer_sites (
  slug,
  name,
  title,
  description,
  cta_label,
  is_active
) values (
  'arena-dos-bonus',
  'Arena dos Bónus',
  'Ofertas da Arena dos Bónus',
  'Ofertas escolhidas e atualizadas através do painel Brutuspolus.',
  'Apostar Agora',
  true
)
on conflict (slug) do update set
  name = excluded.name,
  updated_at = now();

drop table if exists external_offer_site_items;

create table if not exists external_site_offers (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references external_offer_sites(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9][a-z0-9-]{0,78}[a-z0-9]$'),
  name text not null,
  logo_url text,
  logo_bg text not null default '#666666',
  banner_url text,
  badge text check (badge in ('NEW', 'HOT', 'TOP')),
  tags text[] not null default '{}',
  headline text not null default '',
  bonus_value text not null default '',
  free_spins text not null default '',
  min_deposit text not null default '',
  code text not null default '',
  cashback text,
  withdraw_time text not null default '',
  license text not null default '',
  established text not null default '',
  notes text[] not null default '{}',
  affiliate_url text not null default '#',
  cta_label text,
  rating numeric(3,1) not null default 5.0,
  visible boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, slug)
);

create index if not exists idx_external_site_offers_site_sort
  on external_site_offers(site_id, visible, sort_order);

alter table external_offer_sites enable row level security;
alter table external_site_offers enable row level security;

drop policy if exists "Public read external offer sites"
  on external_offer_sites;
create policy "Public read external offer sites"
  on external_offer_sites for select using (true);

drop policy if exists "Public read external site offers"
  on external_site_offers;
create policy "Public read external site offers"
  on external_site_offers for select using (true);
