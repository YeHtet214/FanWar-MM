import './globals.css';
import type { Metadata } from 'next';
import { MainNav } from '@/components/main-nav';
import { LanguageProvider } from '@/lib/language';

export const metadata: Metadata = {
  title: 'FanWar MM',
  description: 'Myanmar EPL rivalry app'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <LanguageProvider>
          <MainNav />
          <main className="mx-auto min-h-screen w-full max-w-5xl p-4">{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}
