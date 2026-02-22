import { Post, ReactionType } from '@/lib/types';
import { posts as fallbackPosts } from '@/lib/data';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

type PostRow = {
  id: string;
  scope: 'team_room' | 'match_thread';
  team_id: string | null;
  match_id: string | null;
  body: string | null;
  upvotes: number;
  downvotes: number;
  is_hidden: boolean;
  created_at: string;
  profiles: Array<{
    username: string;
  }> | null;
  post_reactions: Array<{
    reaction: ReactionType;
  }> | null;
};

function mapReactions(rows: PostRow['post_reactions']) {
  if (!rows) {
    return {};
  }

  return rows.reduce<Partial<Record<ReactionType, number>>>((acc, item) => {
    acc[item.reaction] = (acc[item.reaction] ?? 0) + 1;
    return acc;
  }, {});
}

function mapPost(row: PostRow): Post {
  return {
    id: row.id,
    author: row.profiles?.[0]?.username ?? 'Unknown',
    scope: row.scope,
    teamId: row.team_id ?? undefined,
    matchId: row.match_id ?? undefined,
    body: row.body ?? '',
    createdAt: row.created_at,
    upvotes: row.upvotes,
    downvotes: row.downvotes,
    hidden: row.is_hidden,
    reactions: mapReactions(row.post_reactions)
  };
}

export async function getPosts(): Promise<Post[]> {
  const supabase = createBrowserSupabaseClient();
  if (!supabase) {
    return fallbackPosts;
  }

  const { data, error } = await supabase
    .from('posts')
    .select('id, scope, team_id, match_id, body, upvotes, downvotes, is_hidden, created_at, profiles:author_id(username), post_reactions(reaction)')
    .order('created_at', { ascending: false });

  if (error || !data) {
    return fallbackPosts;
  }

  return data.map((row) => mapPost(row as PostRow));
}

export async function getPostsForTeam(teamId: string) {
  const all = await getPosts();
  return all.filter((post) => post.scope === 'team_room' && post.teamId === teamId);
}

export async function getPostsForMatch(matchId: string) {
  const all = await getPosts();
  return all.filter((post) => post.scope === 'match_thread' && post.matchId === matchId);
}
