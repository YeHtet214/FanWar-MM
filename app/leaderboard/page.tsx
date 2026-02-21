import { leaderboard, teams } from '@/lib/data';

export default function LeaderboardPage() {
  const rows = [...leaderboard].sort((a, b) => b.reputationTotal - a.reputationTotal);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Weekly Leaderboard</h1>
      <p className="text-slate-300">Lifetime points persist while weekly ranks reset via scheduled job.</p>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="pb-2">Rank</th>
              <th className="pb-2">User</th>
              <th className="pb-2">Club</th>
              <th className="pb-2">Reputation</th>
              <th className="pb-2">Title</th>
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
