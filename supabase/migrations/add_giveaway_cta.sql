-- Add optional CTA button fields to giveaways
alter table giveaways
  add column if not exists cta_text text,
  add column if not exists cta_url  text;
