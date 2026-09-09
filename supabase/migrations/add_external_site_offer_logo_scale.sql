-- Persist image zoom for offers rendered on external sites such as Arena dos Bónus.

alter table external_site_offers
  add column if not exists logo_scale numeric(3,2) not null default 1.00;

update external_site_offers
set logo_scale = 1.00
where logo_scale is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'external_site_offers_logo_scale_check'
  ) then
    alter table external_site_offers
      add constraint external_site_offers_logo_scale_check
      check (logo_scale >= 0.50 and logo_scale <= 2.00);
  end if;
end $$;
