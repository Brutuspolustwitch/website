-- Single-row lock used to throttle the public /api/bonus-hunt/live poll endpoint
-- so concurrent viewers don't each trigger a Streamers Center API call.
create table if not exists bonus_hunt_sync_state (
  id smallint primary key default 1,
  last_synced_at timestamptz not null default 'epoch',
  constraint bonus_hunt_sync_state_singleton check (id = 1)
);

insert into bonus_hunt_sync_state (id, last_synced_at)
values (1, 'epoch')
on conflict (id) do nothing;

-- RLS enabled with no policies: only the service role client (used server-side) can touch this table.
alter table bonus_hunt_sync_state enable row level security;
