import { teams as fallbackTeams } from '@/lib/data';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { Team } from '@/lib/types';

type TeamRow = {
  id: string;
  name: string;
  short_code: string;
  crest_url: string | null;
};

let browserSupabaseClient: ReturnType<typeof createBrowserSupabaseClient> | undefined;

async function getSupabaseClient() {
  if (typeof window === 'undefined') {
    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    return createServerSupabaseClient();
  }

  if (browserSupabaseClient === undefined) {
    browserSupabaseClient = createBrowserSupabaseClient();
  }

  return browserSupabaseClient;
}

function mapTeam(row: TeamRow): Team {
  return {
    id: row.id,
    name: row.name,
    shortCode: row.short_code,
    crest: row.crest_url ?? '⚽'
  };
}

export async function getTeams(): Promise<Team[]> {
  const supabase = await getSupabaseClient();
  if (!supabase) {
    return fallbackTeams;
  }

  const { data, error } = await supabase.from('teams').select('id, name, short_code, crest_url').order('name');
  if (error || !data || data.length === 0) {
    return fallbackTeams;
  }

  return (data as TeamRow[]).map(mapTeam);
}
