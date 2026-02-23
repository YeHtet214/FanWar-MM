import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: { postId: string } }) {
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

  const { reason } = (await request.json()) as { reason?: string };

  if (!reason?.trim()) {
    return NextResponse.json({ error: 'Invalid report payload' }, { status: 400 });
  }

  const { data: post, error: postReadError } = await supabase
    .from('posts')
    .select('id')
    .eq('id', params.postId)
    .maybeSingle();

  if (postReadError) {
    return NextResponse.json({ error: postReadError.message }, { status: 500 });
  }

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const { error: reportError } = await supabase.rpc('create_report_and_increment_post_count', {
    target_post_id: params.postId,
    target_reporter_id: userData.user.id,
    report_reason: reason.trim()
  });

  if (reportError) {
    return NextResponse.json({ error: reportError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
