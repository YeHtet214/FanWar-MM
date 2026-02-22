'use client';

import { StepPanel } from '@/components/step-panel';
import { useAsyncData } from '@/lib/hooks/use-async-data';
import { useLanguage } from '@/lib/language';
import { getTeams } from '@/lib/repositories/teams';
import { Team } from '@/lib/types';

export default function OnboardingPage() {
  const { t } = useLanguage();
  const { data, loading, error } = useAsyncData<Team[]>(getTeams, []);
  const teams = data ?? [];

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{t('onboardingTitle')}</h1>
      <StepPanel step={1} title={t('createAccount')} details={t('createAccountDesc')} />
      <StepPanel step={2} title={t('pickClub')} details={t('pickClubDesc')} />
      {loading && <p className="card text-slate-300">Loading teams...</p>}
      {error && <p className="card text-red-300">Failed to load teams.</p>}
      {!loading && !error && teams.length === 0 && <p className="card text-slate-300">No teams available.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {teams.map((team) => (
          <article key={team.id} className="card flex items-center justify-between">
            <span className="text-lg">{team.crest} {team.name}</span>
            <button className="rounded-md bg-red-600 px-3 py-1 text-sm">{t('select')}</button>
          </article>
        ))}
      </div>
    </section>
  );
}
