import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { hasSupabaseEnv, supabaseAnonKey, supabaseUrl } from '@/lib/supabase/env';

const protectedPrefixes = ['/war-room', '/match', '/meme', '/leaderboard', '/moderation'];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
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
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  const pathname = request.nextUrl.pathname;
  const isOnboarding = pathname === '/onboarding';
  const isAdminOverride = pathname === '/admin/team-override';

  if (!user) {
    if (isProtectedPath(pathname) || isAdminOverride) {
      const redirectUrl = new URL('/onboarding', request.url);
      redirectUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('primary_team_id, is_admin')
    .eq('id', user.id)
    .single();

  const hasTeam = Boolean(profile?.primary_team_id);
  const isAdmin = Boolean(profile?.is_admin);

  if (isAdminOverride && !isAdmin) {
    return NextResponse.redirect(new URL('/war-room', request.url));
  }

  if (!hasTeam && isProtectedPath(pathname)) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  if (isOnboarding && hasTeam) {
    return NextResponse.redirect(new URL('/war-room', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/onboarding', '/war-room/:path*', '/match/:path*', '/meme/:path*', '/leaderboard/:path*', '/moderation/:path*', '/admin/team-override']
};
