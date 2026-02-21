'use client';

import Link from 'next/link';
import { translations, useLanguage } from '@/lib/language';

export default function HomePage() {
  const { language } = useLanguage('en');

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">{translations.home.title[language]}</h1>
      <p className="text-slate-300">{translations.home.description[language]}</p>
      <ol className="list-decimal space-y-2 pl-6 text-slate-200">
        <li>Complete onboarding and lock your primary club.</li>
        <li>Enter the team war room and post banter with votes and reactions.</li>
        <li>Join live match battleground threads.</li>
        <li>Track reputation leaderboard and moderation status.</li>
        <li>Generate memes from template presets.</li>
      </ol>
      <div className="flex flex-wrap gap-3 pt-2">
        <Link className="rounded-md bg-red-600 px-4 py-2 font-semibold" href="/onboarding">{translations.home.startOnboarding[language]}</Link>
        <Link className="rounded-md border border-slate-600 px-4 py-2" href="/war-room">{translations.home.openWarRoom[language]}</Link>
      </div>
    </section>
  );
}
