import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { hasSupabaseEnv, supabaseAnonKey, supabaseUrl } from '@/lib/supabase/env';

type SetAllCookies = {
  name: string;
  value: string;
  options?: Parameters<ReturnType<typeof cookies>['set']>[2];
};

export function createSupabaseServerClient() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const cookieStore = cookies();

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: SetAllCookies[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // no-op during SSR render paths where cookie mutation is not allowed
          }
        });
      }
    }
  });
}
