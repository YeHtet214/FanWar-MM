'use client';

import { useState } from 'react';
import { teams } from '@/lib/data';

export default function TeamOverridePage() {
  const [targetUserId, setTargetUserId] = useState('');
  const [teamId, setTeamId] = useState(teams[0]?.id ?? '');
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const applyOverride = async () => {
    setSaving(true);
    setStatus(null);

    try {
      const response = await fetch('/api/admin/team-override', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetUserId: targetUserId.trim(),
          teamId
        })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus(payload.error ?? 'Failed to apply override.');
        return;
      }

      setStatus('Team override applied successfully.');
    } catch {
      setStatus('Unexpected error while applying override. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Admin team override</h1>
      <p className="text-slate-300">Use this path only when policy allows changing a locked team selection.</p>
      <div className="card space-y-3">
        <label className="block space-y-1 text-sm">
          <span className="text-slate-300">Target user id</span>
          <input
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2"
            onChange={(event) => setTargetUserId(event.target.value)}
            placeholder="UUID from profiles.id"
            value={targetUserId}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-300">New primary team</span>
          <select
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2"
            onChange={(event) => setTeamId(event.target.value)}
            value={teamId}
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.crest} {team.name}</option>
            ))}
          </select>
        </label>
        <button
          className="rounded-md bg-red-600 px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          disabled={saving || !targetUserId.trim()}
          onClick={applyOverride}
          type="button"
        >
          {saving ? 'Applying…' : 'Apply override'}
        </button>
        {status ? <p className="text-sm text-slate-300">{status}</p> : null}
      </div>
    </section>
  );
}
