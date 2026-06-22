import type { Metadata } from 'next';
import { DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

// SPA prototype: all pages client-side, skip static prerendering
// Prevents Turbopack crash on Windows path casing (Huntch vs huntch)
export const dynamic = 'force-dynamic';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-jakarta', // keep same var name so globals.css needs no changes
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Huntch',
  description: 'גיוס חכם לעסקי מזון ואירוח',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#16241a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
