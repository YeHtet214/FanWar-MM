'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/lib/language';
import { getLeaderboard } from '@/lib/repositories/leaderboard';
import { getTeams } from '@/lib/repositories/teams';
import { Team, UserProfile } from '@/lib/types';

export default function LeaderboardPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<UserProfile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const [leaderboardRows, teamRows] = await Promise.all([getLeaderboard(), getTeams()]);

        if (!active) {
          return;
        }

        setRows(leaderboardRows);
        setTeams(teamRows);
        setError(null);
      } catch {
        if (active) {
          setError('Failed to load leaderboard.');
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

  const sortedRows = useMemo(() => [...rows].sort((a, b) => b.reputationTotal - a.reputationTotal), [rows]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{t('weeklyLeaderboard')}</h1>
      <p className="text-slate-300">{t('weeklyLeaderboardDesc')}</p>
      {loading && <p className="card text-slate-300">Loading leaderboard...</p>}
      {error && <p className="card text-red-300">{error}</p>}
      {!loading && !error && sortedRows.length === 0 && <p className="card text-slate-300">No leaderboard data available.</p>}
      {!error && sortedRows.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="pb-2">{t('rank')}</th>
                <th className="pb-2">{t('user')}</th>
                <th className="pb-2">{t('club')}</th>
                <th className="pb-2">{t('reputation')}</th>
                <th className="pb-2">{t('title')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, index) => {
                const team = teams.find((item) => item.id === row.primaryTeamId);
                return (
                  <tr key={row.id} className="border-t border-slate-800">
                    <td className="py-2">#{index + 1}</td>
                    <td className="py-2">{row.username}</td>
                    <td className="py-2">{team?.shortCode}</td>
                    <td className="py-2">{row.reputationTotal}</td>
                    <td className="py-2">{row.rank}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
