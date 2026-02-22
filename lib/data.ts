// Seed/dev fallback data used when Supabase env vars are not configured.
import { Match, MemeTemplate, Post, Team, UserProfile } from '@/lib/types';

export const teams: Team[] = [
  { id: 'arsenal', name: 'Arsenal', shortCode: 'ARS', crest: '🔴' },
  { id: 'chelsea', name: 'Chelsea', shortCode: 'CHE', crest: '🔵' },
  { id: 'liverpool', name: 'Liverpool', shortCode: 'LIV', crest: '🟥' },
  { id: 'manutd', name: 'Manchester United', shortCode: 'MUN', crest: '🔴' },
  { id: 'mancity', name: 'Manchester City', shortCode: 'MCI', crest: '🔷' }
];

export const matches: Match[] = [
  {
    id: 'm1',
    homeTeamId: 'arsenal',
    awayTeamId: 'chelsea',
    kickoffAt: '2026-02-21T15:00:00Z',
    status: 'live',
    isLive: true
  },
  {
    id: 'm2',
    homeTeamId: 'liverpool',
    awayTeamId: 'manutd',
    kickoffAt: '2026-02-22T18:30:00Z',
    status: 'scheduled',
    isLive: false
  }
];

export const posts: Post[] = [
  {
    id: 'p1',
    author: 'KoAung',
    teamId: 'arsenal',
    scope: 'team_room',
    body: 'Saka will cook tonight. North London energy!',
    createdAt: '2026-02-21T12:10:00Z',
    upvotes: 21,
    downvotes: 2,
    reactions: { fire: 8, laugh: 2 },
    hidden: false
  },
  {
    id: 'p2',
    author: 'Nandar',
    matchId: 'm1',
    scope: 'match_thread',
    body: 'Chelsea midfield is missing again 😅',
    createdAt: '2026-02-21T15:12:00Z',
    upvotes: 8,
    downvotes: 5,
    reactions: { clown: 3, salty: 4 },
    hidden: false
  }
];

export const leaderboard: UserProfile[] = [
  { id: 'u1', username: 'KoAung', primaryTeamId: 'arsenal', reputationTotal: 760, strikeCount: 0, rank: 'Captain' },
  { id: 'u2', username: 'MoeMoe', primaryTeamId: 'chelsea', reputationTotal: 930, strikeCount: 0, rank: 'Legend' },
  { id: 'u3', username: 'TeeZin', primaryTeamId: 'manutd', reputationTotal: 1200, strikeCount: 1, rank: 'King of Troll' }
];

export const memeTemplates: MemeTemplate[] = [
  { id: 't1', name: 'Late Winner Shock', slug: 'late-winner', imageUrl: '/templates/late-winner.svg', textSlots: ['Top text', 'Bottom text'] },
  { id: 't2', name: 'Manager Rage', slug: 'manager-rage', imageUrl: '/templates/manager-rage.svg', textSlots: ['Caption'] },
  { id: 't3', name: 'Bottle Job Alert', slug: 'bottle-job', imageUrl: '/templates/bottle-job.svg', textSlots: ['Team', 'Scoreline'] },
  { id: 't4', name: 'Derby Day Fire', slug: 'derby-fire', imageUrl: '/templates/derby-fire.svg', textSlots: ['Derby title'] },
  { id: 't5', name: 'VAR Drama', slug: 'var-drama', imageUrl: '/templates/var-drama.svg', textSlots: ['Hot take'] }
];
