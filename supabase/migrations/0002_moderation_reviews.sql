create table if not exists moderation_reviews (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  reviewer_id uuid not null references profiles(id),
  target_profile_id uuid references profiles(id),
  decision text not null check (decision in ('confirmed', 'dismissed')),
  moderation_action moderation_action not null default 'none',
  strike_count_after int,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_moderation_reviews_report on moderation_reviews(report_id, created_at desc);
