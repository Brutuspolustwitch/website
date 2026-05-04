-- VIP level threshold configuration (single-row table, admin-editable)
create table if not exists vip_config (
  id int primary key default 1,
  warrior_min int not null default 500,
  champion_min int not null default 2000,
  legend_min int not null default 5000,
  updated_at timestamptz not null default now(),
  constraint vip_config_single_row check (id = 1)
);

-- Seed with defaults if not already present
insert into vip_config (id) values (1) on conflict do nothing;
