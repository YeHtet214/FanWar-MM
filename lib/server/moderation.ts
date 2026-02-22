import { SupabaseClient } from '@supabase/supabase-js';

export type ModerationState = 'none' | 'muted' | 'suspended' | 'banned';

export async function getProfileModerationState(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, strike_count, moderation_state')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as { id: string; strike_count: number; moderation_state: ModerationState } | null;
}

export function isPostingBlocked(state: ModerationState) {
  return state === 'suspended' || state === 'banned';
}

