import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let browserSupabaseClient: SupabaseClient | null = null;

export function createBrowserSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (browserSupabaseClient) {
    return browserSupabaseClient;
  }

  browserSupabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return browserSupabaseClient;
}

export function createSupabaseBrowserClient() {
  return createBrowserSupabaseClient();
}
