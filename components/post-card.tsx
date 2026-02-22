'use client';

import { reactionSummary, calculateScore } from '@/lib/domain';
import { Post, ReactionType } from '@/lib/types';
import { useLanguage } from '@/lib/language';

const reactionButtons: ReactionType[] = ['fire', 'laugh', 'clown'];

type PostCardProps = {
  post: Post;
  onVote?: (postId: string, value: 1 | -1) => void;
  onReaction?: (postId: string, reaction: ReactionType) => void;
  onReport?: (postId: string) => void;
};

export function PostCard({ post, onVote, onReaction, onReport }: PostCardProps) {
  const { language, t } = useLanguage();

  return (
    <article className="card space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{post.author}</p>
        <p className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleString(language === 'my' ? 'my-MM' : 'en-US')}</p>
      </div>
      <p>{post.body}</p>
      <div className="text-sm text-slate-300">{t('score')}: {calculateScore(post)} ({post.upvotes}↑ {post.downvotes}↓)</div>
      <div className="flex flex-wrap gap-2">
        <button className="rounded bg-slate-700 px-2 py-1 text-xs" onClick={() => onVote?.(post.id, 1)}>Upvote</button>
        <button className="rounded bg-slate-700 px-2 py-1 text-xs" onClick={() => onVote?.(post.id, -1)}>Downvote</button>
        {reactionButtons.map((reaction) => (
          <button key={reaction} className="rounded bg-slate-700 px-2 py-1 text-xs" onClick={() => onReaction?.(post.id, reaction)}>
            {reaction}
          </button>
        ))}
        <button className="rounded bg-red-900/60 px-2 py-1 text-xs" onClick={() => onReport?.(post.id)}>Report</button>
      </div>
      <div className="text-xs text-slate-400">{reactionSummary(post.reactions) || t('noReactionsYet')}</div>
    </article>
  );
}
