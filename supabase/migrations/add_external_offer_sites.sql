-- External offer feeds controlled from the Brutuspolus admin.

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

create table if not exists external_offer_site_items (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references external_offer_sites(id) on delete cascade,
  offer_id uuid not null references casino_offers(id) on delete cascade,
  visible boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 0,
  custom_headline text,
  custom_bonus_value text,
  custom_cta_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, offer_id)
);

create index if not exists idx_external_offer_sites_slug
  on external_offer_sites(slug);

create index if not exists idx_external_offer_site_items_site_sort
  on external_offer_site_items(site_id, visible, sort_order);

alter table external_offer_sites enable row level security;
alter table external_offer_site_items enable row level security;

drop policy if exists "Public read external offer sites"
  on external_offer_sites;
create policy "Public read external offer sites"
  on external_offer_sites for select using (true);

drop policy if exists "Public read external offer site items"
  on external_offer_site_items;
create policy "Public read external offer site items"
  on external_offer_site_items for select using (true);

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
  title = external_offer_sites.title,
  description = external_offer_sites.description,
  cta_label = external_offer_sites.cta_label,
  updated_at = now();

insert into external_offer_site_items (
  site_id,
  offer_id,
  visible,
  sort_order
)
select
  sites.id,
  offers.id,
  offers.visible,
  offers.sort_order
from external_offer_sites sites
cross join casino_offers offers
where sites.slug = 'arena-dos-bonus'
on conflict (site_id, offer_id) do nothing;
