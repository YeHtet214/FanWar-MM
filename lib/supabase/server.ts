import { SupabaseClient, createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * WARNING: SUPABASE_SERVICE_ROLE_KEY bypasses Row Level Security and grants full DB access.
 * Use this only in trusted server/admin contexts (e.g., server actions, API routes, background jobs),
 * never in client bundles. For client/limited operations, use anon keys with RLS or scoped service tokens.
 */
let serverSupabaseClient: SupabaseClient | null = null;

/**
 * Server-side Supabase factory for trusted backend usage.
 * Keep this available for server components/API routes that require privileged access.
 */
export function createServerSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  if (serverSupabaseClient) {
    return serverSupabaseClient;
  }

  serverSupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return serverSupabaseClient;
}
