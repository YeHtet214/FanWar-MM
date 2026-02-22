'use client';

import Link from 'next/link';
import { languageNames, useLanguage } from '@/lib/language';

export function MainNav() {
  const { language, setLanguage, t } = useLanguage();

  const links = [
    [t('navSignIn'), '/auth'],
    [t('navOnboarding'), '/onboarding'],
    [t('navWarRoom'), '/war-room'],
    [t('navMatchThread'), '/match/m1'],
    [t('navLeaderboard'), '/leaderboard'],
    [t('navMemeLab'), '/meme'],
    [t('navModeration'), '/moderation']
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-3 p-4 text-sm">
        <Link href="/" className="mr-4 font-bold text-red-400">{t('appName')}</Link>
        {links.map(([label, href]) => (
          <Link className="text-slate-300 hover:text-white" key={href} href={href}>{label}</Link>
        ))}
        <label className="ml-auto flex items-center gap-2 text-slate-300" htmlFor="language-select">
          <span>{t('language')}:</span>
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
