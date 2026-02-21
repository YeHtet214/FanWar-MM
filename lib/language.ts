'use client';

import { useEffect, useState } from 'react';

export type Language = 'en' | 'my';

const STORAGE_KEY = 'fanwar-language';

export const languageNames: Record<Language, string> = {
  en: 'English',
  my: 'မြန်မာ'
};

export const translations = {
  appName: {
    en: 'FanWar MM',
    my: 'FanWar MM'
  },
  nav: {
    onboarding: { en: 'Onboarding', my: 'စတင်အသုံးပြုခြင်း' },
    warRoom: { en: 'War Room', my: 'တိုက်ပွဲခန်းမ' },
    matchThread: { en: 'Match Thread', my: 'ပွဲစဉ်ဆွေးနွေးခန်း' },
    leaderboard: { en: 'Leaderboard', my: 'အဆင့်ဇယား' },
    memeLab: { en: 'Meme Lab', my: 'မီမ်လုပ်ခန်း' },
    moderation: { en: 'Moderation', my: 'စီမံခန့်ခွဲမှု' },
    language: { en: 'Language', my: 'ဘာသာစကား' }
  },
  home: {
    title: { en: 'FanWar MM MVP', my: 'FanWar MM MVP' },
    description: {
      en: 'Step-by-step implementation of the core rivalry experience for Myanmar EPL fans.',
      my: 'မြန်မာ EPL ပရိသတ်များအတွက် ပြိုင်ဆိုင်မှုအတွေ့အကြုံကို အဆင့်လိုက် တည်ဆောက်ထားပါသည်။'
    },
    startOnboarding: { en: 'Start onboarding', my: 'စတင်အသုံးပြုရန်' },
    openWarRoom: { en: 'Open war room', my: 'တိုက်ပွဲခန်းမဖွင့်ရန်' }
  }
} as const;

export function useLanguage(defaultLanguage: Language = 'en') {
  const [language, setLanguage] = useState<Language>(defaultLanguage);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved === 'en' || saved === 'my') {
      setLanguage(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  return { language, setLanguage };
}
