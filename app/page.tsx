'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/language';

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">{t('homeTitle')}</h1>
      <p className="text-slate-300">{t('homeDescription')}</p>
      <ol className="list-decimal space-y-2 pl-6 text-slate-200">
        <li>{t('homeStep1')}</li>
        <li>{t('homeStep2')}</li>
        <li>{t('homeStep3')}</li>
        <li>{t('homeStep4')}</li>
        <li>{t('homeStep5')}</li>
      </ol>
      <div className="flex flex-wrap gap-3 pt-2">
        <Link className="rounded-md bg-red-600 px-4 py-2 font-semibold" href="/onboarding">{t('startOnboarding')}</Link>
        <Link className="rounded-md border border-slate-600 px-4 py-2" href="/war-room">{t('openWarRoom')}</Link>
      </div>
    </section>
  );
}
