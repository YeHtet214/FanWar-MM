'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'en' | 'my';

const STORAGE_KEY = 'fanwar-language';

export const languageNames: Record<Language, string> = {
  en: 'English',
  my: 'မြန်မာ'
};

const text = {
  appName: { en: 'FanWar MM', my: 'FanWar MM' },
  language: { en: 'Language', my: 'ဘာသာစကား' },
  navOnboarding: { en: 'Onboarding', my: 'စတင်အသုံးပြုခြင်း' },
  navSignIn: { en: 'Sign in', my: 'လက်မှတ်ထိုးဝင်ရန်' },
  navWarRoom: { en: 'War Room', my: 'တိုက်ပွဲခန်းမ' },
  navMatchThread: { en: 'Match Thread', my: 'ပွဲစဉ်ဆွေးနွေးခန်း' },
  navLeaderboard: { en: 'Leaderboard', my: 'အဆင့်ဇယား' },
  navMemeLab: { en: 'Meme Lab', my: 'မီမ်လုပ်ခန်း' },
  navModeration: { en: 'Moderation', my: 'စီမံခန့်ခွဲမှု' },
  homeTitle: { en: 'FanWar MM MVP', my: 'FanWar MM MVP' },
  homeDescription: {
    en: 'Step-by-step implementation of the core rivalry experience for Myanmar EPL fans.',
    my: 'မြန်မာ EPL ပရိသတ်များအတွက် ပြိုင်ဆိုင်မှုအတွေ့အကြုံကို အဆင့်လိုက် တည်ဆောက်ထားပါသည်။'
  },
  homeStep1: { en: 'Complete onboarding and lock your primary club.', my: 'စတင်အသုံးပြုခြင်း ပြီးစီးပြီး သင်၏ အဓိကအသင်းကို သတ်မှတ်ပါ။' },
  homeStep2: { en: 'Enter the team war room and post banter with votes and reactions.', my: 'အသင်းတိုက်ပွဲခန်းမထဲဝင်ပြီး မဲပေးမှု၊ reaction များနှင့်အတူ ပို့စ်တင်ပါ။' },
  homeStep3: { en: 'Join live match battleground threads.', my: 'Live ပွဲစဉ် Battleground thread များတွင် ပါဝင်ပါ။' },
  homeStep4: { en: 'Track reputation leaderboard and moderation status.', my: 'Reputation အဆင့်နှင့် moderation အခြေအနေကို စောင့်ကြည့်ပါ။' },
  homeStep5: { en: 'Generate memes from template presets.', my: 'Preset template များဖြင့် meme များ ဖန်တီးပါ။' },
  startOnboarding: { en: 'Start onboarding', my: 'စတင်အသုံးပြုရန်' },
  signInCreateAccount: { en: 'Sign in / Create account', my: 'လက်မှတ်ထိုးဝင်ရန် / အကောင့်ဖန်တီးရန်' },
  openWarRoom: { en: 'Open war room', my: 'တိုက်ပွဲခန်းမဖွင့်ရန်' },
  onboardingTitle: { en: 'Identity Onboarding', my: 'ကိုယ်ရေးအချက်အလက် စတင်သတ်မှတ်ခြင်း' },
  createAccount: { en: 'Create account', my: 'အကောင့်ဖန်တီးရန်' },
  createAccountDesc: { en: 'Sign in from the auth page using your email magic link, then come back to lock your team.', my: 'Auth စာမျက်နှာတွင် email magic link ဖြင့်ဝင်ရောက်ပြီးနောက် သင်၏အသင်းကို သတ်မှတ်ပါ။' },
  pickClub: { en: 'Pick your EPL club', my: 'သင်အကြိုက် EPL အသင်းကိုရွေးပါ' },
  pickClubDesc: { en: 'Your primary team is mandatory and locked after first selection. Team changes are admin-managed only.', my: 'အဓိကအသင်းရွေးချယ်မှုသည် မဖြစ်မနေလိုအပ်ပြီး တစ်ကြိမ်ရွေးပြီးနောက် lock လုပ်ထားမည်ဖြစ်သည်။ အသင်းပြောင်းခြင်းကို admin မှသာ စီမံနိုင်သည်။' },
  select: { en: 'Select', my: 'ရွေးချယ်ရန်' },
  step: { en: 'Step', my: 'အဆင့်' },
  warRoomFeed: { en: 'Team-only feed with votes + football reactions. Sorted by score then recency.', my: 'အသင်းအတွင်း feed ကို မဲများနှင့် football reaction များဖြင့် ပြထားသည်။ Score ပြီးနောက် အချိန်နောက်ဆုံးအလိုက် စီထားသည်။' },
  battleground: { en: 'Battleground', my: 'တိုက်ပွဲခင်း' },
  status: { en: 'Status', my: 'အခြေအနေ' },
  kickoff: { en: 'Kickoff', my: 'ကန်သွင်းချိန်' },
  liveMode: { en: 'Live Mode', my: 'Live မုဒ်' },
  on: { en: 'ON', my: 'ဖွင့်' },
  off: { en: 'OFF', my: 'ပိတ်' },
  weeklyLeaderboard: { en: 'Weekly Leaderboard', my: 'အပတ်စဉ် အဆင့်ဇယား' },
  weeklyLeaderboardDesc: { en: 'Lifetime points persist while weekly ranks reset via scheduled job.', my: 'စုစုပေါင်းအမှတ်များ ဆက်လက်ရှိနေပြီး အပတ်စဉ်အဆင့်များကို scheduled job ဖြင့် ပြန်စတင်မည်။' },
  rank: { en: 'Rank', my: 'အဆင့်' },
  user: { en: 'User', my: 'အသုံးပြုသူ' },
  club: { en: 'Club', my: 'အသင်း' },
  reputation: { en: 'Reputation', my: 'ဂုဏ်သတင်း' },
  title: { en: 'Title', my: 'ဘွဲ့' },
  memeGenerator: { en: 'Meme Generator (MVP)', my: 'Meme ဖန်တီးစက် (MVP)' },
  chooseMatch: { en: '1) Choose match', my: '၁) ပွဲရွေးချယ်ရန်' },
  targetRival: { en: '2) Target rival', my: '၂) ပြိုင်ဘက်ကို ရွေးချယ်ရန်' },
  fillTemplate: { en: '3) Fill template slots and export with FanWar MM watermark.', my: '၃) Template slot များကို ဖြည့်ပြီး FanWar MM watermark ဖြင့် export လုပ်ပါ။' },
  slots: { en: 'Slots', my: 'နေရာများ' },
  moderationSafety: { en: 'Moderation & Safety', my: 'စီမံခန့်ခွဲမှု နှင့် လုံခြုံရေး' },
  keywordFilterResult: { en: 'Keyword filter result', my: 'Keyword filter ရလဒ်' },
  autoHideReport: { en: 'Auto-hide + report queue', my: 'အလိုအလျောက် ဖျောက် + report စာရင်း' },
  allowed: { en: 'Allowed', my: 'ခွင့်ပြု' },
  sampleText: { en: 'Sample text', my: 'နမူနာစာသား' },
  strike: { en: 'Strike', my: 'ပြစ်ချက်' },
  action: { en: 'Action', my: 'လုပ်ဆောင်ချက်' },
  score: { en: 'Score', my: 'အမှတ်' },
  noReactionsYet: { en: 'No reactions yet', my: 'Reaction မရှိသေးပါ' },

  report: { en: 'Report', my: 'တိုင်ကြားရန်' },
  moderationFlagged: { en: 'Flagged', my: 'အလံတင်ထားသည်' },
  moderationPendingReview: { en: 'Pending review', my: 'စစ်ဆေးရန်စောင့်ဆိုင်း' },
  moderationResolved: { en: 'Resolved', my: 'ဖြေရှင်းပြီး' },
  moderationNoFlagged: { en: 'No flagged reports.', my: 'အလံတင် report မရှိသေးပါ။' },
  moderationNoPending: { en: 'No pending reviews.', my: 'စောင့်ဆိုင်း review မရှိပါ။' },
  moderationNoResolved: { en: 'No resolved reviews.', my: 'ဖြေရှင်းပြီး review မရှိပါ။' },
  moderationConfirmViolation: { en: 'Confirm violation', my: 'ချိုးဖောက်မှု အတည်ပြု' },
  moderationDismiss: { en: 'Dismiss', my: 'ပယ်ဖျက်ရန်' },
  moderationLoadFailed: { en: 'Failed to load moderation queues.', my: 'moderation စာရင်းများ ဖတ်မရပါ။' },
  moderationReviewFailed: { en: 'Failed to submit moderation review.', my: 'moderation review တင်မရပါ။' },
  muted: { en: 'muted', my: 'အသံပိတ်' },
  suspended: { en: 'suspended', my: 'ယာယီပိတ်ပင်' },
  banned: { en: 'banned', my: 'ပိတ်ပင်ပြီး' },
} as const;

type TextKey = keyof typeof text;

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TextKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved === 'en' || saved === 'my') {
      setLanguage(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: TextKey) => text[key][language]
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
