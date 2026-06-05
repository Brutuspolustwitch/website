-- Giveaway Templates — reusable presets for creating giveaways
create table if not exists giveaway_templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  title       text not null default '',
  description text not null default '',
  prize       text not null default '',
  prize_image text,
  mode        text not null default 'single' check (mode in ('single', 'tickets')),
  ticket_cost integer not null default 0,
  max_entries_per_user integer,
  chat_command text not null default '!enter',
  require_live boolean not null default true,
  cta_text    text,
  cta_url     text,
  cta_color   text,
  created_at  timestamptz not null default now()
);

-- Only admins/configuradores can manage templates (via service key in API)
-- Public read is intentionally disabled — accessed only from admin panel via API
alter table giveaway_templates enable row level security;

create policy "Admin full access" on giveaway_templates
  for all using (true) with check (true);
