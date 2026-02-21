import { PostCard } from '@/components/post-card';
import { matches, posts, teams } from '@/lib/data';
import { rankFeed } from '@/lib/domain';

export default function MatchThreadPage({ params }: { params: { matchId: string } }) {
  const match = matches.find((item) => item.id === params.matchId) ?? matches[0];
  const home = teams.find((team) => team.id === match.homeTeamId);
  const away = teams.find((team) => team.id === match.awayTeamId);
  const threadPosts = rankFeed(posts.filter((post) => post.scope === 'match_thread' && post.matchId === match.id));

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{home?.name} vs {away?.name} Battleground</h1>
      <div className="card flex flex-wrap items-center justify-between gap-2">
        <p>Status: <span className="font-semibold text-red-400">{match.status.toUpperCase()}</span></p>
        <p>Kickoff: {new Date(match.kickoffAt).toLocaleString()}</p>
        <p>Live Mode: {match.isLive ? 'ON' : 'OFF'}</p>
      </div>
      {threadPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </section>
  );
}
