import { PostScope, ReactionType } from '@/lib/types';

export async function createPostMutation(input: {
  body: string;
  scope: PostScope;
  teamId?: string;
  matchId?: string;
  authorId: string;
  mediaUrl?: string;
}) {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error('Unable to create post');
  }

  return response.json();
}

export async function votePostMutation(postId: string, input: { userId: string; value: 1 | -1 }) {
  const response = await fetch(`/api/posts/${postId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error('Unable to update vote');
  }

  return response.json();
}

export async function reactPostMutation(postId: string, input: { userId: string; reaction: ReactionType; action: 'add' | 'remove' }) {
  const response = await fetch(`/api/posts/${postId}/reaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error('Unable to update reaction');
  }

  return response.json();
}

export async function submitReportMutation(postId: string, input: { reason: string }) {
  const response = await fetch(`/api/posts/${postId}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error('Unable to submit report');
  }

  return response.json();
}

export async function reviewReportMutation(input: {
  reportId: string;
  decision: 'confirmed' | 'dismissed';
  notes?: string;
}) {
  const response = await fetch('/api/moderation/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error('Unable to review report');
  }

  return response.json();
}
