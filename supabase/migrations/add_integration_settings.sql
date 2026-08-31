-- Server-only integration secrets (e.g. Streamers Center API key) managed via the admin UI,
-- as an alternative to setting them as environment variables.
create table if not exists integration_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- RLS enabled with NO policies: anon/authenticated clients get zero access.
-- Only the Supabase service role (used exclusively in server-side API routes) can read/write.
alter table integration_settings enable row level security;
