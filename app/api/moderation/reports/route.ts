import { NextResponse } from 'next/server';
import { applyStrike } from '@/lib/domain';
import { createServerSupabaseClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { isModeratorUser } from '@/lib/server/auth';

type ReviewDecision = 'confirmed' | 'dismissed';

async function requireModerator() {
  const authSupabase = await createSupabaseServerClient();
  if (!authSupabase) {
    return { error: NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 }) };
  }

  const { data: userData, error: userError } = await authSupabase.auth.getUser();
  if (userError) {
    return { error: NextResponse.json({ error: userError.message }, { status: 500 }) };
  }

  if (!userData.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (!isModeratorUser(userData.user)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { userId: userData.user.id };
}

export async function GET() {
  const auth = await requireModerator();
  if (auth.error) {
    return auth.error;
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('reports')
    .select('id, reason, status, created_at, reviewed_at, post_id, posts:post_id(id, body, author_id), reporter:reporter_id(id, username), reviewed_by')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const flagged = data.filter((item) => item.status === 'open');
  const pendingReview = data.filter((item) => item.status === 'reviewing');
  const resolved = data.filter((item) => item.status === 'resolved' || item.status === 'dismissed');

  return NextResponse.json({ flagged, pendingReview, resolved });
}

export async function POST(request: Request) {
  const auth = await requireModerator();
  if (auth.error) {
    return auth.error;
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  const reviewerId = auth.userId;
  const { reportId, decision, notes } = (await request.json()) as {
    reportId?: string;
    decision?: ReviewDecision;
    notes?: string;
  };

  if (!reportId || (decision !== 'confirmed' && decision !== 'dismissed')) {
    return NextResponse.json({ error: 'Invalid review payload' }, { status: 400 });
  }

  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('id, post_id, status, reason, reporter_id, posts:post_id(id, author_id)')
    .eq('id', reportId)
    .maybeSingle();

  if (reportError) {
    return NextResponse.json({ error: reportError.message }, { status: 500 });
  }

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  if (report.status === 'resolved' || report.status === 'dismissed') {
    return NextResponse.json({ error: 'Report has already been reviewed' }, { status: 409 });
  }

  const resolvedStatus = decision === 'confirmed' ? 'resolved' : 'dismissed';

  const { data: updatedReport, error: reportUpdateError } = await supabase
    .from('reports')
    .update({ status: resolvedStatus, reviewed_at: new Date().toISOString(), reviewed_by: reviewerId })
    .eq('id', reportId)
    .in('status', ['open', 'reviewing'])
    .select('id')
    .maybeSingle();

  if (reportUpdateError) {
    return NextResponse.json({ error: reportUpdateError.message }, { status: 500 });
  }

  if (!updatedReport) {
    return NextResponse.json({ error: 'Report has already been reviewed' }, { status: 409 });
  }

  let nextState: string | null = null;
  let strikeCount: number | null = null;

  if (decision === 'confirmed') {
    const reportPost = report.posts as { author_id?: string } | Array<{ author_id?: string }> | null;
    const authorId = Array.isArray(reportPost) ? reportPost[0]?.author_id : reportPost?.author_id;

    if (!authorId) {
      return NextResponse.json({ error: 'Unable to resolve target profile for report' }, { status: 500 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, strike_count')
      .eq('id', authorId)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    strikeCount = profile.strike_count + 1;
    nextState = applyStrike(profile.strike_count);

    const { error: processError } = await supabase.rpc('process_moderation_confirmed', {
      report_id_input: report.id,
      post_id_input: report.post_id,
      reviewer_id_input: reviewerId,
      target_profile_id_input: authorId,
      moderation_action_input: nextState,
      strike_count_after_input: strikeCount,
      notes_input: notes?.trim() || null
    });

    if (processError) {
      return NextResponse.json({ error: processError.message }, { status: 500 });
    }
  } else {
    const { error: insertError } = await supabase.from('moderation_reviews').insert({
      report_id: report.id,
      post_id: report.post_id,
      reviewer_id: reviewerId,
      target_profile_id: null,
      decision,
      moderation_action: 'none',
      strike_count_after: null,
      notes: notes?.trim() || null
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, decision, moderationState: nextState, strikeCount });
}
