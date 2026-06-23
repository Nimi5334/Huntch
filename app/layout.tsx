import type { Metadata } from 'next';
import { Inter, Playfair_Display, Frank_Ruhl_Libre, Heebo, JetBrains_Mono } from 'next/font/google';
import './globals.css';

// SPA prototype: all pages client-side, skip static prerendering
// Prevents Turbopack crash on Windows path casing (Huntch vs huntch)
export const dynamic = 'force-dynamic';

// ── Emerald Zenith type system ──
// UI text: Inter (latin) + Heebo (hebrew). Headlines: Playfair Display (latin) + Frank Ruhl Libre (hebrew serif)
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ui',
  display: 'swap',
});

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-he',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-head',
  display: 'swap',
});

const frankRuhl = Frank_Ruhl_Libre({
  subsets: ['hebrew', 'latin'],
  weight: ['500', '700', '900'],
  variable: '--font-head-he',
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
  themeColor: '#f1f8f3',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${inter.variable} ${heebo.variable} ${playfair.variable} ${frankRuhl.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
