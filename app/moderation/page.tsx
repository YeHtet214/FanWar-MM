'use client';

import { applyStrike, shouldAutoHide } from '@/lib/domain';
import { useLanguage } from '@/lib/language';

const samplePost = 'This is a political propaganda rant that should be reviewed.';

export default function ModerationPage() {
  const { t } = useLanguage();
  const autoHidden = shouldAutoHide(samplePost);

  const actionMap: Record<string, string> = {
    muted: t('muted'),
    suspended: t('suspended'),
    banned: t('banned')
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{t('moderationSafety')}</h1>
      <div className="card space-y-2">
        <p>{t('keywordFilterResult')}: <span className="font-semibold text-red-400">{autoHidden ? t('autoHideReport') : t('allowed')}</span></p>
        <p className="text-slate-400">{t('sampleText')}: {samplePost}</p>
      </div>
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
    </section>
  );
}
