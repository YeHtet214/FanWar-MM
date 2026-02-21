'use client';

import { reactionSummary, calculateScore } from '@/lib/domain';
import { Post } from '@/lib/types';
import { useLanguage } from '@/lib/language';

export function PostCard({ post }: { post: Post }) {
  const { language, t } = useLanguage();

  return (
    <article className="card space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{post.author}</p>
        <p className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleString(language === 'my' ? 'my-MM' : 'en-US')}</p>
      </div>
      <p>{post.body}</p>
      <div className="text-sm text-slate-300">{t('score')}: {calculateScore(post)} ({post.upvotes}↑ {post.downvotes}↓)</div>
      <div className="text-xs text-slate-400">{reactionSummary(post.reactions) || t('noReactionsYet')}</div>
    </article>
  );
}
