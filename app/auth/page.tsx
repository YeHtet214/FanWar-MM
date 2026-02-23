'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthChangeEvent } from '@supabase/supabase-js';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

const allowedNextPrefixes = ['/', '/onboarding', '/war-room', '/match/', '/meme', '/leaderboard', '/moderation', '/admin/team-override'];
const defaultCooldownSeconds = 60;

function getSafeNextPath() {
  const nextPath = new URLSearchParams(window.location.search).get('next');
  if (!nextPath || !nextPath.startsWith('/')) {
    return '/onboarding';
  }

  const isAllowed = allowedNextPrefixes.some((prefix) => nextPath === prefix || nextPath.startsWith(prefix));
  return isAllowed ? nextPath : '/onboarding';
}

type PostLoginStatus = {
  path: string;
  needsOnboarding: boolean;
  isAuthenticated: boolean;
};

async function getPostLoginStatus(
  supabase: NonNullable<ReturnType<typeof createBrowserSupabaseClient>>,
  requestedPath: string
): Promise<PostLoginStatus> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { path: '/auth', needsOnboarding: false, isAuthenticated: false };
  }

  const metadataTeam = typeof userData.user.user_metadata?.primary_team_id === 'string'
    ? userData.user.user_metadata.primary_team_id
    : null;

  if (metadataTeam) {
    return { path: requestedPath, needsOnboarding: false, isAuthenticated: true };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('primary_team_id')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (!profile?.primary_team_id) {
    return { path: '/onboarding', needsOnboarding: true, isAuthenticated: true };
  }

  return { path: requestedPath, needsOnboarding: false, isAuthenticated: true };
}

export default function AuthPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (!cooldownEndsAt) {
      setRemainingSeconds(0);
      return;
    }

    const updateCountdown = () => {
      const secondsLeft = Math.max(0, Math.ceil((cooldownEndsAt - Date.now()) / 1000));
      setRemainingSeconds(secondsLeft);
      if (secondsLeft === 0) {
        setCooldownEndsAt(null);
      }
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownEndsAt]);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      return;
    }

    let cancelled = false;

    const checkSession = async () => {
      const requestedPath = getSafeNextPath();
      const status = await getPostLoginStatus(client, requestedPath);
      if (cancelled) {
        return;
      }

      setNeedsOnboarding(status.needsOnboarding);
      if (status.isAuthenticated && !status.needsOnboarding && status.path !== '/auth') {
        router.replace(status.path);
      }
    };

    const {
      data: { subscription }
    } = client.auth.onAuthStateChange(async (event: AuthChangeEvent) => {
      if (event === 'SIGNED_IN') {
        const requestedPath = getSafeNextPath();
        const status = await getPostLoginStatus(client, requestedPath);
        if (cancelled) {
          return;
        }

        setNeedsOnboarding(status.needsOnboarding);
        if (!status.needsOnboarding && status.path !== '/auth') {
          router.replace(status.path);
        }
      }
    });

    checkSession();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const handleSendMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) {
      setErrorMessage('Supabase is not configured.');
      return;
    }

    if (remainingSeconds > 0) {
      setErrorMessage(`Please wait ${remainingSeconds}s before requesting another magic link.`);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const requestedPath = getSafeNextPath();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(requestedPath)}`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo
        }
      });

      if (error) {
        const isRateLimit = /rate limit|security purposes|too many requests/i.test(error.message);
        if (isRateLimit) {
          const retryMatch = error.message.match(/(\d+)/);
          const cooldownSeconds = retryMatch ? Number(retryMatch[1]) : defaultCooldownSeconds;
          setCooldownEndsAt(Date.now() + (cooldownSeconds * 1000));
          setErrorMessage(`Too many requests. Please wait ${cooldownSeconds}s and try again.`);
          return;
        }

        setErrorMessage(error.message);
        return;
      }

      setCooldownEndsAt(Date.now() + (defaultCooldownSeconds * 1000));
      setStatusMessage('Check your email for the sign-in link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Sign in or create account</h1>
      <p className="text-slate-300">
        Use your email to receive a magic link. New users will be created automatically by Supabase Auth.
      </p>

      <p className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-300">
        Important: open the magic link in the same browser and device where you requested it.
      </p>

      {needsOnboarding ? (
        <div className="card space-y-2 border border-amber-700 bg-amber-950/30 text-amber-100">
          <p>You are signed in, but your team selection is incomplete.</p>
          <div className="flex gap-2">
            <button
              className="rounded-md bg-red-600 px-3 py-1 text-sm"
              onClick={() => router.push('/onboarding')}
              type="button"
            >
              Continue onboarding
            </button>
            <button
              className="rounded-md border border-slate-500 px-3 py-1 text-sm"
              onClick={async () => {
                if (!supabase) {
                  return;
                }
                await supabase.auth.signOut();
                setNeedsOnboarding(false);
              }}
              type="button"
            >
              Sign out
            </button>
          </div>
        </div>
      ) : null}

      <form className="card space-y-3" onSubmit={handleSendMagicLink}>
        <label className="block space-y-1" htmlFor="email">
          <span className="text-sm text-slate-300">Email address</span>
          <input
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white"
            id="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </label>

        <button
          className="rounded-md bg-red-600 px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading || remainingSeconds > 0}
          type="submit"
        >
          {loading ? 'Sending link...' : remainingSeconds > 0 ? `Retry in ${remainingSeconds}s` : 'Send magic link'}
        </button>
      </form>

      {statusMessage ? <p className="card border border-emerald-700 bg-emerald-950/30 text-emerald-200">{statusMessage}</p> : null}
      {errorMessage ? <p className="card border border-red-700 bg-red-950/30 text-red-200">{errorMessage}</p> : null}
    </section>
  );
}
