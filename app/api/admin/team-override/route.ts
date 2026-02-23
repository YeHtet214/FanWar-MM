import { NextResponse } from 'next/server';
import { isAdminUser } from '@/lib/server/auth';
import { createServerSupabaseClient, createSupabaseServerClient } from '@/lib/supabase/server';

type TeamOverridePayload = {
  targetUserId?: string;
  teamId?: string;
};

export async function POST(request: Request) {
  const authSupabase = await createSupabaseServerClient();
  if (!authSupabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  const { data: userData, error: userError } = await authSupabase.auth.getUser();
  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  if (!userData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isAdminUser(userData.user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json()) as TeamOverridePayload;
  const targetUserId = body.targetUserId?.trim();
  const teamId = body.teamId?.trim();

  if (!targetUserId || !teamId) {
    return NextResponse.json({ error: 'targetUserId and teamId are required' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  const { data: updatedRows, error: updateError } = await supabase
    .from('profiles')
    .update({ primary_team_id: teamId })
    .eq('id', targetUserId)
    .select('id');

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (!updatedRows || updatedRows.length === 0) {
    return NextResponse.json({ error: 'No user found or no rows updated for that user id.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
