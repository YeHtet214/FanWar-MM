'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { memeTemplates } from '@/lib/data';
import { useLanguage } from '@/lib/language';
import { getMatches } from '@/lib/repositories/matches';
import { getTeams } from '@/lib/repositories/teams';
import { Match, Team } from '@/lib/types';

export default function MemePage() {
  const { t } = useLanguage();
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const [matchRows, teamRows] = await Promise.all([getMatches(), getTeams()]);

        if (!active) {
          return;
        }

        setMatches(matchRows);
        setTeams(teamRows);
        setError(null);
      } catch {
        if (active) {
          setError('Failed to load meme setup data.');
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

  const firstMatch = matches[0];
  const targetTeam = teams.find((team) => team.id === firstMatch?.awayTeamId);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{t('memeGenerator')}</h1>
      {loading && <p className="card text-slate-300">Loading match data...</p>}
      {error && <p className="card text-red-300">{error}</p>}
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
