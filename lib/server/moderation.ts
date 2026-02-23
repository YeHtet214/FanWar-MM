import { SupabaseClient } from '@supabase/supabase-js';
import { ModerationState } from '@/lib/types';

type ModerationProfile = {
  id: string;
  strike_count: number;
  moderation_state: ModerationState;
};

function isModerationState(value: unknown): value is ModerationState {
  return value === 'none' || value === 'muted' || value === 'suspended' || value === 'banned';
}

function parseModerationProfile(data: unknown): ModerationProfile | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const candidate = data as Record<string, unknown>;
  if (typeof candidate.id !== 'string') {
    return null;
  }

  if (typeof candidate.strike_count !== 'number') {
    return null;
  }

  if (!isModerationState(candidate.moderation_state)) {
    return null;
  }

  return {
    id: candidate.id,
    strike_count: candidate.strike_count,
    moderation_state: candidate.moderation_state
  };
}

export async function getProfileModerationState(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, strike_count, moderation_state')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return parseModerationProfile(data);
}

export function isPostingBlocked(state: ModerationState) {
  return state === 'suspended' || state === 'banned';
}
