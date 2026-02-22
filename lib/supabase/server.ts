import { createServerClient } from '@supabase/ssr';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;


export async function createSupabaseServerClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const { cookies } = await import('next/headers');
  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: unknown }>) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            cookieStore.set(name, value, options as never);
          } catch {
            // no-op during SSR render paths where cookie mutation is not allowed
          }
        });
      }
    }
  });
}

/**
 * WARNING: Server-side privileged keys bypass Row Level Security and can grant broad DB access.
 * Use trusted server-only keys (prefer SUPABASE_SECRET_KEY; fallback SUPABASE_SERVICE_ROLE_KEY),
 * and never expose them in client bundles.
 */
let serverSupabaseClient: SupabaseClient | null = null;

/**
 * Server-side Supabase factory for trusted backend usage.
 * Keep this available for server components/API routes that require privileged access.
 */
export function createServerSupabaseClient() {
  if (!supabaseUrl || !supabaseSecretKey) {
    return null;
  }

  if (serverSupabaseClient) {
    return serverSupabaseClient;
  }

  serverSupabaseClient = createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return serverSupabaseClient;
}
