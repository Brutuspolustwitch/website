-- Choose which imported bonus hunt is shown on each public page.

create table if not exists bonus_hunt_page_display (
  target text primary key check (
    target in ('bonus_hunt', 'adivinha_o_resultado', 'daily_session')
  ),
  session_id uuid not null references bonus_hunt_sessions(id) on delete cascade,
  updated_at timestamptz not null default now()
);

create index if not exists idx_bonus_hunt_page_display_session
  on bonus_hunt_page_display(session_id);

alter table bonus_hunt_page_display enable row level security;

drop policy if exists "Public read bonus hunt page display"
  on bonus_hunt_page_display;
create policy "Public read bonus hunt page display"
  on bonus_hunt_page_display for select using (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bonus_hunt_page_display'
  ) then
    alter publication supabase_realtime add table bonus_hunt_page_display;
  end if;
end $$;
