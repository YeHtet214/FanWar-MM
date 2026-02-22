'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { memeTemplates } from '@/lib/data';
import { useAsyncData } from '@/lib/hooks/use-async-data';
import { useLanguage } from '@/lib/language';
import { getMatches } from '@/lib/repositories/matches';
import { getTeams } from '@/lib/repositories/teams';
import { Match, Team } from '@/lib/types';

export default function MemePage() {
  const { t } = useLanguage();
  const { data, loading, error } = useAsyncData<[Match[], Team[]]>(async () => Promise.all([getMatches(), getTeams()]), []);

  const matches = data?.[0] ?? [];
  const teams = data?.[1] ?? [];

  const firstMatch = useMemo(() => matches[0], [matches]);
  const targetTeam = useMemo(
    () => teams.find((team) => team.id === firstMatch?.awayTeamId),
    [teams, firstMatch?.awayTeamId]
  );

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{t('memeGenerator')}</h1>
      {loading && <p className="card text-slate-300">Loading match data...</p>}
      {error && <p className="card text-red-300">Failed to load meme setup data.</p>}
      {!loading && !error && !firstMatch && <p className="card text-slate-300">No matches available.</p>}
      {firstMatch && (
        <div className="card space-y-3">
          <p>{t('chooseMatch')}: {firstMatch.id}</p>
          <p>{t('targetRival')}: {targetTeam?.name ?? '-'}</p>
          <p>{t('fillTemplate')}</p>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {memeTemplates.map((template) => (
          <article key={template.id} className="card space-y-2">
            <Image src={template.imageUrl} alt={template.name} width={400} height={220} className="h-28 w-full rounded object-cover" />
            <h2 className="font-semibold">{template.name}</h2>
            <p className="text-xs text-slate-400">{t('slots')}: {template.textSlots.join(', ')}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
