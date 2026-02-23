'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { StepPanel } from '@/components/step-panel';
import { useAsyncData } from '@/lib/hooks/use-async-data';
import { useLanguage } from '@/lib/language';
import { getTeams } from '@/lib/repositories/teams';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { Team } from '@/lib/types';

type ProfileRow = {
  primary_team_id: string | null;
};

const allowedNextPrefixes = ['/war-room', '/match/', '/meme', '/leaderboard', '/moderation'];

function buildUsernameCandidate(user: User, attempt: number) {
  const email = user.email?.split('@')[0] ?? 'fan';
  const sanitized = email.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 16) || 'fan';
  const entropy = `${Date.now().toString(36)}_${attempt.toString(36)}_${crypto.randomUUID().slice(0, 6)}`;
  return `${sanitized}_${entropy}`.slice(0, 40);
}

async function generateUniqueUsername(
  supabase: SupabaseClient,
  user: User
): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = buildUsernameCandidate(user, attempt);
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', candidate)
      .maybeSingle();

    if (!existing) {
      return candidate;
    }
  }

  return buildUsernameCandidate(user, 99);
}

function getClientTeamCookie() {
  const match = document.cookie.match(/(?:^|; )fw_primary_team_id=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function setClientTeamCookie(teamId: string) {
  const secure = window.location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `fw_primary_team_id=${encodeURIComponent(teamId)}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax${secure}`;
}

function getSafeNextPath() {
  const nextPath = new URLSearchParams(window.location.search).get('next');
  if (!nextPath || !nextPath.startsWith('/')) {
    return '/war-room';
  }

  const isAllowed = allowedNextPrefixes.some((prefix) => nextPath === prefix || nextPath.startsWith(prefix));
  return isAllowed ? nextPath : '/war-room';
}

export default function OnboardingPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const { data, loading: teamsLoading, error: teamsError } = useAsyncData<Team[]>(getTeams, []);
  const teams = data ?? [];

  const [profileLoading, setProfileLoading] = useState(true);
  const [savingTeamId, setSavingTeamId] = useState<string | null>(null);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [canOverrideSelection, setCanOverrideSelection] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isTeamFromCookieFallback, setIsTeamFromCookieFallback] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!supabase) {
        setErrorMessage('Supabase is not configured.');
        setProfileLoading(false);
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setIsAuthenticated(false);
        router.replace(`/auth?next=${encodeURIComponent('/onboarding')}`);
        setProfileLoading(false);
        return;
      }

      setIsAuthenticated(true);

      const metadataTeam = typeof userData.user.user_metadata?.primary_team_id === 'string'
        ? userData.user.user_metadata.primary_team_id
        : null;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('primary_team_id')
        .eq('id', userData.user.id)
        .maybeSingle();

      if (profileError) {
        setErrorMessage(profileError.message);
      }

      const profileRow = profile as ProfileRow | null;
      const cookieTeam = getClientTeamCookie();
      const resolvedTeam = metadataTeam ?? profileRow?.primary_team_id ?? cookieTeam;
      setCurrentTeamId(resolvedTeam);
      setIsTeamFromCookieFallback(Boolean(!metadataTeam && !profileRow?.primary_team_id && cookieTeam));

      const overrideRequested = new URLSearchParams(window.location.search).get('adminOverride') === '1';
      const appRole = userData.user.app_metadata?.role;
      const appRoles = userData.user.app_metadata?.roles;
      const isAdmin = userData.user.app_metadata?.is_admin === true
        || appRole === 'admin'
        || (Array.isArray(appRoles) && appRoles.includes('admin'));
      setCanOverrideSelection(Boolean(overrideRequested && isAdmin));

      setProfileLoading(false);
    };

    loadProfile();
  }, [router, supabase]);

  const selectTeam = async (teamId: string) => {
    if (!supabase) {
      setErrorMessage('Supabase is not configured.');
      return;
    }

    if (isAuthenticated === false) {
      router.replace(`/auth?next=${encodeURIComponent('/onboarding')}`);
      return;
    }

    if (currentTeamId && !canOverrideSelection && !isTeamFromCookieFallback) {
      return;
    }

    setSavingTeamId(teamId);
    setErrorMessage(null);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        router.replace(`/auth?next=${encodeURIComponent('/onboarding')}`);
        return;
      }

      const { error: metadataError } = await supabase.auth.updateUser({
        data: { primary_team_id: teamId }
      });

      if (metadataError) {
        setErrorMessage(`Could not save your team in your account session. ${metadataError.message}`);
        return;
      }

      setClientTeamCookie(teamId);
      await supabase.auth.refreshSession();

      const { data: updatedRows, error: updateError } = await supabase
        .from('profiles')
        .update({ primary_team_id: teamId })
        .eq('id', userData.user.id)
        .select('id');

      if (updateError) {
        setErrorMessage(`Team selected, but profile sync failed: ${updateError.message}`);
      } else if (!updatedRows || updatedRows.length === 0) {
        const username = await generateUniqueUsername(supabase, userData.user);
        const { error: insertError } = await supabase
          .from('profiles')
          .upsert({
            id: userData.user.id,
            username,
            primary_team_id: teamId
          }, { onConflict: 'id' })
          .select('id')
          .single();

        if (insertError) {
          setErrorMessage(`Team selected, but profile sync failed: ${insertError.message}`);
        }
      }

      setCurrentTeamId(teamId);
      setIsTeamFromCookieFallback(false);
      router.replace(getSafeNextPath());
    } catch {
      setErrorMessage('Unexpected error while saving your team. Please try again.');
    } finally {
      setSavingTeamId(null);
    }
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{t('onboardingTitle')}</h1>
      <StepPanel step={1} title={t('createAccount')} details={t('createAccountDesc')} />
      <StepPanel step={2} title={t('pickClub')} details={t('pickClubDesc')} />

      {errorMessage ? (
        <div className="card border border-red-600 bg-red-950/30 text-red-200">{errorMessage}</div>
      ) : null}

      {currentTeamId ? (
        <div className="card border border-sky-700 bg-sky-950/30 text-sky-100">
          <p className="mb-3">
            {canOverrideSelection
              ? 'Admin override is enabled. You can choose a different team for this session.'
              : 'Your team is locked. Continue to start participating.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-md bg-red-600 px-3 py-1 text-sm"
              onClick={() => router.push('/war-room')}
              type="button"
            >
              Go to War Room
            </button>
            <button
              className="rounded-md border border-slate-500 px-3 py-1 text-sm"
              onClick={() => router.push('/leaderboard')}
              type="button"
            >
              View Leaderboard
            </button>
          </div>
        </div>
      ) : null}

      {teamsLoading && <p className="card text-slate-300">Loading teams...</p>}
      {teamsError && <p className="card text-red-300">Failed to load teams.</p>}
      {!teamsLoading && !teamsError && teams.length === 0 && <p className="card text-slate-300">No teams available.</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {teams.map((team) => {
          const isSelected = currentTeamId === team.id;
          const disabled =
            profileLoading ||
            teamsLoading ||
            Boolean(savingTeamId) ||
            isAuthenticated === false ||
            (Boolean(currentTeamId) && !canOverrideSelection && !isTeamFromCookieFallback);

          return (
            <article key={team.id} className="card flex items-center justify-between">
              <span className="text-lg">{team.crest} {team.name}</span>
              <button
                className="rounded-md bg-red-600 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                disabled={disabled}
                onClick={() => selectTeam(team.id)}
                type="button"
              >
                {savingTeamId === team.id ? 'Saving...' : isSelected ? 'Selected' : t('select')}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
