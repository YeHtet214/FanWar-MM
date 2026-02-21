import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">FanWar MM MVP</h1>
      <p className="text-slate-300">Step-by-step implementation of the core rivalry experience for Myanmar EPL fans.</p>
      <ol className="list-decimal space-y-2 pl-6 text-slate-200">
        <li>Complete onboarding and lock your primary club.</li>
        <li>Enter the team war room and post banter with votes and reactions.</li>
        <li>Join live match battleground threads.</li>
        <li>Track reputation leaderboard and moderation status.</li>
        <li>Generate memes from template presets.</li>
      </ol>
      <div className="flex flex-wrap gap-3 pt-2">
        <Link className="rounded-md bg-red-600 px-4 py-2 font-semibold" href="/onboarding">Start onboarding</Link>
        <Link className="rounded-md border border-slate-600 px-4 py-2" href="/war-room">Open war room</Link>
      </div>
    </section>
  );
}
