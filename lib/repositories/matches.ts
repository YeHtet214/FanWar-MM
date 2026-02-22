import { Match } from '@/lib/types';
import { matches as fallbackMatches } from '@/lib/data';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

type MatchRow = {
  id: string;
  home_team_id: string;
  away_team_id: string;
  kickoff_at: string;
  status: 'scheduled' | 'live' | 'finished';
  is_live: boolean;
};

function mapMatch(row: MatchRow): Match {
  return {
    id: row.id,
    homeTeamId: row.home_team_id,
    awayTeamId: row.away_team_id,
    kickoffAt: row.kickoff_at,
    status: row.status,
    isLive: row.is_live
  };
}

export async function getMatches(): Promise<Match[]> {
  const supabase = createBrowserSupabaseClient();
  if (!supabase) {
    return fallbackMatches;
  }

  const { data, error } = await supabase
    .from('matches')
    .select('id, home_team_id, away_team_id, kickoff_at, status, is_live')
    .order('kickoff_at', { ascending: false });

  if (error || !data) {
    return fallbackMatches;
  }

  return data.map(mapMatch);
}

export async function getMatchById(matchId: string): Promise<Match | null> {
  const all = await getMatches();
  return all.find((match) => match.id === matchId) ?? all[0] ?? null;
}
