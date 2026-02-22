export type Team = {
  id: string;
  name: string;
  shortCode: string;
  crest: string;
};

export type Match = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  kickoffAt: string;
  status: 'scheduled' | 'live' | 'finished';
  isLive: boolean;
};

export type PostScope = 'team_room' | 'match_thread';

export type ReactionType = 'clown' | 'fire' | 'bottle' | 'salty' | 'laugh';

export type Post = {
  id: string;
  author: string;
  teamId?: string;
  matchId?: string;
  scope: PostScope;
  body: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  reactions: Partial<Record<ReactionType, number>>;
  hidden: boolean;
  reportCount: number;
  strikeLinkedProfileId?: string;
};

export type UserProfile = {
  id: string;
  username: string;
  primaryTeamId: string;
  reputationTotal: number;
  strikeCount: number;
  rank: string;
};

export type ReputationLog = {
  id: string;
  userId: string;
  eventType: string;
  points: number;
  createdAt: string;
};

export type MemeTemplate = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  textSlots: string[];
};
