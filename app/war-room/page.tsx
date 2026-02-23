'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { PostCard } from '@/components/post-card';
import { rankFeed } from '@/lib/domain';
import { useAsyncData } from '@/lib/hooks/use-async-data';
import { useLanguage } from '@/lib/language';
import { reactPostMutation, votePostMutation, createPostMutation, submitReportMutation } from '@/lib/repositories/post-mutations';
import { getPostsForTeam } from '@/lib/repositories/posts';
import { getTeams } from '@/lib/repositories/teams';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Post, ReactionType, Team } from '@/lib/types';

const DEFAULT_TEAM_ID = 'arsenal';
const DEMO_USER_ID = 'demo-user-id';

export default function WarRoomPage() {
  const { t } = useLanguage();
  const [postText, setPostText] = useState('');
  const [postsState, setPostsState] = useState<Post[]>([]);
  const { data, loading, error } = useAsyncData<[Team[], Post[]]>(
    async () => Promise.all([getTeams(), getPostsForTeam(DEFAULT_TEAM_ID)]),
    []
  );

  useEffect(() => {
    if (data?.[1]) {
      setPostsState(rankFeed(data[1]));
    }
  }, [data]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel(`war-room-${DEFAULT_TEAM_ID}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts', filter: `team_id=eq.${DEFAULT_TEAM_ID}` }, async () => {
        const refreshed = await getPostsForTeam(DEFAULT_TEAM_ID);
        setPostsState(rankFeed(refreshed));
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const team = useMemo(() => data?.[0].find((item) => item.id === DEFAULT_TEAM_ID) ?? null, [data]);
  const teamPosts = useMemo(() => rankFeed(postsState), [postsState]);

  const handleCreatePost = async (event: FormEvent) => {
    event.preventDefault();
    if (!postText.trim()) return;

    const optimisticPost: Post = {
      id: `optimistic-${Date.now()}`,
      author: 'You',
      scope: 'team_room',
      teamId: DEFAULT_TEAM_ID,
      body: postText,
      createdAt: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0,
      reactions: {},
      hidden: false,
      reportCount: 0
    };

    const previous = postsState;
    setPostsState((current) => rankFeed([optimisticPost, ...current]));
    setPostText('');

    try {
      await createPostMutation({ body: optimisticPost.body, scope: 'team_room', teamId: DEFAULT_TEAM_ID, authorId: DEMO_USER_ID });
      const refreshed = await getPostsForTeam(DEFAULT_TEAM_ID);
      setPostsState(rankFeed(refreshed));
    } catch {
      setPostsState(previous);
    }
  };

  const handleVote = async (postId: string, value: 1 | -1) => {
    const previous = postsState;
    setPostsState((current) =>
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
      setPostsState(previous);
    }
  };

  const handleReaction = async (postId: string, reaction: ReactionType) => {
    const previous = postsState;
    setPostsState((current) =>
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
      setPostsState(previous);
    }
  };

  const handleReport = async (postId: string) => {
    const reason = window.prompt('Why are you reporting this post?');
    if (!reason?.trim()) {
      return;
    }

    try {
      await submitReportMutation(postId, { reason: reason.trim() });
      const refreshed = await getPostsForTeam(DEFAULT_TEAM_ID);
      setPostsState(rankFeed(refreshed));
    } catch (error) {
      console.error('Failed to submit report', { error, postId, reporterId: DEMO_USER_ID });
      window.alert('Failed to submit report. Please try again.');
    }
  };

  return (
    <section className="space-y-4">
      {team ? (
        <h1 className="text-2xl font-bold">{team.crest} {team.name} {t('navWarRoom')}</h1>
      ) : (
        <h1 className="text-2xl font-bold">{loading ? 'Loading war room...' : t('navWarRoom')}</h1>
      )}
      <p className="text-slate-300">{t('warRoomFeed')}</p>
      <form className="card space-y-2" onSubmit={handleCreatePost}>
        <textarea className="w-full rounded bg-slate-900 p-2" value={postText} onChange={(e) => setPostText(e.target.value)} placeholder="Drop your banter..." />
        <button type="submit" className="rounded bg-emerald-600 px-3 py-1 text-sm">Post</button>
      </form>
      {loading && <p className="card text-slate-300">Loading posts...</p>}
      {error && <p className="card text-red-300">Failed to load war room data.</p>}
      {!loading && !error && teamPosts.length === 0 && <p className="card text-slate-300">No posts yet.</p>}
      <div className="space-y-3">
        {teamPosts.map((post) => (
          <PostCard key={post.id} post={post} onVote={handleVote} onReaction={handleReaction} onReport={handleReport} />
        ))}
      </div>
    </section>
  );
}
