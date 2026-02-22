# FanWar MM

FanWar MM is a web-first EPL rivalry community app for Myanmar fans.

## Step-by-step MVP implementation

### Step 1: Foundation
- Next.js 14 + TypeScript + Tailwind (dark-first theme)
- App Router pages for onboarding and feature modules
- Shared domain models in `lib/types.ts`

### Step 2: Community Core
- Team war room feed (`/war-room`) with vote score and football reactions
- Match battleground thread (`/match/[matchId]`) with live mode metadata
- Feed ranking by score + recency in `lib/domain.ts`

### Step 3: Gamification
- Leaderboard page (`/leaderboard`) with reputation and rank ladder
- Reputation events utility via `reputationPoints()`

### Step 4: Meme Generator
- Meme lab (`/meme`) with 5 static templates in `public/templates`
- Template cards display available text slots

### Step 5: Moderation
- Keyword auto-hide logic (`shouldAutoHide()`)
- Three-strike action ladder (`applyStrike()`)

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Supabase setup

Yes — this app expects a real Supabase project and environment keys.

1. Create a project in Supabase.
2. In Supabase SQL Editor, run the schema at `supabase/migrations/0001_mvp_schema.sql`.
3. In **Project Settings → API**, copy:
   - `Project URL`
   - `publishable` key (modern replacement for legacy `anon`)
   - `secret` key (preferred server key)
4. (Optional fallback) if your project still uses legacy keys, you can use `anon` and `service_role`.
5. Create a local env file:

```bash
cp .env.local.example .env.local
```

6. Set these values in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-publishable-key>
SUPABASE_SECRET_KEY=<your-secret-key>
# Legacy fallback (optional):
# SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

> Keep `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` server-only. Never expose them to browser code.

7. Restart dev server after changing env vars:

```bash
npm run dev
```

## Architecture references
- Product spec: `docs/product-spec.md`
- Technical architecture: `docs/architecture.md`
- MVP backlog: `docs/mvp-backlog.md`
- Supabase schema: `supabase/migrations/0001_mvp_schema.sql`
