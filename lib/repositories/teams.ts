import { Team } from '@/lib/types';
import { teams as fallbackTeams } from '@/lib/data';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

type TeamRow = {
  id: string;
  name: string;
  short_code: string;
  crest_url: string | null;
};

function mapTeam(row: TeamRow): Team {
  return {
    id: row.id,
    name: row.name,
    shortCode: row.short_code,
    crest: row.crest_url ?? '⚽'
  };
}

export async function getTeams(): Promise<Team[]> {
  const supabase = createBrowserSupabaseClient();
  if (!supabase) {
    return fallbackTeams;
  }

  const { data, error } = await supabase.from('teams').select('id, name, short_code, crest_url').order('name');
  if (error || !data) {
    return fallbackTeams;
  }

  return data.map(mapTeam);
}
