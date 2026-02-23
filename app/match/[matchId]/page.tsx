'use client';

import { FormEvent, useEffect, useState } from 'react';
import { PostCard } from '@/components/post-card';
import { rankFeed } from '@/lib/domain';
import { useLanguage } from '@/lib/language';
import { createPostMutation, reactPostMutation, submitReportMutation, votePostMutation } from '@/lib/repositories/post-mutations';
import { getMatchById } from '@/lib/repositories/matches';
import { getPostsForMatch } from '@/lib/repositories/posts';
import { getTeams } from '@/lib/repositories/teams';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Match, Post, ReactionType, Team } from '@/lib/types';

const DEMO_USER_ID = 'demo-user-id';

export default function MatchThreadPage({ params }: { params: { matchId: string } }) {
  const { language, t } = useLanguage();
  const [match, setMatch] = useState<Match | null>(null);
  const [home, setHome] = useState<Team | null>(null);
  const [away, setAway] = useState<Team | null>(null);
  const [threadPosts, setThreadPosts] = useState<Post[]>([]);
  const [postText, setPostText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const currentMatch = await getMatchById(params.matchId);

        if (!active) {
          return;
        }

        if (!currentMatch) {
          setMatch(null);
          setHome(null);
          setAway(null);
          setThreadPosts([]);
          setError('Match not found.');
          return;
        }

        const [teams, posts] = await Promise.all([getTeams(), getPostsForMatch(currentMatch.id)]);

        if (!active) {
          return;
        }

        setMatch(currentMatch);
        setHome(teams.find((team) => team.id === currentMatch.homeTeamId) ?? null);
        setAway(teams.find((team) => team.id === currentMatch.awayTeamId) ?? null);
        setThreadPosts(rankFeed(posts));
        setError(null);
      } catch {
        if (active) {
          setError('Failed to load match thread.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [params.matchId]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase || !match) {
      return;
    }

    const channel = supabase
      .channel(`match-thread-${match.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts', filter: `match_id=eq.${match.id}` }, async () => {
        const refreshed = await getPostsForMatch(match.id);
        setThreadPosts(rankFeed(refreshed));
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [match]);

  const handleCreatePost = async (event: FormEvent) => {
    event.preventDefault();
    if (!match || !postText.trim()) return;

    const optimisticPost: Post = {
      id: `optimistic-${Date.now()}`,
      author: 'You',
      scope: 'match_thread',
      matchId: match.id,
      body: postText,
      mediaUrl: mediaUrl.trim() || undefined,
      createdAt: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0,
      reactions: {},
      hidden: false,
      reportCount: 0
    };

    const previous = threadPosts;
    setThreadPosts((current) => rankFeed([optimisticPost, ...current]));
    setPostText('');
    setMediaUrl('');

    try {
      await createPostMutation({ body: optimisticPost.body, scope: 'match_thread', matchId: match.id, mediaUrl: optimisticPost.mediaUrl, authorId: DEMO_USER_ID });
      const refreshed = await getPostsForMatch(match.id);
      setThreadPosts(rankFeed(refreshed));
    } catch {
      setThreadPosts(previous);
    }
  };

  const handleVote = async (postId: string, value: 1 | -1) => {
    const previous = threadPosts;
    setThreadPosts((current) =>
      rankFeed(
        current.map((post) =>
          post.id === postId
            ? { ...post, upvotes: value === 1 ? post.upvotes + 1 : post.upvotes, downvotes: value === -1 ? post.downvotes + 1 : post.downvotes }
            : post
        )
      )
    );

    try {
      await votePostMutation(postId, { userId: DEMO_USER_ID, value });
    } catch {
      setThreadPosts(previous);
    }
  };

  const handleReaction = async (postId: string, reaction: ReactionType) => {
    const previous = threadPosts;
    setThreadPosts((current) =>
      rankFeed(
        current.map((post) =>
          post.id === postId
            ? { ...post, reactions: { ...post.reactions, [reaction]: (post.reactions[reaction] ?? 0) + 1 } }
            : post
        )
      )
    );

    try {
      await reactPostMutation(postId, { userId: DEMO_USER_ID, reaction, action: 'add' });
    } catch {
      setThreadPosts(previous);
    }
  };

  const handleReport = async (postId: string, reason: string) => {
    if (!match) {
      return;
    }

    try {
      await submitReportMutation(postId, { reason });
      const refreshed = await getPostsForMatch(match.id);
      setThreadPosts(rankFeed(refreshed));
    } catch (e) {
      console.error('Failed to submit match-thread report', { e, postId, reporterId: DEMO_USER_ID });
      window.alert('Failed to submit report. Please try again.');
    }
  };

  return (
    <section className="space-y-4">
      {home && away ? (
        <h1 className="text-2xl font-bold">{home.name} vs {away.name} {t('battleground')}</h1>
      ) : (
        <h1 className="text-2xl font-bold">{loading ? 'Loading match...' : t('battleground')}</h1>
      )}
      {loading && <p className="card text-slate-300">Loading thread...</p>}
      {error && <p className="card text-red-300">{error}</p>}
      {match && (
        <div className="card flex flex-wrap items-center justify-between gap-2">
          <p>{t('status')}: <span className="font-semibold text-red-400">{match.status.toUpperCase()}</span></p>
          <p>{t('kickoff')}: {new Date(match.kickoffAt).toLocaleString(language === 'my' ? 'my-MM' : 'en-US')}</p>
          <p>{t('liveMode')}: {match.isLive ? t('on') : t('off')}</p>
        </div>
      )}
      <form className="card space-y-2" onSubmit={handleCreatePost}>
        <textarea className="w-full rounded bg-slate-900 p-2" value={postText} onChange={(e) => setPostText(e.target.value)} placeholder="Comment on the match..." maxLength={500} />
        <input className="w-full rounded bg-slate-900 p-2 text-sm" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="Paste meme/image URL (optional)" />
        <button type="submit" className="rounded bg-emerald-600 px-3 py-1 text-sm">Post</button>
      </form>
      {!loading && !error && threadPosts.length === 0 && <p className="card text-slate-300">No thread posts yet.</p>}
      {threadPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onVote={handleVote}
          onReaction={handleReaction}
          onReport={(postId) => {
            const reason = window.prompt('Why are you reporting this post?');
            if (!reason?.trim()) {
              return Promise.resolve();
            }

            return handleReport(postId, reason.trim());
          }}
        />
      ))}
    </section>
  );
}
