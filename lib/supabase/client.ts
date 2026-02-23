import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let browserSupabaseClient: SupabaseClient | null = null;

/**
 * Intentionally bypasses Navigator LockManager-based auth locking.
 *
 * Why: some environments hit Navigator Lock acquisition timeouts and auth callback hangs.
 * Trade-off: this removes cross-tab token refresh synchronization, so multiple tabs can race.
 * Acceptable for mostly single-tab usage or when occasional refresh race failures are tolerable.
 * Avoid in strict multi-tab consistency scenarios where a real lock implementation is required.
 */
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
