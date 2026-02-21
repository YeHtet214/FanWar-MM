import { reactionSummary, calculateScore } from '@/lib/domain';
import { Post } from '@/lib/types';

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="card space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{post.author}</p>
        <p className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleString()}</p>
      </div>
      <p>{post.body}</p>
      <div className="text-sm text-slate-300">Score: {calculateScore(post)} ({post.upvotes}↑ {post.downvotes}↓)</div>
      <div className="text-xs text-slate-400">{reactionSummary(post.reactions) || 'No reactions yet'}</div>
    </article>
  );
}
