import { NextResponse } from 'next/server';
import { ReactionType } from '@/lib/types';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getProfileModerationState, isPostingBlocked } from '@/lib/server/moderation';

const reactionTypes: ReactionType[] = ['clown', 'fire', 'bottle', 'salty', 'laugh'];

export async function POST(request: Request, { params }: { params: { postId: string } }) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  const { userId, reaction, action } = (await request.json()) as {
    userId?: string;
    reaction?: ReactionType;
    action?: 'add' | 'remove';
  };

  if (!userId || !reaction || !action || !reactionTypes.includes(reaction)) {
    return NextResponse.json({ error: 'Invalid reaction payload' }, { status: 400 });
  }

  try {
    const profile = await getProfileModerationState(supabase, userId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (isPostingBlocked(profile.moderation_state)) {
      return NextResponse.json({ error: 'Account is restricted from reactions' }, { status: 403 });
    }
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }

  if (action === 'add') {
    const { error } = await supabase.from('post_reactions').upsert({
      post_id: params.postId,
      user_id: userId,
      reaction
    }, { onConflict: 'post_id,user_id,reaction' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabase
      .from('post_reactions')
      .delete()
      .eq('post_id', params.postId)
      .eq('user_id', userId)
      .eq('reaction', reaction);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
