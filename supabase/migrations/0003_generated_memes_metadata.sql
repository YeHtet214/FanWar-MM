alter table generated_memes
  add column if not exists overlay_text jsonb not null default '[]'::jsonb,
  add column if not exists storage_path text;
