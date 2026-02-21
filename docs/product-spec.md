# FanWar MM — Product Specification (MVP)

## 1) Product Positioning
FanWar MM is a web-first EPL rivalry community for Myanmar fans. It is **not** a news portal or streaming app. The core loop is identity-based competition: join a club, defend it, troll rivals, and climb leaderboard ranks.

## 2) Target Audience
- Myanmar EPL fans, ages 16–35
- High engagement in Facebook/Telegram football banter
- Strong single-club identity and rivalry behavior

## 3) MVP Goals
- Team identity onboarding
- Team war rooms
- Match battleground threads
- Reactions + upvote/downvote
- Reputation + weekly leaderboards
- Minimal meme generator (5 templates)
- Moderation + report flow + strikes

## 4) Core User Flows
1. Sign up / log in
2. Select primary EPL club (locked by policy)
3. Enter team war room
4. Post text/image, react, discuss
5. Join match thread (public vs rival fans)
6. Earn reputation and climb ranks
7. Generate/share memes

## 5) Functional Requirements
### Authentication & Identity
- Email or mobile-number login via Supabase Auth (OTP/passwordless supported)
- Optional social login via Supabase Auth providers
- Mandatory team selection on first login
- Team change restricted (admin-only workflow)

### Team War Rooms
- Team-only feed
- Text + image posts
- Reactions and vote score
- Internal weekly leaderboard
- Real-time updates

### Match Threads
- Auto-created per EPL fixture
- Public between the two participating fanbases
- Live metadata: kickoff, status, home/away
- Live Mode for in-play matches
- Optional system events (e.g., goal)

### Interaction Model
- Football reaction types: `clown`, `fire`, `bottle`, `salty`, `laugh`
- Upvote/downvote on posts/comments
- Ranking by score + recency for live contexts

### Reputation & Ranks
- Event-driven reputation ledger
- Weekly reset leaderboard, lifetime points persist
- Initial rank ladder:
  - New Fan
  - Bench Player
  - First Team
  - Captain
  - Legend
  - King of Troll

### Meme Generator (MVP)
- Choose match + target rival + template
- Dynamic text injection into static templates
- Watermark generated image with FanWar MM mark
- At least 5 template presets

### Moderation
- Keyword filter (racism/threat/political)
- Auto-hide flagged content pending review
- User report mechanism
- Three-strike penalty ladder:
  1) mute
  2) temporary suspension
  3) permanent ban

## 6) Non-Functional Requirements
- Mobile-first responsive UX
- Dark theme default
- Realtime scalability for match spikes
- Low-latency updates during Live Mode

## 7) Success Metrics
- Comments per match thread
- Matchday DAU
- Weekly retention
- Meme shares per match
- Leaderboard participation rate

## 8) Explicitly Out of MVP Scope
- AI meme generation
- Predictive analytics
- Native iOS/Android apps
- Fantasy/prediction tournaments
