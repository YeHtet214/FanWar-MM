'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const allowedNextPrefixes = ['/', '/onboarding', '/war-room', '/match/', '/meme', '/leaderboard', '/moderation', '/admin/team-override'];

function getSafeNextPath() {
  const nextPath = new URLSearchParams(window.location.search).get('next');
  if (!nextPath || !nextPath.startsWith('/')) {
    return '/onboarding';
  }

  const isAllowed = allowedNextPrefixes.some((prefix) => nextPath === prefix || nextPath.startsWith(prefix));
  return isAllowed ? nextPath : '/onboarding';
}

export default function AuthPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) {
        return;
      }

      const { data } = await supabase.auth.getUser();
      if (data.user) {
        router.replace(getSafeNextPath());
      }
    };

    checkSession();
  }, [router, supabase]);

  const handleSendMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) {
      setErrorMessage('Supabase is not configured.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const redirectTo = `${window.location.origin}/onboarding`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo
        }
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

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
          disabled={loading}
          type="submit"
        >
          {loading ? 'Sending link...' : 'Send magic link'}
        </button>
      </form>

      {statusMessage ? <p className="card border border-emerald-700 bg-emerald-950/30 text-emerald-200">{statusMessage}</p> : null}
      {errorMessage ? <p className="card border border-red-700 bg-red-950/30 text-red-200">{errorMessage}</p> : null}
    </section>
  );
}
