'use client';

import { useMemo } from 'react';
import { PostCard } from '@/components/post-card';
import { rankFeed } from '@/lib/domain';
import { useAsyncData } from '@/lib/hooks/use-async-data';
import { useLanguage } from '@/lib/language';
import { getPostsForTeam } from '@/lib/repositories/posts';
import { getTeams } from '@/lib/repositories/teams';
import { Post, Team } from '@/lib/types';

const DEFAULT_TEAM_ID = 'arsenal'; // TODO: replace with authenticated user's selected team from user context (e.g., useUser()/session).

export default function WarRoomPage() {
  const { t } = useLanguage();
  const { data, loading, error } = useAsyncData<[Team[], Post[]]>(
    async () => Promise.all([getTeams(), getPostsForTeam(DEFAULT_TEAM_ID)]),
    []
  );

  const team = useMemo(() => data?.[0].find((item) => item.id === DEFAULT_TEAM_ID) ?? null, [data]);
  const teamPosts = useMemo(() => rankFeed(data?.[1] ?? []), [data]);

  return (
    <section className="space-y-4">
      {team ? (
        <h1 className="text-2xl font-bold">{team.crest} {team.name} {t('navWarRoom')}</h1>
      ) : (
        <h1 className="text-2xl font-bold">{loading ? 'Loading war room...' : t('navWarRoom')}</h1>
      )}
      <p className="text-slate-300">{t('warRoomFeed')}</p>
      {loading && <p className="card text-slate-300">Loading posts...</p>}
      {error && <p className="card text-red-300">Failed to load war room data.</p>}
      {!loading && !error && teamPosts.length === 0 && <p className="card text-slate-300">No posts yet.</p>}
      <div className="space-y-3">
        {teamPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
