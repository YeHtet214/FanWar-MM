'use client';

import { useEffect, useState } from 'react';
import { PostCard } from '@/components/post-card';
import { rankFeed } from '@/lib/domain';
import { useLanguage } from '@/lib/language';
import { getPostsForTeam } from '@/lib/repositories/posts';
import { getTeams } from '@/lib/repositories/teams';
import { Post, Team } from '@/lib/types';

const DEFAULT_TEAM_ID = 'arsenal';

export default function WarRoomPage() {
  const { t } = useLanguage();
  const [team, setTeam] = useState<Team | null>(null);
  const [teamPosts, setTeamPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const [teams, posts] = await Promise.all([getTeams(), getPostsForTeam(DEFAULT_TEAM_ID)]);

        if (!active) {
          return;
        }

        setTeam(teams.find((item) => item.id === DEFAULT_TEAM_ID) ?? null);
        setTeamPosts(rankFeed(posts));
        setError(null);
      } catch {
        if (active) {
          setError('Failed to load war room data.');
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
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{team?.crest} {team?.name} {t('navWarRoom')}</h1>
      <p className="text-slate-300">{t('warRoomFeed')}</p>
      {loading && <p className="card text-slate-300">Loading posts...</p>}
      {error && <p className="card text-red-300">{error}</p>}
      {!loading && !error && teamPosts.length === 0 && <p className="card text-slate-300">No posts yet.</p>}
      <div className="space-y-3">
        {teamPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
