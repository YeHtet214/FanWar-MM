import { NextResponse } from 'next/server';
import { shouldAutoHide } from '@/lib/domain';
import { createServerSupabaseClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { getProfileModerationState, isPostingBlocked } from '@/lib/server/moderation';
import { checkRateLimit } from '@/lib/server/rate-limit';

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const authSupabase = await createSupabaseServerClient();
  if (!supabase || !authSupabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  const { data: userData, error: userError } = await authSupabase.auth.getUser();
  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  if (!userData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await request.json();
  const { body, scope, teamId, matchId, autoHidden, mediaUrl } = payload as {
    body?: string;
    scope?: 'team_room' | 'match_thread';
    teamId?: string;
    matchId?: string;
    autoHidden?: boolean;
    mediaUrl?: string;
  };

  if (!scope || (!body && !mediaUrl)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const authorId = userData.user.id;

  const trimmedBody = body?.trim() ?? '';
  if (trimmedBody.length > 500) {
    return NextResponse.json({ error: 'Post text is too long (max 500 chars)' }, { status: 400 });
  }

  const limiter = checkRateLimit(`post:${authorId}`, 6, 60_000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: 'Too many posts, please slow down' }, { status: 429 });
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

  const serverHidden = shouldAutoHide(trimmedBody);
  const hiddenByKeyword = serverHidden || Boolean(autoHidden);

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: authorId,
      scope,
      team_id: scope === 'team_room' ? teamId ?? null : null,
      match_id: scope === 'match_thread' ? matchId ?? null : null,
      body: trimmedBody || null,
      media_url: mediaUrl ?? null,
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
