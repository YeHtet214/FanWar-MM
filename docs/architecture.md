# FanWar MM — Technical Architecture (MVP)

## Stack
- **Frontend:** Next.js (App Router), TypeScript, Tailwind (dark-first theme)
- **Backend:** Supabase (Postgres + Auth [email/mobile OTP] + Realtime + Storage)
- **Match Data:** Third-party EPL API ingest job

## High-Level Components
1. **Web App (Next.js)**
   - Auth pages (email and mobile-number login)
   - Team selection gate
   - War room feeds
   - Match thread live UI
   - Meme generator UI
2. **Supabase Postgres**
   - Core relational domain
   - Reputation event logs
   - Moderation/report tables
3. **Realtime Layer**
   - Post insert/update events
   - Live thread subscriptions
4. **Storage Buckets**
   - `post-media`
   - `meme-templates`
   - `generated-memes`
5. **Scheduled Workers (cron/edge functions)**
   - Fixture sync
   - Match status updates
   - Weekly leaderboard reset job

## Data Flow
- Fixture sync job upserts `matches`
- Match starts => thread marked `live`
- Clients subscribe to live thread channel
- New posts/reactions broadcast via Realtime
- Reputation trigger writes `reputation_logs` and updates aggregates

## Scalability Notes
- Index on `match_id`, `team_id`, `created_at`, `score`
- Use cursor pagination for high-volume threads
- Denormalized counters for reactions/votes to reduce expensive aggregates
- Soft-delete content for moderation auditability
