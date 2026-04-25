-- Add mobile-specific background image and position columns to page_settings
alter table page_settings
  add column if not exists mobile_background_image text,
  add column if not exists mobile_bg_position_x integer not null default 50
    check (mobile_bg_position_x >= 0 and mobile_bg_position_x <= 100),
  add column if not exists mobile_bg_position_y integer not null default 50
    check (mobile_bg_position_y >= 0 and mobile_bg_position_y <= 100),
  add column if not exists mobile_bg_zoom numeric not null default 100
    check (mobile_bg_zoom >= 50 and mobile_bg_zoom <= 200);
