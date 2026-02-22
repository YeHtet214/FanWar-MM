'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const allowedNextPrefixes = ['/', '/onboarding', '/war-room', '/match/', '/meme', '/leaderboard', '/moderation', '/admin/team-override'];

function getSafeNextPath() {
  const nextPath = new URLSearchParams(window.location.search).get('next');
  if (!nextPath || !nextPath.startsWith('/')) {
    return '/war-room';
  }

  const isAllowed = allowedNextPrefixes.some((prefix) => nextPath === prefix || nextPath.startsWith(prefix));
  return isAllowed ? nextPath : '/war-room';
}

type ProfileRow = {
  primary_team_id: string | null;
};

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (!supabase) {
        setErrorMessage('Supabase is not configured.');
        return;
      }

      const code = new URLSearchParams(window.location.search).get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setErrorMessage(error.message);
          return;
        }
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setErrorMessage('Authentication failed. Please request a new magic link.');
        return;
      }

      const requestedPath = getSafeNextPath();
      const { data: profile } = await supabase
        .from('profiles')
        .select('primary_team_id')
        .eq('id', userData.user.id)
        .single();

      if (!profile || !(profile as ProfileRow).primary_team_id) {
        router.replace('/onboarding');
        return;
      }

      router.replace(requestedPath);
    };

    handleAuthCallback();
  }, [router, supabase]);

  return (
    <section className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Signing you in...</h1>
      <p className="text-slate-300">Please wait while we verify your magic link and restore your session.</p>
      {errorMessage ? <p className="card border border-red-700 bg-red-950/30 text-red-200">{errorMessage}</p> : null}
    </section>
  );
}
