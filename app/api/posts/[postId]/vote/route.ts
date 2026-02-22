import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: { postId: string } }) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  const { postId } = params;
  const { userId, value } = (await request.json()) as { userId?: string; value?: 1 | -1 };

  if (!userId || (value !== 1 && value !== -1)) {
    return NextResponse.json({ error: 'Invalid vote payload' }, { status: 400 });
  }

  const { data: existingVote } = await supabase
    .from('post_votes')
    .select('id, value')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingVote) {
    const { error: voteError } = await supabase.from('post_votes').update({ value }).eq('id', existingVote.id);
    if (voteError) {
      return NextResponse.json({ error: voteError.message }, { status: 500 });
    }
  } else {
    const { error: voteError } = await supabase.from('post_votes').insert({ post_id: postId, user_id: userId, value });
    if (voteError) {
      return NextResponse.json({ error: voteError.message }, { status: 500 });
    }
  }

  const { data: allVotes, error: votesReadError } = await supabase.from('post_votes').select('value').eq('post_id', postId);
  if (votesReadError) {
    return NextResponse.json({ error: votesReadError.message }, { status: 500 });
  }

  const upvotes = allVotes.filter((vote: { value: number }) => vote.value === 1).length;
  const downvotes = allVotes.filter((vote: { value: number }) => vote.value === -1).length;

  const { error: updateError } = await supabase
    .from('posts')
    .update({ upvotes, downvotes, score: upvotes - downvotes })
    .eq('id', postId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, upvotes, downvotes });
}
