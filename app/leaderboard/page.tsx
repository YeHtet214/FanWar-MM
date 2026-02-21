'use client';

import { leaderboard, teams } from '@/lib/data';
import { useLanguage } from '@/lib/language';

export default function LeaderboardPage() {
  const { t } = useLanguage();
  const rows = [...leaderboard].sort((a, b) => b.reputationTotal - a.reputationTotal);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{t('weeklyLeaderboard')}</h1>
      <p className="text-slate-300">{t('weeklyLeaderboardDesc')}</p>
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
            {rows.map((row, index) => {
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
    </section>
  );
}
