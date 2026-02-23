import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let browserSupabaseClient: SupabaseClient | null = null;

const noOpBrowserLock = async <T>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<T>
): Promise<T> => fn();

export function createBrowserSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (browserSupabaseClient) {
    return browserSupabaseClient;
  }

  browserSupabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      lock: noOpBrowserLock
    }
  });
  return browserSupabaseClient;
}

export function createSupabaseBrowserClient() {
  return createBrowserSupabaseClient();
}
