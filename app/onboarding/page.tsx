'use client';

import { teams } from '@/lib/data';
import { StepPanel } from '@/components/step-panel';
import { useLanguage } from '@/lib/language';

export default function OnboardingPage() {
  const { t } = useLanguage();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{t('onboardingTitle')}</h1>
      <StepPanel step={1} title={t('createAccount')} details={t('createAccountDesc')} />
      <StepPanel step={2} title={t('pickClub')} details={t('pickClubDesc')} />
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
