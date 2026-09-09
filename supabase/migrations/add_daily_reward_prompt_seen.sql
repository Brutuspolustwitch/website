-- Track daily reward popup visibility separately from reward claims.

alter table daily_reward_profiles
  add column if not exists last_prompted_date date;

comment on column daily_reward_profiles.last_prompted_date
  is 'UTC date when the daily reward popup was last auto-shown to this user.';
