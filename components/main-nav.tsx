import Link from 'next/link';

const links = [
  ['Onboarding', '/onboarding'],
  ['War Room', '/war-room'],
  ['Match Thread', '/match/m1'],
  ['Leaderboard', '/leaderboard'],
  ['Meme Lab', '/meme'],
  ['Moderation', '/moderation']
];

export function MainNav() {
  return (
    <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-5xl flex-wrap gap-3 p-4 text-sm">
        <Link href="/" className="mr-4 font-bold text-red-400">FanWar MM</Link>
        {links.map(([label, href]) => (
          <Link className="text-slate-300 hover:text-white" key={href} href={href}>{label}</Link>
        ))}
      </nav>
    </header>
  );
}
