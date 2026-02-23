import { NextResponse } from 'next/server';
import { shouldAutoHide } from '@/lib/domain';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getProfileModerationState, isPostingBlocked } from '@/lib/server/moderation';

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  const payload = await request.json();
  const { body, scope, teamId, matchId, authorId } = payload as {
    body?: string;
    scope?: 'team_room' | 'match_thread';
    teamId?: string;
    matchId?: string;
    authorId?: string;
  };

  if (!body || !scope || !authorId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const profile = await getProfileModerationState(supabase, authorId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (isPostingBlocked(profile.moderation_state)) {
      return NextResponse.json({ error: 'Account is restricted from posting' }, { status: 403 });
    }
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }

  const hiddenByKeyword = shouldAutoHide(body);

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: authorId,
      scope,
      team_id: scope === 'team_room' ? teamId ?? null : null,
      match_id: scope === 'match_thread' ? matchId ?? null : null,
      body,
      is_hidden: hiddenByKeyword,
      hidden_reason: hiddenByKeyword ? 'keyword_filter' : null,
      report_count: 0,
      strike_linked_profile_id: null
    })
    .select('id, is_hidden')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, hidden: data.is_hidden });
}
