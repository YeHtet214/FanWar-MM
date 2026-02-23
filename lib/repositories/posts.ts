import { posts as fallbackPosts } from '@/lib/data';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { Post, ReactionType } from '@/lib/types';

let supabaseClient: ReturnType<typeof createBrowserSupabaseClient> | null | undefined;

type ProfileJoin = { username: string } | Array<{ username: string }> | null;

type PostRow = {
  id: string;
  scope: 'team_room' | 'match_thread';
  team_id: string | null;
  match_id: string | null;
  body: string | null;
  media_url: string | null;
  upvotes: number;
  downvotes: number;
  is_hidden: boolean;
  report_count: number;
  strike_linked_profile_id: string | null;
  created_at: string;
  profiles: ProfileJoin;
  post_reactions: Array<{
    reaction: ReactionType;
  }> | null;
};

async function getSupabaseClient() {
  if (supabaseClient !== undefined) {
    return supabaseClient;
  }

  if (typeof window === 'undefined') {
    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    supabaseClient = createServerSupabaseClient();
    return supabaseClient;
  }

  supabaseClient = createBrowserSupabaseClient();
  return supabaseClient;
}

function getUsername(profiles: ProfileJoin) {
  if (!profiles) {
    return 'Unknown';
  }

  return Array.isArray(profiles) ? profiles[0]?.username ?? 'Unknown' : profiles.username;
}

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
    author: getUsername(row.profiles),
    scope: row.scope,
    teamId: row.team_id ?? undefined,
    matchId: row.match_id ?? undefined,
    body: row.body ?? '',
    mediaUrl: row.media_url ?? undefined,
    createdAt: row.created_at,
    upvotes: row.upvotes,
    downvotes: row.downvotes,
    hidden: row.is_hidden,
    reportCount: row.report_count,
    strikeLinkedProfileId: row.strike_linked_profile_id ?? undefined,
    reactions: mapReactions(row.post_reactions)
  };
}

const postSelect = 'id, scope, team_id, match_id, body, media_url, upvotes, downvotes, is_hidden, report_count, strike_linked_profile_id, created_at, profiles:author_id(username), post_reactions(reaction)';

export async function getPosts(): Promise<Post[]> {
  const supabase = await getSupabaseClient();
  if (!supabase) {
    return fallbackPosts;
  }

  const { data, error } = await supabase.from('posts').select(postSelect).order('score', { ascending: false }).order('created_at', { ascending: false });

  if (error || !data) {
    return fallbackPosts;
  }

  return (data as PostRow[]).map(mapPost);
}

export async function getPostsForTeam(teamId: string): Promise<Post[]> {
  const supabase = await getSupabaseClient();
  if (!supabase) {
    return fallbackPosts.filter((post) => post.scope === 'team_room' && post.teamId === teamId);
  }

  const { data, error } = await supabase
    .from('posts')
    .select(postSelect)
    .eq('scope', 'team_room')
    .eq('team_id', teamId)
    .order('score', { ascending: false })
    .order('created_at', { ascending: false });

  if (error || !data) {
    return fallbackPosts.filter((post) => post.scope === 'team_room' && post.teamId === teamId);
  }

  return (data as PostRow[]).map(mapPost);
}

export async function getPostsForMatch(matchId: string): Promise<Post[]> {
  const supabase = await getSupabaseClient();
  if (!supabase) {
    return fallbackPosts.filter((post) => post.scope === 'match_thread' && post.matchId === matchId);
  }

  const { data, error } = await supabase
    .from('posts')
    .select(postSelect)
    .eq('scope', 'match_thread')
    .eq('match_id', matchId)
    .order('score', { ascending: false })
    .order('created_at', { ascending: false });

  if (error || !data) {
    return fallbackPosts.filter((post) => post.scope === 'match_thread' && post.matchId === matchId);
  }

  return (data as PostRow[]).map(mapPost);
}
