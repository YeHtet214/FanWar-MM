'use client';

import { useMemo, useState } from 'react';
import { teams } from '@/lib/data';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function TeamOverridePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [targetUserId, setTargetUserId] = useState('');
  const [teamId, setTeamId] = useState(teams[0]?.id ?? '');
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const applyOverride = async () => {
    if (!supabase) {
      setStatus('Supabase is not configured.');
      return;
    }

    setSaving(true);
    setStatus(null);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setStatus('You must be signed in as an admin.');
      setSaving(false);
      return;
    }

    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userData.user.id)
      .single();

    if (adminError || !adminProfile?.is_admin) {
      setStatus('Admin access is required for overrides.');
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ primary_team_id: teamId })
      .eq('id', targetUserId.trim());

    if (updateError) {
      setStatus(updateError.message);
      setSaving(false);
      return;
    }

    setStatus('Team override applied successfully.');
    setSaving(false);
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
