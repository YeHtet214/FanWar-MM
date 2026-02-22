'use client';

import { useEffect, useState } from 'react';
import { StepPanel } from '@/components/step-panel';
import { useLanguage } from '@/lib/language';
import { getTeams } from '@/lib/repositories/teams';
import { Team } from '@/lib/types';

export default function OnboardingPage() {
  const { t } = useLanguage();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const rows = await getTeams();

        if (!active) {
          return;
        }

        setTeams(rows);
        setError(null);
      } catch {
        if (active) {
          setError('Failed to load teams.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{t('onboardingTitle')}</h1>
      <StepPanel step={1} title={t('createAccount')} details={t('createAccountDesc')} />
      <StepPanel step={2} title={t('pickClub')} details={t('pickClubDesc')} />
      {loading && <p className="card text-slate-300">Loading teams...</p>}
      {error && <p className="card text-red-300">{error}</p>}
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
