create table if not exists moderation_reviews (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  reviewer_id uuid not null references profiles(id) on delete restrict,
  target_profile_id uuid references profiles(id) on delete set null,
  decision text not null check (decision in ('confirmed', 'dismissed')),
  moderation_action moderation_action not null default 'none',
  strike_count_after int,
  notes text,
  created_at timestamptz not null default now()
);

alter table moderation_reviews enable row level security;

drop policy if exists moderation_reviews_select_moderators on moderation_reviews;

create policy moderation_reviews_select_moderators
  on moderation_reviews
  for select
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'moderator');

drop policy if exists moderation_reviews_write_moderators on moderation_reviews;

create policy moderation_reviews_write_moderators
  on moderation_reviews
  for all
  to authenticated
  using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'moderator'
    and (reviewer_id = auth.uid() or reviewer_id is null)
  )
  with check (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'moderator'
    and reviewer_id = auth.uid()
  );

create or replace function create_report_and_increment_post_count(
  target_post_id uuid,
  target_reporter_id uuid,
  report_reason text
)
returns void
language plpgsql
security definer
as $$
begin
  insert into reports (reporter_id, post_id, reason, status)
  values (target_reporter_id, target_post_id, report_reason, 'open');

  update posts
  set report_count = report_count + 1
  where id = target_post_id;
end;
$$;

create or replace function process_moderation_confirmed(
  report_id_input uuid,
  post_id_input uuid,
  reviewer_id_input uuid,
  target_profile_id_input uuid,
  moderation_action_input moderation_action,
  strike_count_after_input int,
  notes_input text
)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set strike_count = strike_count_after_input,
      moderation_state = moderation_action_input
  where id = target_profile_id_input;

  update posts
  set is_hidden = true,
      strike_linked_profile_id = target_profile_id_input,
      hidden_reason = 'confirmed_violation'
  where id = post_id_input;

  insert into moderation_reviews (
    report_id,
    post_id,
    reviewer_id,
    target_profile_id,
    decision,
    moderation_action,
    strike_count_after,
    notes
  )
  values (
    report_id_input,
    post_id_input,
    reviewer_id_input,
    target_profile_id_input,
    'confirmed',
    moderation_action_input,
    strike_count_after_input,
    notes_input
  );
end;
$$;

create index if not exists idx_moderation_reviews_report on moderation_reviews(report_id, created_at desc);
