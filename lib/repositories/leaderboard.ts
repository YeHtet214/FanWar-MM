import { leaderboard as fallbackLeaderboard } from '@/lib/data';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { UserProfile } from '@/lib/types';

let supabaseClient: ReturnType<typeof createBrowserSupabaseClient> | null | undefined;

type LeaderboardRow = {
  user_id: string;
  rank: number | null;
  points: number;
  profiles: {
    username: string;
    primary_team_id: string;
    strike_count: number;
  } | null;
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

function normalizeProfile(profile: LeaderboardRow['profiles'] | LeaderboardRow['profiles'][] | undefined) {
  return Array.isArray(profile) ? profile[0] ?? null : profile ?? null;
}

function mapRow(row: Omit<LeaderboardRow, 'profiles'> & { profiles: LeaderboardRow['profiles'] | LeaderboardRow['profiles'][] }): UserProfile {
  const profile = normalizeProfile(row.profiles);

  return {
    id: row.user_id,
    username: profile?.username ?? 'Unknown',
    primaryTeamId: profile?.primary_team_id ?? '',
    reputationTotal: row.points,
    strikeCount: profile?.strike_count ?? 0,
    rank: row.rank ? `#${row.rank}` : 'Unranked'
  };
}

export async function getLeaderboard(): Promise<UserProfile[]> {
  const supabase = await getSupabaseClient();
  if (!supabase) {
    return fallbackLeaderboard;
  }

  const { data, error } = await supabase
    .from('weekly_leaderboard')
    .select('user_id, rank, points, profiles:user_id(username, primary_team_id, strike_count)')
    .order('points', { ascending: false });

  if (error || !data) {
    return fallbackLeaderboard;
  }

  return data.map((row) => mapRow(row as Omit<LeaderboardRow, 'profiles'> & { profiles: LeaderboardRow['profiles'] | LeaderboardRow['profiles'][] }));
}
