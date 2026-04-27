-- ============================================================
-- User Points (Brutus Points) — earned via predictions, etc.
-- ============================================================

alter table users
  add column if not exists points integer not null default 0;

create index if not exists idx_users_points on users(points desc);

-- Atomic points increment (avoids races on concurrent bets).
create or replace function increment_user_points(p_user_id uuid, p_amount integer)
returns integer
language plpgsql
security definer
as $$
declare
  new_total integer;
begin
  update users
     set points = points + p_amount,
         updated_at = now()
   where id = p_user_id
   returning points into new_total;
  return coalesce(new_total, 0);
end $$;
