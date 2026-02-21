'use client';

import { PostCard } from '@/components/post-card';
import { posts, teams } from '@/lib/data';
import { rankFeed } from '@/lib/domain';
import { useLanguage } from '@/lib/language';

export default function WarRoomPage() {
  const { t } = useLanguage();
  const arsenal = teams.find((team) => team.id === 'arsenal');
  const teamPosts = rankFeed(posts.filter((post) => post.scope === 'team_room' && post.teamId === 'arsenal'));

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{arsenal?.crest} {arsenal?.name} {t('navWarRoom')}</h1>
      <p className="text-slate-300">{t('warRoomFeed')}</p>
      <div className="space-y-3">
        {teamPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
