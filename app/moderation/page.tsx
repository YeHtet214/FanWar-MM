'use client';

import { useEffect, useState } from 'react';
import { applyStrike } from '@/lib/domain';
import { useLanguage } from '@/lib/language';
import { reviewReportMutation } from '@/lib/repositories/post-mutations';

type QueueItem = {
  id: string;
  reason: string;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  created_at: string;
  posts?: { id: string; body: string; author_id: string } | { id: string; body: string; author_id: string }[];
  reporter?: { id: string; username: string } | { id: string; username: string }[];
};

const DEMO_MODERATOR_ID = 'demo-moderator-id';

export default function ModerationPage() {
  const { t } = useLanguage();
  const [flagged, setFlagged] = useState<QueueItem[]>([]);
  const [pendingReview, setPendingReview] = useState<QueueItem[]>([]);
  const [resolved, setResolved] = useState<QueueItem[]>([]);

  const loadQueues = async () => {
    const response = await fetch('/api/moderation/reports');
    if (!response.ok) {
      return;
    }

    const data = await response.json();
    setFlagged(data.flagged ?? []);
    setPendingReview(data.pendingReview ?? []);
    setResolved(data.resolved ?? []);
  };

  useEffect(() => {
    void loadQueues();
  }, []);

  const handleReview = async (reportId: string, decision: 'confirmed' | 'dismissed') => {
    try {
      await reviewReportMutation({ reportId, reviewerId: DEMO_MODERATOR_ID, decision });
      await loadQueues();
    } catch {
      // ignore demo flow errors
    }
  };

  const actionMap: Record<string, string> = {
    muted: t('muted'),
    suspended: t('suspended'),
    banned: t('banned')
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{t('moderationSafety')}</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="card">
          <h2 className="font-semibold">{t('strike')} 1</h2>
          <p className="text-slate-300">{t('action')}: {actionMap[applyStrike(0)] ?? applyStrike(0)}</p>
        </article>
        <article className="card">
          <h2 className="font-semibold">{t('strike')} 2</h2>
          <p className="text-slate-300">{t('action')}: {actionMap[applyStrike(1)] ?? applyStrike(1)}</p>
        </article>
        <article className="card">
          <h2 className="font-semibold">{t('strike')} 3</h2>
          <p className="text-slate-300">{t('action')}: {actionMap[applyStrike(2)] ?? applyStrike(2)}</p>
        </article>
      </div>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Flagged ({flagged.length})</h2>
        {flagged.length === 0 && <p className="text-slate-400">No flagged reports.</p>}
        {flagged.map((report) => (
          <div key={report.id} className="rounded border border-slate-700 p-2">
            <p className="text-sm">{report.reason}</p>
            <p className="text-xs text-slate-400">{new Date(report.created_at).toLocaleString()}</p>
            <div className="mt-2 flex gap-2">
              <button className="rounded bg-emerald-700 px-2 py-1 text-xs" onClick={() => handleReview(report.id, 'confirmed')}>Confirm violation</button>
              <button className="rounded bg-slate-700 px-2 py-1 text-xs" onClick={() => handleReview(report.id, 'dismissed')}>Dismiss</button>
            </div>
          </div>
        ))}
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Pending review ({pendingReview.length})</h2>
        {pendingReview.length === 0 && <p className="text-slate-400">No pending reviews.</p>}
        {pendingReview.map((report) => (
          <div key={report.id} className="rounded border border-slate-700 p-2">
            <p className="text-sm">{report.reason}</p>
            <p className="text-xs text-slate-400">Status: {report.status}</p>
          </div>
        ))}
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Resolved ({resolved.length})</h2>
        {resolved.length === 0 && <p className="text-slate-400">No resolved reviews.</p>}
        {resolved.map((report) => (
          <div key={report.id} className="rounded border border-slate-700 p-2">
            <p className="text-sm">{report.reason}</p>
            <p className="text-xs text-slate-400">Status: {report.status}</p>
          </div>
        ))}
      </section>
    </section>
  );
}
