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

## Architecture references
- Product spec: `docs/product-spec.md`
- Technical architecture: `docs/architecture.md`
- MVP backlog: `docs/mvp-backlog.md`
- Supabase schema: `supabase/migrations/0001_mvp_schema.sql`
