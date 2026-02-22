import { NextResponse } from 'next/server';
import { applyStrike } from '@/lib/domain';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type ReviewDecision = 'confirmed' | 'dismissed';

export async function GET() {
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
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  const { reportId, reviewerId, decision, notes } = (await request.json()) as {
    reportId?: string;
    reviewerId?: string;
    decision?: ReviewDecision;
    notes?: string;
  };

  if (!reportId || !reviewerId || (decision !== 'confirmed' && decision !== 'dismissed')) {
    return NextResponse.json({ error: 'Invalid review payload' }, { status: 400 });
  }

  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('id, post_id, status, reason, reporter_id, posts:post_id(id, author_id)')
    .eq('id', reportId)
    .maybeSingle();

  if (reportError || !report) {
    return NextResponse.json({ error: reportError?.message ?? 'Report not found' }, { status: 404 });
  }

  const resolvedStatus = decision === 'confirmed' ? 'resolved' : 'dismissed';

  const { error: reportUpdateError } = await supabase
    .from('reports')
    .update({ status: resolvedStatus, reviewed_at: new Date().toISOString(), reviewed_by: reviewerId })
    .eq('id', reportId);

  if (reportUpdateError) {
    return NextResponse.json({ error: reportUpdateError.message }, { status: 500 });
  }

  let nextState: string | null = null;
  let strikeCount: number | null = null;

  if (decision === 'confirmed') {
    const reportPost = report.posts as { author_id?: string } | Array<{ author_id?: string }> | null;
    const authorId = Array.isArray(reportPost) ? reportPost[0]?.author_id : reportPost?.author_id;
    if (authorId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, strike_count')
        .eq('id', authorId)
        .maybeSingle();

      if (profileError || !profile) {
        return NextResponse.json({ error: profileError?.message ?? 'Profile not found' }, { status: 500 });
      }

      strikeCount = profile.strike_count + 1;
      nextState = applyStrike(profile.strike_count);

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ strike_count: strikeCount, moderation_state: nextState })
        .eq('id', authorId);

      if (profileUpdateError) {
        return NextResponse.json({ error: profileUpdateError.message }, { status: 500 });
      }

      const { error: postUpdateError } = await supabase
        .from('posts')
        .update({ is_hidden: true, strike_linked_profile_id: authorId, hidden_reason: 'confirmed_violation' })
        .eq('id', report.post_id);

      if (postUpdateError) {
        return NextResponse.json({ error: postUpdateError.message }, { status: 500 });
      }

      await supabase.from('moderation_reviews').insert({
        report_id: report.id,
        post_id: report.post_id,
        reviewer_id: reviewerId,
        target_profile_id: authorId,
        decision,
        moderation_action: nextState,
        strike_count_after: strikeCount,
        notes: notes?.trim() || null
      });
    }
  } else {
    await supabase.from('moderation_reviews').insert({
      report_id: report.id,
      post_id: report.post_id,
      reviewer_id: reviewerId,
      target_profile_id: null,
      decision,
      moderation_action: 'none',
      strike_count_after: null,
      notes: notes?.trim() || null
    });
  }

  return NextResponse.json({ ok: true, decision, moderationState: nextState, strikeCount });
}
