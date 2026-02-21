import { PostCard } from '@/components/post-card';
import { posts, teams } from '@/lib/data';
import { rankFeed } from '@/lib/domain';

export default function WarRoomPage() {
  const arsenal = teams.find((team) => team.id === 'arsenal');
  const teamPosts = rankFeed(posts.filter((post) => post.scope === 'team_room' && post.teamId === 'arsenal'));

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{arsenal?.crest} {arsenal?.name} War Room</h1>
      <p className="text-slate-300">Team-only feed with votes + football reactions. Sorted by score then recency.</p>
      <div className="space-y-3">
        {teamPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
