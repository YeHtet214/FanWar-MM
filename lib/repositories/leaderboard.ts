import { UserProfile } from '@/lib/types';
import { leaderboard as fallbackLeaderboard } from '@/lib/data';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

type LeaderboardRow = {
  user_id: string;
  rank: number | null;
  points: number;
  profiles: Array<{
    username: string;
    primary_team_id: string;
    strike_count: number;
  }> | null;
};

function mapRow(row: LeaderboardRow): UserProfile {
  return {
    id: row.user_id,
    username: row.profiles?.[0]?.username ?? 'Unknown',
    primaryTeamId: row.profiles?.[0]?.primary_team_id ?? '',
    reputationTotal: row.points,
    strikeCount: row.profiles?.[0]?.strike_count ?? 0,
    rank: row.rank ? `#${row.rank}` : 'Unranked'
  };
}

export async function getLeaderboard(): Promise<UserProfile[]> {
  const supabase = createBrowserSupabaseClient();
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

  return data.map((row) => mapRow(row as LeaderboardRow));
}
