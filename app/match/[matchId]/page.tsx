'use client';

import { useEffect, useState } from 'react';
import { PostCard } from '@/components/post-card';
import { rankFeed } from '@/lib/domain';
import { useLanguage } from '@/lib/language';
import { getMatchById } from '@/lib/repositories/matches';
import { getPostsForMatch } from '@/lib/repositories/posts';
import { getTeams } from '@/lib/repositories/teams';
import { Match, Post, Team } from '@/lib/types';

export default function MatchThreadPage({ params }: { params: { matchId: string } }) {
  const { language, t } = useLanguage();
  const [match, setMatch] = useState<Match | null>(null);
  const [home, setHome] = useState<Team | null>(null);
  const [away, setAway] = useState<Team | null>(null);
  const [threadPosts, setThreadPosts] = useState<Post[]>([]);
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
      {!loading && !error && threadPosts.length === 0 && <p className="card text-slate-300">No thread posts yet.</p>}
      {threadPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </section>
  );
}
