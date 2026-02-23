'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StepPanel } from '@/components/step-panel';
import { useAsyncData } from '@/lib/hooks/use-async-data';
import { useLanguage } from '@/lib/language';
import { getTeams } from '@/lib/repositories/teams';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Team } from '@/lib/types';

type ProfileRow = {
  primary_team_id: string | null;
};

const allowedNextPrefixes = ['/war-room', '/match/', '/meme', '/leaderboard', '/moderation'];

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
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { data, loading: teamsLoading, error: teamsError } = useAsyncData<Team[]>(getTeams, []);
  const teams = data ?? [];

  const [profileLoading, setProfileLoading] = useState(true);
  const [savingTeamId, setSavingTeamId] = useState<string | null>(null);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [canOverrideSelection, setCanOverrideSelection] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

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

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('primary_team_id')
        .eq('id', userData.user.id)
        .maybeSingle();

      if (profileError) {
        setErrorMessage(profileError.message);
      } else {
        const profileRow = profile as ProfileRow | null;
        setCurrentTeamId(profileRow?.primary_team_id ?? null);
        const overrideRequested = new URLSearchParams(window.location.search).get('adminOverride') === '1';
        const isAdminFromMetadata = userData.user.user_metadata?.is_admin === true;
        setCanOverrideSelection(Boolean(overrideRequested && isAdminFromMetadata));
      }

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

    if (currentTeamId && !canOverrideSelection) {
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

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ primary_team_id: teamId })
        .eq('id', userData.user.id);

      if (updateError) {
        setErrorMessage(updateError.message);
        return;
      }

      setCurrentTeamId(teamId);
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

      {currentTeamId && !canOverrideSelection ? (
        <div className="card border border-emerald-600 bg-emerald-950/30 text-emerald-200">
          Team already selected. Use the admin override flow if your policy allows changes.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="card border border-red-600 bg-red-950/30 text-red-200">{errorMessage}</div>
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
            (Boolean(currentTeamId) && !canOverrideSelection);

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
