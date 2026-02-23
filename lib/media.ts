const MAX_MEDIA_URL_LENGTH = 2048;

function getSupabaseHost() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) {
    return null;
  }

  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

export const TRUSTED_MEDIA_HOSTS = [getSupabaseHost()].filter((host): host is string => Boolean(host));

export function validateMediaUrl(input: string, options?: { requireHttps?: boolean; allowedHosts?: string[] }) {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: true, normalizedUrl: '' };
  }

  if (trimmed.length > MAX_MEDIA_URL_LENGTH) {
    return { ok: false, error: `Media URL is too long (max ${MAX_MEDIA_URL_LENGTH} characters)` };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: 'Media URL is not a valid URL' };
  }

  const requireHttps = options?.requireHttps ?? true;
  if (requireHttps && parsed.protocol !== 'https:') {
    return { ok: false, error: 'Media URL must use https' };
  }

  if (!requireHttps && !['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, error: 'Media URL must use http or https' };
  }

  const allowedHosts = options?.allowedHosts;
  if (allowedHosts && allowedHosts.length > 0 && !allowedHosts.includes(parsed.hostname)) {
    return { ok: false, error: 'Media URL host is not allowed' };
  }

  return { ok: true, normalizedUrl: parsed.toString() };
}

export function isTrustedMediaUrl(input: string) {
  const result = validateMediaUrl(input, { allowedHosts: TRUSTED_MEDIA_HOSTS });
  return result.ok && Boolean(result.normalizedUrl);
}

export { MAX_MEDIA_URL_LENGTH };
