-- Allow each public bonus hunt display target to be toggled on or off.

alter table bonus_hunt_page_display
  add column if not exists enabled boolean not null default true;
