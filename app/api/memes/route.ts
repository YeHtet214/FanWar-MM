import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { createServerSupabaseClient, createSupabaseServerClient } from '@/lib/supabase/server';

const BUCKET = 'generated-memes';

function decodeDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image payload');
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64')
  };
}

function resolveFileExtension(mimeType: string) {
  if (mimeType === 'image/png' || mimeType.startsWith('image/png;')) {
    return 'png';
  }

  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg' || mimeType.startsWith('image/jpeg;') || mimeType.startsWith('image/jpg;')) {
    return 'jpg';
  }

  throw new Error('Unsupported image type. Use PNG or JPEG.');
}

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

  let payload: unknown;
  try {
    payload = await request.json();
  } catch (error) {
    const parseError = error instanceof Error ? error.message : 'Unknown JSON parse error';
    return NextResponse.json({ error: `Invalid JSON payload: ${parseError}` }, { status: 400 });
  }

  const requestData = (payload ?? {}) as {
    templateId?: string;
    templateSlug?: string;
    imageDataUrl?: string;
    matchId?: string;
    targetTeamId?: string;
    caption?: string;
    textSlots?: unknown;
  };

  const { templateId, templateSlug, imageDataUrl, matchId, targetTeamId, caption } = requestData;

  if ((!templateId && !templateSlug) || !imageDataUrl) {
    return NextResponse.json({ error: 'Missing required meme data' }, { status: 400 });
  }

  let validatedTextSlots: string[] = [];
  if (requestData.textSlots !== undefined) {
    if (!Array.isArray(requestData.textSlots)) {
      return NextResponse.json({ error: 'textSlots must be an array of strings' }, { status: 400 });
    }

    if (!requestData.textSlots.every((slot) => typeof slot === 'string')) {
      return NextResponse.json({ error: 'textSlots must contain only strings' }, { status: 400 });
    }

    validatedTextSlots = requestData.textSlots.map((slot) => slot.trim());
  }

  let resolvedTemplateId = templateId;
  if (!resolvedTemplateId && templateSlug) {
    const normalizedSlug = templateSlug.trim();
    if (!normalizedSlug) {
      return NextResponse.json({ error: 'Missing required meme data' }, { status: 400 });
    }

    const { data: template, error: templateError } = await supabase
      .from('meme_templates')
      .select('id')
      .eq('slug', normalizedSlug)
      .eq('is_active', true)
      .maybeSingle();

    if (templateError) {
      return NextResponse.json({ error: templateError.message }, { status: 500 });
    }

    if (!template) {
      return NextResponse.json({ error: 'Invalid meme template' }, { status: 400 });
    }

    resolvedTemplateId = template.id;
  }

  const creatorId = userData.user.id;
  const limiter = checkRateLimit(`meme:${creatorId}`, 10, 60_000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: 'Too many meme exports, please slow down' }, { status: 429 });
  }

  const normalizedCaption = caption?.trim() ?? '';
  if (normalizedCaption.length > 200) {
    return NextResponse.json({ error: 'Caption is too long (max 200 chars)' }, { status: 400 });
  }

  if (validatedTextSlots.some((slot) => slot.length > 80)) {
    return NextResponse.json({ error: 'Each text slot must be 80 characters or less' }, { status: 400 });
  }

  let decoded;
  try {
    decoded = decodeDataUrl(imageDataUrl);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }

  if (decoded.buffer.byteLength > 4 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image too large (max 4MB)' }, { status: 400 });
  }

  let fileExt: string;
  try {
    fileExt = resolveFileExtension(decoded.mimeType);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }

  const objectPath = `${creatorId}/${Date.now()}-${resolvedTemplateId}.${fileExt}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(objectPath, decoded.buffer, {
    contentType: decoded.mimeType,
    upsert: false
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  const renderedImageUrl = publicUrlData.publicUrl;

  const { data: inserted, error: insertError } = await supabase
    .from('generated_memes')
    .insert({
      creator_id: creatorId,
      match_id: matchId ?? null,
      target_team_id: targetTeamId ?? null,
      template_id: resolvedTemplateId,
      rendered_image_url: renderedImageUrl,
      caption: normalizedCaption || null,
      overlay_text: validatedTextSlots,
      storage_path: objectPath
    })
    .select('id, rendered_image_url')
    .single();

  if (insertError) {
    const { error: cleanupError } = await supabase.storage.from('generated-memes').remove([objectPath]);
    if (cleanupError) {
      console.error('Failed to cleanup orphaned meme object after insert failure', {
        objectPath,
        insertError: insertError.message,
        cleanupError: cleanupError.message
      });
    }

    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ memeId: inserted.id, imageUrl: inserted.rendered_image_url });
}
