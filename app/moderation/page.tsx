'use client';

import { useEffect, useState } from 'react';
import { applyStrike } from '@/lib/domain';
import { useLanguage } from '@/lib/language';
import { reviewReportMutation } from '@/lib/repositories/post-mutations';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

type QueueItem = {
  id: string;
  reason: string;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  created_at: string;
  posts?: { id: string; body: string; author_id: string } | { id: string; body: string; author_id: string }[];
  reporter?: { id: string; username: string } | { id: string; username: string }[];
};

export default function ModerationPage() {
  const { t } = useLanguage();
  const [flagged, setFlagged] = useState<QueueItem[]>([]);
  const [pendingReview, setPendingReview] = useState<QueueItem[]>([]);
  const [resolved, setResolved] = useState<QueueItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [moderatorId, setModeratorId] = useState<string | null>(null);

  const loadQueues = async () => {
    try {
      setLoadError(null);
      const response = await fetch('/api/moderation/reports');
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFlagged([]);
        setPendingReview([]);
        setResolved([]);
        setLoadError(data.error ?? t('moderationLoadFailed'));
        return;
      }

      setFlagged(data.flagged ?? []);
      setPendingReview(data.pendingReview ?? []);
      setResolved(data.resolved ?? []);
    } catch (error) {
      console.error('Failed to load moderation queues', error);
      setFlagged([]);
      setPendingReview([]);
      setResolved([]);
      setLoadError(t('moderationLoadFailed'));
    }
  };

  useEffect(() => {
    const loadCurrentModerator = async () => {
      const supabase = createBrowserSupabaseClient();
      if (!supabase) {
        return;
      }

      const { data } = await supabase.auth.getUser();
      setModeratorId(data.user?.id ?? null);
    };

    void loadCurrentModerator();
    void loadQueues();
  }, []);

  const handleReview = async (reportId: string, decision: 'confirmed' | 'dismissed') => {
    try {
      setReviewError(null);
      await reviewReportMutation({ reportId, decision });
      await loadQueues();
    } catch (error) {
      console.error('Failed to review report', { error, reportId, decision, moderatorId });
      setReviewError(t('moderationReviewFailed'));
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
      {loadError && <p className="card text-red-300">{loadError}</p>}
      {reviewError && <p className="card text-red-300">{reviewError}</p>}
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
        <h2 className="text-lg font-semibold">{t('moderationFlagged')} ({flagged.length})</h2>
        {flagged.length === 0 && <p className="text-slate-400">{t('moderationNoFlagged')}</p>}
        {flagged.map((report) => (
          <div key={report.id} className="rounded border border-slate-700 p-2">
            <p className="text-sm">{report.reason}</p>
            <p className="text-xs text-slate-400">{new Date(report.created_at).toLocaleString()}</p>
            <div className="mt-2 flex gap-2">
              <button className="rounded bg-emerald-700 px-2 py-1 text-xs" onClick={() => handleReview(report.id, 'confirmed')}>{t('moderationConfirmViolation')}</button>
              <button className="rounded bg-slate-700 px-2 py-1 text-xs" onClick={() => handleReview(report.id, 'dismissed')}>{t('moderationDismiss')}</button>
            </div>
          </div>
        ))}
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">{t('moderationPendingReview')} ({pendingReview.length})</h2>
        {pendingReview.length === 0 && <p className="text-slate-400">{t('moderationNoPending')}</p>}
        {pendingReview.map((report) => (
          <div key={report.id} className="rounded border border-slate-700 p-2">
            <p className="text-sm">{report.reason}</p>
            <p className="text-xs text-slate-400">Status: {report.status}</p>
          </div>
        ))}
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">{t('moderationResolved')} ({resolved.length})</h2>
        {resolved.length === 0 && <p className="text-slate-400">{t('moderationNoResolved')}</p>}
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
