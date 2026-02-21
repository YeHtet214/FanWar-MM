import { applyStrike, shouldAutoHide } from '@/lib/domain';

const samplePost = 'This is a political propaganda rant that should be reviewed.';

export default function ModerationPage() {
  const autoHidden = shouldAutoHide(samplePost);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Moderation & Safety</h1>
      <div className="card space-y-2">
        <p>Keyword filter result: <span className="font-semibold text-red-400">{autoHidden ? 'Auto-hide + report queue' : 'Allowed'}</span></p>
        <p className="text-slate-400">Sample text: {samplePost}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="card">
          <h2 className="font-semibold">Strike 1</h2>
          <p className="text-slate-300">Action: {applyStrike(0)}</p>
        </article>
        <article className="card">
          <h2 className="font-semibold">Strike 2</h2>
          <p className="text-slate-300">Action: {applyStrike(1)}</p>
        </article>
        <article className="card">
          <h2 className="font-semibold">Strike 3</h2>
          <p className="text-slate-300">Action: {applyStrike(2)}</p>
        </article>
      </div>
    </section>
  );
}
