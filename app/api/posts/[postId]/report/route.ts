import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: { postId: string } }) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  const { reporterId, reason } = (await request.json()) as { reporterId?: string; reason?: string };

  if (!reporterId || !reason?.trim()) {
    return NextResponse.json({ error: 'Invalid report payload' }, { status: 400 });
  }

  const { error: reportError } = await supabase.from('reports').insert({
    reporter_id: reporterId,
    post_id: params.postId,
    reason: reason.trim(),
    status: 'open'
  });

  if (reportError) {
    return NextResponse.json({ error: reportError.message }, { status: 500 });
  }

  const { data: post, error: postReadError } = await supabase
    .from('posts')
    .select('report_count')
    .eq('id', params.postId)
    .maybeSingle();

  if (postReadError || !post) {
    return NextResponse.json({ error: postReadError?.message ?? 'Post not found' }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from('posts')
    .update({ report_count: post.report_count + 1 })
    .eq('id', params.postId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
