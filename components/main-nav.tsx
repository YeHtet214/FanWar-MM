'use client';

import Link from 'next/link';
import { languageNames, translations, useLanguage } from '@/lib/language';

export function MainNav() {
  const { language, setLanguage } = useLanguage('en');

  const links = [
    [translations.nav.onboarding[language], '/onboarding'],
    [translations.nav.warRoom[language], '/war-room'],
    [translations.nav.matchThread[language], '/match/m1'],
    [translations.nav.leaderboard[language], '/leaderboard'],
    [translations.nav.memeLab[language], '/meme'],
    [translations.nav.moderation[language], '/moderation']
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-3 p-4 text-sm">
        <Link href="/" className="mr-4 font-bold text-red-400">{translations.appName[language]}</Link>
        {links.map(([label, href]) => (
          <Link className="text-slate-300 hover:text-white" key={href} href={href}>{label}</Link>
        ))}
        <label className="ml-auto flex items-center gap-2 text-slate-300" htmlFor="language-select">
          <span>{translations.nav.language[language]}:</span>
          <select
            id="language-select"
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white"
            value={language}
            onChange={(event) => setLanguage(event.target.value as 'en' | 'my')}
          >
            <option value="en">{languageNames.en}</option>
            <option value="my">{languageNames.my}</option>
          </select>
        </label>
      </nav>
    </header>
  );
}
