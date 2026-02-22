import { NextResponse } from 'next/server';
import { shouldAutoHide } from '@/lib/domain';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: authorId,
      scope,
      team_id: scope === 'team_room' ? teamId ?? null : null,
      match_id: scope === 'match_thread' ? matchId ?? null : null,
      body,
      is_hidden: shouldAutoHide(body),
      report_count: 0,
      strike_linked_profile_id: null
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
