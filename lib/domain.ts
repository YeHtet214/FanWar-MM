import { Post, ReactionType } from '@/lib/types';

const blockedKeywords = ['racist', 'threat', 'violence', 'political propaganda'];

export function calculateScore(post: Post) {
  return post.upvotes - post.downvotes;
}

export function rankFeed(posts: Post[]) {
  return [...posts].sort((a, b) => {
    const scoreDiff = calculateScore(b) - calculateScore(a);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function reactionSummary(reactions: Partial<Record<ReactionType, number>>) {
  return Object.entries(reactions)
    .map(([key, value]) => `${key} ${value}`)
    .join(' · ');
}

export function shouldAutoHide(text: string) {
  const normalized = text.toLowerCase();
  return blockedKeywords.some((word) => normalized.includes(word));
}

export function applyStrike(currentStrikes: number) {
  if (currentStrikes >= 2) {
    return 'banned';
  }
  if (currentStrikes === 1) {
    return 'suspended';
  }
  return 'muted';
}

export function reputationPoints(eventType: string) {
  switch (eventType) {
    case 'post_created':
      return 5;
    case 'post_upvoted':
      return 2;
    case 'reaction_received':
      return 1;
    case 'report_confirmed':
      return -20;
    default:
      return 0;
  }
}
