-- FanWar MM MVP schema

create extension if not exists pgcrypto;

create type post_scope as enum ('team_room', 'match_thread');
create type reaction_type as enum ('clown', 'fire', 'bottle', 'salty', 'laugh');
create type report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
create type moderation_action as enum ('none', 'muted', 'suspended', 'banned');

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  short_code text not null unique,
  crest_url text,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  mobile_no text unique,
  primary_team_id uuid not null references teams(id),
  team_locked boolean not null default true,
  reputation_total int not null default 0,
  strike_count int not null default 0,
  moderation_state moderation_action not null default 'none',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mobile_no_format_chk check (
    mobile_no is null or mobile_no ~ '^\+?[0-9]{7,15}$'
  )
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  external_match_id text not null unique,
  home_team_id uuid not null references teams(id),
  away_team_id uuid not null references teams(id),
  kickoff_at timestamptz not null,
  status text not null,
  is_live boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  scope post_scope not null,
  team_id uuid references teams(id),
  match_id uuid references matches(id),
  parent_post_id uuid references posts(id) on delete cascade,
  body text,
  media_url text,
  upvotes int not null default 0,
  downvotes int not null default 0,
  score int not null default 0,
  is_hidden boolean not null default false,
  hidden_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint post_scope_target_chk check (
    (scope = 'team_room' and team_id is not null and match_id is null)
    or (scope = 'match_thread' and match_id is not null and team_id is null)
  )
);

create table if not exists post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  reaction reaction_type not null,
  created_at timestamptz not null default now(),
  unique (post_id, user_id, reaction)
);

create table if not exists post_votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists reputation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  event_type text not null,
  points int not null,
  context_type text,
  context_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists weekly_leaderboard (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  user_id uuid not null references profiles(id) on delete cascade,
  team_id uuid references teams(id),
  points int not null default 0,
  rank int,
  created_at timestamptz not null default now(),
  unique (week_start, user_id)
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  reason text not null,
  status report_status not null default 'open',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references profiles(id)
);

create table if not exists meme_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  image_url text not null,
  text_slots jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists generated_memes (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references profiles(id) on delete cascade,
  match_id uuid references matches(id),
  target_team_id uuid references teams(id),
  template_id uuid not null references meme_templates(id),
  rendered_image_url text not null,
  caption text,
  created_at timestamptz not null default now()
);

create index if not exists idx_posts_match_created on posts(match_id, created_at desc);
create index if not exists idx_posts_team_created on posts(team_id, created_at desc);
create index if not exists idx_posts_score_created on posts(score desc, created_at desc);
create index if not exists idx_reputation_user_created on reputation_logs(user_id, created_at desc);
