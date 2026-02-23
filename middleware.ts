import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { hasSupabaseEnv, supabaseAnonKey, supabaseUrl } from '@/lib/supabase/env';

type SetAllCookies = {
  name: string;
  value: string;
  options?: Parameters<NextResponse['cookies']['set']>[2];
};

const protectedPrefixes = ['/war-room', '/match', '/meme', '/leaderboard', '/moderation'];
const profileCacheCookie = 'fw_profile_cache';
const clientTeamCookieName = 'fw_primary_team_id';

type ProfileCache = {
  primary_team_id: string | null;
  exp: number;
};

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function readProfileCache(rawValue?: string): ProfileCache | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as ProfileCache;
    if (!parsed || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    return {
      primary_team_id: parsed.primary_team_id ?? null,
      exp: parsed.exp
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: SetAllCookies[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  const pathname = request.nextUrl.pathname;
  const adminOverrideRequested = request.nextUrl.searchParams.get('adminOverride') === '1';
  const isOnboarding = pathname === '/onboarding';
  const isAdminOverride = pathname === '/admin/team-override';

  if (!user) {
    if (isProtectedPath(pathname) || isAdminOverride || isOnboarding) {
      const redirectUrl = new URL('/auth', request.url);
      const targetPath = `${pathname}${request.nextUrl.search}`;
      redirectUrl.searchParams.set('next', targetPath);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  const metadataTeam = typeof user.user_metadata?.primary_team_id === 'string'
    ? user.user_metadata.primary_team_id
    : null;
  const metadataIsAdmin = typeof user.user_metadata?.is_admin === 'boolean'
    ? user.user_metadata.is_admin
    : null;
  const cachedProfile = readProfileCache(request.cookies.get(profileCacheCookie)?.value);

  const cookieTeam = request.cookies.get(clientTeamCookieName)?.value ?? null;
  let primaryTeamId: string | null = metadataTeam ?? cachedProfile?.primary_team_id ?? cookieTeam ?? null;
  let isAdmin = metadataIsAdmin;

  if (primaryTeamId === null) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('primary_team_id')
      .eq('id', user.id)
      .maybeSingle();

    primaryTeamId = profile?.primary_team_id ?? null;

    response.cookies.set(profileCacheCookie, JSON.stringify({
      primary_team_id: primaryTeamId,
      exp: Date.now() + (5 * 60 * 1000)
    }), {
      httpOnly: true,
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
      path: '/'
    });
  }

  const hasTeam = Boolean(primaryTeamId);
  const hasAdminAccess = Boolean(isAdmin);

  if (isAdminOverride && !hasAdminAccess) {
    if (!hasTeam) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
    return NextResponse.redirect(new URL('/war-room', request.url));
  }

  if (!hasTeam && isProtectedPath(pathname)) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  if (isOnboarding && hasTeam && !(hasAdminAccess && adminOverrideRequested)) {
    return NextResponse.redirect(new URL('/war-room', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/onboarding', '/war-room/:path*', '/match/:path*', '/meme/:path*', '/leaderboard/:path*', '/moderation/:path*', '/admin/team-override']
};
